const fs = require('fs');
const path = require('path');
const {execFile, spawn} = require('child_process');

const WINDOWS_CANDIDATES = [
  process.env.LIBREOFFICE_PATH,
  'C:\\Program Files\\LibreOffice\\program\\soffice.com',
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
].filter(Boolean);

async function convertOfficeDocument(inputPath, originalName, targetFormat, outputPath) {
  if (targetFormat !== 'pdf') {
    throw new Error('The backend currently supports DOCX/XLSX/PPTX to PDF first. Other cloud conversions will follow next.');
  }

  const binary = resolveLibreOfficeBinary();
  if (!binary) {
    throw new Error(
      'LibreOffice was not found on this server. Install LibreOffice or set LIBREOFFICE_PATH in backend/.env.',
    );
  }

  const workDir = path.join(path.dirname(outputPath), `.lo-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  fs.mkdirSync(workDir, {recursive: true});

  try {
    const safeInputName = buildWorkFileName(originalName);
    const stagedInput = path.join(workDir, safeInputName);
    fs.copyFileSync(inputPath, stagedInput);

    await runLibreOffice(binary, stagedInput, workDir);

    const expectedOutput = path.join(
      workDir,
      `${path.basename(safeInputName, path.extname(safeInputName))}.${targetFormat}`,
    );
    const producedOutput = fs.existsSync(expectedOutput)
      ? expectedOutput
      : resolveProducedOutput(workDir, targetFormat);

    if (!producedOutput) {
      throw new Error('LibreOffice did not produce the converted file.');
    }

    fs.copyFileSync(producedOutput, outputPath);
    return outputPath;
  } finally {
    try {
      fs.rmSync(workDir, {recursive: true, force: true});
    } catch {
      // Ignore cleanup failures for now.
    }
  }
}

function resolveLibreOfficeBinary() {
  for (const candidate of WINDOWS_CANDIDATES) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return process.platform === 'win32' ? null : 'soffice';
}

function runLibreOffice(binary, inputPath, outputDir) {
  const args = ['--headless', '--convert-to', 'pdf', '--outdir', outputDir, inputPath];

  return new Promise((resolve, reject) => {
    execFile(binary, args, {windowsHide: true}, (error, stdout = '', stderr = '') => {
      if (!error) {
        resolve({stdout, stderr});
        return;
      }

      if (process.platform === 'win32' && error.code === 'EPERM') {
        runLibreOfficeWithCmd(binary, args)
          .then(resolve)
          .catch(reject);
        return;
      }

      reject(
        new Error(
          `LibreOffice conversion failed.${stderr ? ` ${stderr.trim()}` : ''}${stdout ? ` ${stdout.trim()}` : ''}${error.message ? ` ${error.message}` : ''}`,
        ),
      );
    });
  });
}

function runLibreOfficeWithCmd(binary, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('cmd.exe', ['/d', '/c', `"${binary}"`, ...args], {windowsHide: true});

    let stderr = '';
    let stdout = '';

    child.stdout.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', reject);

    child.on('close', code => {
      if (code === 0) {
        resolve({stdout, stderr});
        return;
      }

      reject(
        new Error(
          `LibreOffice conversion failed with exit code ${code}.${stderr ? ` ${stderr.trim()}` : ''}${stdout ? ` ${stdout.trim()}` : ''}`,
        ),
      );
    });
  });
}

function buildWorkFileName(originalName) {
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  const safeBase = baseName.replace(/[^a-zA-Z0-9-_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return `${safeBase || 'document'}${extension.toLowerCase()}`;
}

function resolveProducedOutput(outputDir, targetFormat) {
  const matches = fs
    .readdirSync(outputDir)
    .filter(fileName => path.extname(fileName).toLowerCase() === `.${targetFormat}`)
    .map(fileName => path.join(outputDir, fileName))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs);

  return matches[0] || null;
}

function canConvertWithLibreOffice(mimeType, targetFormat, originalName = '') {
  if (targetFormat !== 'pdf') {
    return false;
  }

  const supportedMimeTypes = new Set([
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]);

  if (supportedMimeTypes.has(mimeType)) {
    return true;
  }

  const extension = path.extname(originalName).toLowerCase();
  return new Set(['.docx', '.ppt', '.pptx', '.xls', '.xlsx']).has(extension);
}

module.exports = {
  canConvertWithLibreOffice,
  convertOfficeDocument,
};
