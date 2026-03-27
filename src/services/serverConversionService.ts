import RNFS from 'react-native-fs';

function validateServerUrl(serverUrl: string) {
  if (!serverUrl) {
    throw new Error('This conversion requires a server URL.');
  }

  let parsed: URL;
  try {
    parsed = new URL(serverUrl);
  } catch {
    throw new Error('Enter a valid server URL, for example https://convert.example.com/api/convert');
  }

  const isLocalhost =
    parsed.hostname === 'localhost' ||
    parsed.hostname === '127.0.0.1' ||
    parsed.hostname === '10.0.2.2';

  if (parsed.protocol !== 'https:' && !isLocalhost) {
    throw new Error('Cloud conversions must use HTTPS unless you are testing against localhost.');
  }

  return parsed.toString();
}

export async function convertWithServer(
  inputPath: string,
  targetFormat: string,
  serverUrl: string,
  serverApiKey: string,
  fileName: string,
  mimeType: string,
) {
  const validatedUrl = validateServerUrl(serverUrl);

  const formData = new FormData();
  formData.append('file', {
    uri: inputPath,
    name: fileName,
    type: mimeType,
  } as never);
  formData.append('format', targetFormat);

  const timeout = setTimeout(() => controller.abort(), 45000);
  const controller = new AbortController();

  let response: Response;
  try {
    response = await fetch(validatedUrl, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
        'x-api-key': serverApiKey,
      },
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The cloud conversion server took too long to respond.');
    }
    throw new Error('Unable to reach the cloud conversion server. Check your internet connection and server URL.');
  }
  clearTimeout(timeout);

  if (!response.ok) {
    let serverMessage = `Server conversion failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as {error?: string};
      if (payload.error) {
        serverMessage = payload.error;
      }
    } catch {
      // Keep the fallback message.
    }

    throw new Error(serverMessage);
  }

  const result = (await response.json()) as {downloadUrl?: string};
  if (!result.downloadUrl) {
    throw new Error('Server did not return a download URL.');
  }

  const convertedPath = `${RNFS.DocumentDirectoryPath}/converted-${Date.now()}.${targetFormat}`;
  const download = RNFS.downloadFile({
    fromUrl: result.downloadUrl,
    toFile: convertedPath,
    headers: {
      'x-api-key': serverApiKey,
    },
  });

  await download.promise;
  return convertedPath;
}

export async function checkServerHealth(serverUrl: string, serverApiKey: string) {
  const validatedUrl = validateServerUrl(serverUrl);
  const healthUrl = validatedUrl.replace(/\/api\/convert\/?$/i, '/health');

  const response = await fetch(healthUrl, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(serverApiKey ? {'x-api-key': serverApiKey} : {}),
    },
  });

  if (!response.ok) {
    let healthMessage = `Health check failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as {error?: string};
      if (payload.error) {
        healthMessage = payload.error;
      }
    } catch {
      // Ignore parsing failures and keep the fallback message.
    }

    throw new Error(healthMessage);
  }

  return response.json();
}
