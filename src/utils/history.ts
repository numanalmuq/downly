import { DownloadHistoryItem } from '../types';

const STORAGE_KEY = 'downly_download_history';
export const HISTORY_UPDATED_EVENT = 'downly-history-updated';

/**
 * Retrieve the current download history from localStorage
 */
export function getDownloadHistory(): DownloadHistoryItem[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.error('Failed to parse download history:', err);
    return [];
  }
}

/**
 * Persist download history to localStorage and broadcast an update event
 */
export function saveDownloadHistory(items: DownloadHistoryItem[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(HISTORY_UPDATED_EVENT, { detail: items }));
  } catch (err) {
    console.error('Failed to save download history:', err);
  }
}

/**
 * Add a new downloaded item to history
 */
export function addDownloadHistory(item: {
  platform: string;
  platformName: string;
  title: string;
  author?: string;
  sourceUrl: string;
  filename: string;
  format: 'mp4' | 'mp3' | 'image' | 'm4a' | 'zip' | string;
  quality?: string;
  type: 'video' | 'audio' | 'image' | 'zip';
  downloadUrl: string;
  thumbnail?: string;
  fileSize?: string;
}): DownloadHistoryItem {
  const current = getDownloadHistory();

  const now = new Date();
  const newItem: DownloadHistoryItem = {
    id: `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: now.toISOString(),
    formattedDate: now.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    ...item,
  };

  // Avoid identical duplicate within last 3 seconds
  const isDuplicate = current.some(
    (existing) =>
      existing.filename === newItem.filename &&
      Math.abs(new Date(existing.timestamp).getTime() - now.getTime()) < 3000
  );

  if (!isDuplicate) {
    const updated = [newItem, ...current].slice(0, 300); // Keep last 300 entries
    saveDownloadHistory(updated);
  }

  return newItem;
}

/**
 * Remove a specific item from history
 */
export function deleteDownloadHistoryItem(id: string): void {
  const current = getDownloadHistory();
  const updated = current.filter((item) => item.id !== id);
  saveDownloadHistory(updated);
}

/**
 * Remove all history items
 */
export function clearDownloadHistory(): void {
  saveDownloadHistory([]);
}

/**
 * Export history as a formatted JSON file for backup or personal tracking
 */
export function exportHistoryAsJSON(customItems?: DownloadHistoryItem[]): {
  success: boolean;
  filename: string;
  count: number;
} {
  const items = customItems || getDownloadHistory();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const filename = `downly_download_history_${dateStr}.json`;

  const exportPayload = {
    app: 'Downly Media Downloader',
    exportedAt: now.toISOString(),
    exportedAtLocal: now.toLocaleString('id-ID'),
    totalDownloads: items.length,
    history: items,
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

  return {
    success: true,
    filename,
    count: items.length,
  };
}
