export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatDate(timestamp?: number | string) {
  if (!timestamp) {
    return 'Unknown date';
  }
  return new Date(timestamp).toLocaleString();
}

export function formatEta(seconds?: number) {
  if (!seconds || seconds <= 0) {
    return 'Almost done';
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s left` : `${secs}s left`;
}
