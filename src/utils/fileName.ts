export function getExtension(name: string) {
  return (name.split('.').pop() || '').toLowerCase();
}

export function stripExtension(name: string) {
  return name.replace(/\.[^.]+$/, '');
}

export function buildOutputName(originalName: string, extension: string, customFileName?: string) {
  const base = customFileName?.trim() || stripExtension(originalName);
  return `${base}.${extension}`;
}
