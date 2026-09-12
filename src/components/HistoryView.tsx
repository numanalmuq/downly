import React, { useState, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import {
  Download,
  FileJson,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Copy,
  Check,
  RefreshCw,
  Video,
  Music,
  Image as ImageIcon,
  Archive,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DownloadHistoryItem } from '../types';
import {
  getDownloadHistory,
  deleteDownloadHistoryItem,
  clearDownloadHistory,
  exportHistoryAsJSON,
  HISTORY_UPDATED_EVENT,
} from '../utils/history';
import {
  TikTokLogo,
  InstagramLogo,
  YouTubeLogo,
  TwitterLogo,
  FacebookLogo,
  PinterestLogo,
  SpotifyLogo,
  ThreadsLogo,
  CapCutLogo,
  SoundcloudLogo,
  RedditLogo,
  GenericWebLogo,
} from './Icons';

interface HistoryViewProps {
  onReExtract: (url: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onReExtract }) => {
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'video' | 'audio' | 'image' | 'zip'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);

  // Sync history on mount and on storage events
  useEffect(() => {
    const updateList = () => {
      setHistory(getDownloadHistory());
    };

    updateList();

    window.addEventListener(HISTORY_UPDATED_EVENT, updateList);
    window.addEventListener('storage', updateList);

    return () => {
      window.removeEventListener(HISTORY_UPDATED_EVENT, updateList);
      window.removeEventListener('storage', updateList);
    };
  }, []);

  // Filtered items
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchSearch =
        !searchQuery.trim() ||
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.platformName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sourceUrl?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchFormat =
        formatFilter === 'all' ||
        (formatFilter === 'video' && item.type === 'video') ||
        (formatFilter === 'audio' && item.type === 'audio') ||
        (formatFilter === 'image' && item.type === 'image') ||
        (formatFilter === 'zip' && (item.type === 'zip' || item.format === 'zip'));

      return matchSearch && matchFormat;
    });
  }, [history, searchQuery, formatFilter]);

  // Handle Export JSON
  const handleExportJSON = () => {
    if (history.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'RIWAYAT KOSONG',
        text: 'Belum ada data riwayat unduhan untuk diekspor.',
        confirmButtonColor: '#000000',
      });
      return;
    }

    const res = exportHistoryAsJSON(history);

    Swal.fire({
      icon: 'success',
      title: 'EXPORT BERHASIL!',
      html: `
        <div class="text-left font-sans text-xs space-y-1.5 mt-2">
          <p><strong>${res.count} item unduhan</strong> berhasil diekspor ke dalam file JSON.</p>
          <div class="p-2 bg-zinc-100 border border-black font-code text-[11px] break-all">
            ${res.filename}
          </div>
          <p class="text-zinc-600 mt-2">File ini dapat digunakan untuk backup data, impor ke spreadsheet, atau catatan arsip pribadi Anda.</p>
        </div>
      `,
      confirmButtonText: 'OKE',
      confirmButtonColor: '#000000',
    });
  };

  // Handle Clear All
  const handleClearAll = () => {
    if (history.length === 0) return;

    Swal.fire({
      title: 'HAPUS SEMUA RIWAYAT?',
      text: 'Semua rekaman riwayat unduhan di perangkat ini akan dibersihkan. Tindakan ini tidak dapat dibatalkan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#BD081C',
      cancelButtonColor: '#000000',
      confirmButtonText: 'YA, HAPUS SEMUA',
      cancelButtonText: 'BATAL',
      reverseButtons: true,
      customClass: {
        popup: 'border-[3px] border-black shadow-[6px_6px_0px_#000] font-display',
      },
    }).then((result) => {
      if (result.isConfirmed) {
        clearDownloadHistory();
        Swal.fire({
          icon: 'success',
          title: 'RIWAYAT DIBERSIHKAN',
          text: 'Seluruh riwayat unduhan telah dihapus.',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  // Handle Delete Single Item
  const handleDeleteItem = (id: string, filename: string) => {
    deleteDownloadHistoryItem(id);
    Swal.fire({
      icon: 'info',
      title: 'DIHAPUS DARI RIWAYAT',
      text: filename,
      timer: 1200,
      showConfirmButton: false,
      toast: true,
      position: 'top',
    });
  };

  // Copy Source URL
  const handleCopySourceUrl = (item: DownloadHistoryItem) => {
    navigator.clipboard.writeText(item.sourceUrl);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Render Platform Logo
  const renderPlatformLogo = (platform: string) => {
    const p = platform.toLowerCase();
    switch (p) {
      case 'tiktok':
        return <TikTokLogo className="w-3.5 h-3.5" />;
      case 'instagram':
        return <InstagramLogo className="w-3.5 h-3.5" />;
      case 'youtube':
        return <YouTubeLogo className="w-3.5 h-3.5" />;
      case 'twitter':
        return <TwitterLogo className="w-3.5 h-3.5" />;
      case 'facebook':
        return <FacebookLogo className="w-3.5 h-3.5" />;
      case 'pinterest':
        return <PinterestLogo className="w-3.5 h-3.5" />;
      case 'spotify':
        return <SpotifyLogo className="w-3.5 h-3.5" />;
      case 'threads':
        return <ThreadsLogo className="w-3.5 h-3.5" />;
      case 'capcut':
        return <CapCutLogo className="w-3.5 h-3.5" />;
      case 'soundcloud':
        return <SoundcloudLogo className="w-3.5 h-3.5" />;
      case 'reddit':
        return <RedditLogo className="w-3.5 h-3.5" />;
      default:
        return <GenericWebLogo className="w-3.5 h-3.5" />;
    }
  };

  // Render Type Badge Icon
  const renderTypeIcon = (type: string, format: string) => {
    if (type === 'video' || format === 'mp4') return <Video className="w-3 h-3" />;
    if (type === 'audio' || format === 'mp3') return <Music className="w-3 h-3" />;
    if (type === 'zip' || format === 'zip') return <Archive className="w-3 h-3" />;
    return <ImageIcon className="w-3 h-3" />;
  };

  return (
    <section id="download-history-section" className="mt-4 mb-8">
      {/* Header & Main Export JSON Action */}
      <div className="border-b-2 border-black dark:border-white pb-2.5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xs uppercase tracking-tight text-black dark:text-white">
                [ 02 // RIWAYAT UNDUHAN & BACKUP ]
              </span>
              <span className="font-code text-[10px] px-1.5 py-0.2 bg-[#FFE600] text-black font-extrabold border border-black">
                {history.length} ITEM
              </span>
            </div>
            <p className="font-sans text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
              Daftar konten yang telah berhasil diunduh ke perangkat Anda.
            </p>
          </div>

          {/* Action Buttons: Export JSON & Clear */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="export-history-json-btn"
              type="button"
              onClick={handleExportJSON}
              disabled={history.length === 0}
              className={`py-1.5 px-3 border-2 border-black font-display font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] transition-all cursor-pointer ${
                history.length === 0
                  ? 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed opacity-70'
                  : 'bg-[#FFE600] text-black hover:bg-yellow-400 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
              }`}
              title="Ekspor riwayat ke file .JSON untuk backup atau personal tracking"
            >
              <FileJson className="w-4 h-4 shrink-0 text-black" />
              <span>EXPORT JSON</span>
            </button>

            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="py-1.5 px-2 bg-white dark:bg-zinc-900 text-red-600 dark:text-red-400 border-2 border-black dark:border-white font-display font-bold text-xs uppercase flex items-center gap-1 shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] hover:bg-red-50 dark:hover:bg-red-950/30 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                title="Hapus seluruh riwayat unduhan"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        {history.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-black/10 dark:border-white/10 space-y-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul, kreator, platform, atau nama file..."
                className="w-full pl-8 pr-8 py-1.5 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white font-sans text-xs text-black dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-black dark:hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Format Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              <span className="font-code text-[10px] text-zinc-500 uppercase flex items-center gap-1 shrink-0 mr-1">
                <Filter className="w-3 h-3" /> FILTER:
              </span>
              {[
                { key: 'all', label: 'SEMUA' },
                { key: 'video', label: 'VIDEO (MP4)' },
                { key: 'audio', label: 'AUDIO (MP3)' },
                { key: 'image', label: 'GAMBAR' },
                { key: 'zip', label: 'CAROUSEL ZIP' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFormatFilter(tab.key as any)}
                  className={`px-2 py-0.5 border border-black dark:border-white font-code text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                    formatFilter === tab.key
                      ? 'bg-black text-white dark:bg-white dark:text-black'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* History Items List */}
      {history.length === 0 ? (
        <div className="p-6 bg-white dark:bg-[#18181b] border-2 border-black dark:border-white shadow-[4px_4px_0px_#000] dark:shadow-[4px_4px_0px_#fff] text-center">
          <div className="w-12 h-12 mx-auto mb-3 bg-[#FFE600] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <FileJson className="w-6 h-6 text-black" />
          </div>
          <h3 className="font-display font-black text-sm uppercase text-black dark:text-white">
            BELUM ADA RIWAYAT UNDUHAN
          </h3>
          <p className="font-sans text-xs text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
            Setiap media yang Anda unduh (video TikTok, Reels, YouTube Shorts, Spotify, atau CapCut) akan otomatis tercatat di sini dan dapat diekspor menjadi file backup JSON.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-4 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white text-center">
          <p className="font-sans text-xs text-zinc-500">
            Tidak ada item riwayat yang cocok dengan kata kunci <strong>"{searchQuery}"</strong>.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFormatFilter('all');
            }}
            className="mt-2 text-xs font-bold underline text-black dark:text-white"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-white dark:bg-[#18181b] border-2 border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] flex flex-col gap-2.5 transition-all"
            >
              {/* Card Top: Platform, Type, and Timestamp */}
              <div className="flex items-center justify-between gap-2 border-b border-black/10 dark:border-white/10 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 bg-black text-white dark:bg-white dark:text-black border border-black flex items-center justify-center shrink-0">
                    {renderPlatformLogo(item.platform)}
                  </div>
                  <span className="font-display font-extrabold text-[11px] uppercase tracking-tight text-black dark:text-white">
                    {item.platformName}
                  </span>
                  <span className="font-code text-[9px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-black/30 dark:border-white/30 text-zinc-700 dark:text-zinc-300 uppercase flex items-center gap-1 font-bold">
                    {renderTypeIcon(item.type, item.format)}
                    {item.format.toUpperCase()}
                  </span>
                  {item.quality && (
                    <span className="font-code text-[9px] text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                      • {item.quality}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-code text-[9px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                    {item.formattedDate}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item.id, item.filename)}
                    className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400 p-0.5"
                    title="Hapus rekaman ini dari riwayat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Middle: Content Info & Thumbnail */}
              <div className="flex gap-2.5 items-start">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 object-cover border border-black dark:border-white shrink-0 bg-zinc-100 dark:bg-zinc-800"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 border border-black dark:border-white flex items-center justify-center shrink-0">
                    {renderTypeIcon(item.type, item.format)}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="font-display font-extrabold text-xs text-black dark:text-white line-clamp-1 leading-snug">
                    {item.title || 'Untitled Content'}
                  </h4>

                  {item.author && (
                    <p className="font-sans text-[11px] text-zinc-600 dark:text-zinc-400 line-clamp-1 mt-0.5">
                      Oleh: <strong>{item.author}</strong>
                    </p>
                  )}

                  <p className="font-code text-[10px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    File: <span className="font-bold text-zinc-700 dark:text-zinc-300">{item.filename}</span>
                  </p>
                </div>
              </div>

              {/* Card Bottom: Quick Actions */}
              <div className="pt-1.5 border-t border-black/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Re-extract Action */}
                  <button
                    type="button"
                    onClick={() => onReExtract(item.sourceUrl)}
                    className="py-1 px-2 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white border border-black dark:border-white font-code text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-[#FFE600] hover:text-black cursor-pointer transition-colors"
                    title="Buka kembali di form downloader untuk dianalisis ulang"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>ANALISIS ULANG</span>
                  </button>

                  {/* Copy Source Link */}
                  <button
                    type="button"
                    onClick={() => handleCopySourceUrl(item)}
                    className="py-1 px-2 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white border border-black dark:border-white font-code text-[10px] font-bold uppercase flex items-center gap-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                    title="Salin tautan asli"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-green-600" />
                        <span>TERSALIN</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>SALIN LINK</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Open Source URL directly */}
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-code text-[10px] font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white flex items-center gap-1 ml-auto"
                >
                  <span>SUMBER</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Info & JSON Format Explanation Footer */}
      {history.length > 0 && (
        <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 border border-black/20 dark:border-white/20 text-zinc-600 dark:text-zinc-400">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#FFE600] shrink-0 mt-0.5" />
            <div className="text-[11px] font-sans leading-relaxed">
              <strong className="text-black dark:text-white">Format JSON Ekspor:</strong> File JSON berisi array objek terstruktur lengkap dengan metadata judul, kreator, timestamp unduhan, platform, nama file, dan tautan asli untuk keperluan arsip pribadi atau integrasi data Anda.
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
