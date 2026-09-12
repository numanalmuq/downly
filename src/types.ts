export interface MediaOption {
  format: 'mp4' | 'mp3' | 'image' | 'm4a';
  quality?: string;
  url: string;
  size?: string;
  type: 'video' | 'audio' | 'image';
  label: string;
  thumbnail?: string;
}

export interface SlideItem {
  index: number;
  type: 'image' | 'video';
  format: 'mp4' | 'image';
  url: string;
  thumbnail?: string;
  quality?: string;
  label?: string;
  filename?: string;
}

export interface ExtractedMedia {
  platform: string;
  platformName: string;
  mediaType?: 'reel' | 'post' | 'carousel' | 'video' | 'audio';
  title: string;
  author?: string;
  authorUsername?: string;
  thumbnail?: string;
  duration?: string;
  sourceUrl: string;
  options: MediaOption[];
  slides?: SlideItem[];
}

export interface PlatformInfo {
  key: string;
  name: string;
  badgeColor: string;
  domains: string[];
  formats: string;
}

export interface DownloadHistoryItem {
  id: string;
  timestamp: string; // ISO 8601 string
  formattedDate: string;
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
}
