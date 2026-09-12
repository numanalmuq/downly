import React, { useState, useRef, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { Smartphone, Monitor, Check, Copy, RefreshCw, Volume2, Film, Share2, Star, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { ExtractedMedia, MediaOption } from '../types';
import { addDownloadHistory } from '../utils/history';
import { DownloadProgressBar, DownloadTransferState } from './DownloadProgressBar';
import { InstagramCarouselView } from './InstagramCarouselView';
import {
  DownloadIcon,
  PlayIcon,
  SpinnerIcon,
  TikTokLogo,
  InstagramLogo,
  YouTubeLogo,
  TwitterLogo,
  FacebookLogo,
  PinterestLogo,
  SpotifyLogo,
  ThreadsLogo,
  RedditLogo,
  CapCutLogo,
  SoundcloudLogo,
  GenericWebLogo,
} from './Icons';

interface ResultCardProps {
  data: ExtractedMedia;
  onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data, onReset }) => {
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [videoLoadError, setVideoLoadError] = useState<boolean>(false);

  // Filter available media options by category
  const videoOptions = useMemo(() => data.options.filter((o) => o.type === 'video'), [data.options]);
  const audioOptions = useMemo(() => data.options.filter((o) => o.type === 'audio'), [data.options]);
  const imageOptions = useMemo(() => data.options.filter((o) => o.type === 'image'), [data.options]);

  // Format type selection: 'video' | 'audio' | 'image'
  const [selectedFormat, setSelectedFormat] = useState<'video' | 'audio' | 'image'>(() => {
    if (videoOptions.length > 0) return 'video';
    if (audioOptions.length > 0) return 'audio';
    return 'image';
  });

  // Identify No Watermark vs With Watermark options for videos
  const noWatermarkVideo = useMemo(() => {
    return (
      videoOptions.find(
        (o) =>
          o.quality?.toLowerCase().includes('tanpa watermark') ||
          o.quality?.toLowerCase().includes('no watermark') ||
          o.label?.toLowerCase().includes('no watermark') ||
          o.label?.toLowerCase().includes('tanpa watermark') ||
          o.quality?.toLowerCase().includes('hd')
      ) || videoOptions[0]
    );
  }, [videoOptions]);

  const withWatermarkVideo = useMemo(() => {
    return (
      videoOptions.find(
        (o) =>
          (o.quality?.toLowerCase().includes('watermark') &&
            !o.quality?.toLowerCase().includes('tanpa') &&
            !o.quality?.toLowerCase().includes('no')) ||
          (o.label?.toLowerCase().includes('watermark') &&
            !o.label?.toLowerCase().includes('tanpa') &&
            !o.label?.toLowerCase().includes('no')) ||
          o.quality?.toLowerCase().includes('normal') ||
          o.quality?.toLowerCase().includes('sd')
      ) || null
    );
  }, [videoOptions]);

  const hasWatermarkChoice = useMemo(() => {
    return (
      videoOptions.length > 1 &&
      Boolean(noWatermarkVideo) &&
      Boolean(withWatermarkVideo) &&
      noWatermarkVideo?.url !== withWatermarkVideo?.url
    );
  }, [videoOptions, noWatermarkVideo, withWatermarkVideo]);

  // Watermark choice: 'no_wm' (default) vs 'with_wm'
  const [watermarkChoice, setWatermarkChoice] = useState<'no_wm' | 'with_wm'>('no_wm');

  // Audio version choice index (e.g. Lagu Penuh vs Preview 30 detik)
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(0);

  // Reset selected indices when data changes
  useEffect(() => {
    setSelectedAudioIndex(0);
    setWatermarkChoice('no_wm');
  }, [data]);

  // Currently active selected option
  const currentOption = useMemo<MediaOption | null>(() => {
    if (selectedFormat === 'video') {
      if (hasWatermarkChoice) {
        return watermarkChoice === 'no_wm' ? noWatermarkVideo : withWatermarkVideo;
      }
      return videoOptions[0] || null;
    }
    if (selectedFormat === 'audio') {
      return audioOptions[selectedAudioIndex] || audioOptions[0] || null;
    }
    return imageOptions[0] || null;
  }, [selectedFormat, watermarkChoice, hasWatermarkChoice, noWatermarkVideo, withWatermarkVideo, videoOptions, audioOptions, selectedAudioIndex, imageOptions]);

  // Aspect ratio auto-detection
  const [aspectRatioMode, setAspectRatioMode] = useState<'portrait' | 'landscape'>(() => {
    const platform = (data.platform || '').toLowerCase();
    if (platform === 'tiktok' || platform === 'instagram') return 'portrait';
    return 'landscape';
  });

  const toggleAspectRatio = () => {
    setAspectRatioMode((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'));
  };

  useEffect(() => {
    if (data.thumbnail) {
      const img = new Image();
      img.src = data.thumbnail;
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          const ratio = img.naturalWidth / img.naturalHeight;
          setAspectRatioMode(ratio < 0.85 ? 'portrait' : 'landscape');
        }
      };
    }
  }, [data.thumbnail]);

  const handleVideoMetadataLoaded = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      const ratio = video.videoWidth / video.videoHeight;
      setAspectRatioMode(ratio < 0.85 ? 'portrait' : 'landscape');
    }
  };

  // Download Transfer State
  const [transfer, setTransfer] = useState<DownloadTransferState>({
    active: false,
    optionUrl: '',
    title: '',
    quality: '',
    format: '',
    mode: 'gallery',
    progress: 0,
    loadedBytes: 0,
    totalBytes: null,
    speed: '',
    status: 'connecting',
    statusText: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
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
        return <SpotifyLogo className="w-3.5 h-3.5 text-[#1ED760]" />;
      case 'threads':
        return <ThreadsLogo className="w-3.5 h-3.5" />;
      case 'reddit':
        return <RedditLogo className="w-3.5 h-3.5 text-[#FF4500]" />;
      case 'capcut':
        return <CapCutLogo className="w-3.5 h-3.5" />;
      case 'soundcloud':
        return <SoundcloudLogo className="w-3.5 h-3.5 text-[#FF5500]" />;
      default:
        return <GenericWebLogo className="w-3.5 h-3.5" />;
    }
  };

  const generateFilename = (option: MediaOption): string => {
    const safeTitle = (data.title || 'media')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .substring(0, 35);
    const ext = option.format === 'mp3' ? 'mp3' : option.format === 'image' ? 'jpg' : 'mp4';
    return `${data.platform}_${safeTitle}_${option.quality || 'download'}.${ext}`;
  };

  const getValidMediaUrl = (option: MediaOption | null): string => {
    if (!option || !option.url) return '';
    return option.url;
  };

  const validMediaUrl = getValidMediaUrl(currentOption);

  const handlePlayToggle = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
    } else {
      setIsPlaying(true);
      setVideoLoadError(false);
    }
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (currentOption?.type === 'video' && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
        }
      });
    } else if (currentOption?.type === 'audio' && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {});
    }
  }, [isPlaying, currentOption, validMediaUrl]);

  const handleCancelTransfer = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setTransfer((prev) => ({
      ...prev,
      active: false,
      status: 'error',
      statusText: 'Unduhan dibatalkan',
    }));
  };

  const handleDismissTransfer = () => {
    setTransfer((prev) => ({
      ...prev,
      active: false,
      status: 'connecting',
    }));
  };

  const triggerDirectDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const startDownload = async (option: MediaOption) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const filename = generateFilename(option);
    const isVideo = option.type === 'video' || option.format === 'mp4';
    const isAudio = option.type === 'audio' || option.format === 'mp3';
    const mimeType = isVideo ? 'video/mp4' : isAudio ? 'audio/mpeg' : 'image/jpeg';

    setTransfer({
      active: true,
      optionUrl: option.url,
      title: data.title || 'Media File',
      quality: option.quality || option.label || option.format.toUpperCase(),
      format: option.format,
      mode: 'gallery',
      progress: 0,
      loadedBytes: 0,
      totalBytes: null,
      speed: '',
      status: 'connecting',
      statusText: 'Menghubungkan ke media...',
    });

    try {
      const response = await fetch(option.url, {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Server merespons status ${response.status}`);
      }

      const contentLengthHeader = response.headers.get('Content-Length');
      const totalBytes = contentLengthHeader ? parseInt(contentLengthHeader, 10) : null;

      if (!response.body) {
        throw new Error('ReadableStream tidak didukung browser ini.');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let loadedBytes = 0;
      let lastTime = performance.now();
      let lastLoaded = 0;

      setTransfer((prev) => ({
        ...prev,
        status: 'downloading',
        totalBytes,
        statusText: 'Mengunduh file...',
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          loadedBytes += value.length;

          const now = performance.now();
          const elapsed = (now - lastTime) / 1000;
          let currentSpeed = '';
          if (elapsed >= 0.5) {
            const bytesDiff = loadedBytes - lastLoaded;
            const speedBytesPerSec = bytesDiff / elapsed;
            if (speedBytesPerSec > 1024 * 1024) {
              currentSpeed = `${(speedBytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
            } else {
              currentSpeed = `${Math.round(speedBytesPerSec / 1024)} KB/s`;
            }
            lastTime = now;
            lastLoaded = loadedBytes;
          }

          const progress = totalBytes ? Math.min(Math.round((loadedBytes / totalBytes) * 100), 100) : 0;

          setTransfer((prev) => ({
            ...prev,
            loadedBytes,
            totalBytes,
            progress,
            speed: currentSpeed || prev.speed,
            statusText: totalBytes
              ? `MENGUNDUH (${progress}%)...`
              : `MENGUNDUH... ${(loadedBytes / (1024 * 1024)).toFixed(1)} MB`,
          }));
        }
      }

      setTransfer((prev) => ({
        ...prev,
        status: 'processing',
        progress: 100,
        statusText: 'Menyimpan file ke perangkat...',
      }));

      const blob = new Blob(chunks, { type: mimeType });

      // Direct file download to storage / gallery (No share dialog popup)
      const blobUrl = URL.createObjectURL(blob);
      triggerDirectDownload(blobUrl, filename);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 20000);

      // Save to download history
      addDownloadHistory({
        platform: data.platform,
        platformName: data.platformName,
        title: data.title || 'Media File',
        author: data.author,
        sourceUrl: data.sourceUrl,
        filename,
        format: option.format,
        quality: option.quality || option.label,
        type: option.type,
        downloadUrl: option.url,
        thumbnail: data.thumbnail || option.thumbnail,
      });

      setTransfer((prev) => ({
        ...prev,
        status: 'completed',
        statusText: 'File berhasil diunduh ke perangkat!',
      }));

      Swal.fire({
        icon: 'success',
        title: 'BERHASIL DIUNDUH!',
        text: `File ${filename} telah tersimpan di folder Download / Galeri perangkat Anda.`,
        timer: 2500,
        showConfirmButton: false,
        background: '#FFE600',
        color: '#000000',
        customClass: {
          popup: 'border-[3px] border-black shadow-[6px_6px_0px_#000] font-display font-bold'
        }
      });
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      // Direct link fallback (bypasses browser CORS restrictions)
      triggerDirectDownload(option.url, filename);

      addDownloadHistory({
        platform: data.platform,
        platformName: data.platformName,
        title: data.title || 'Media File',
        author: data.author,
        sourceUrl: data.sourceUrl,
        filename,
        format: option.format,
        quality: option.quality || option.label,
        type: option.type,
        downloadUrl: option.url,
        thumbnail: data.thumbnail || option.thumbnail,
      });

      setTransfer((prev) => ({
        ...prev,
        status: 'completed',
        progress: 100,
        statusText: 'Membuka tautan unduhan langsung...',
      }));

      Swal.fire({
        icon: 'info',
        title: 'DOWNLOAD LANGSUNG',
        text: `Tautan unduhan ${filename} dibuka di browser Anda.`,
        timer: 2500,
        showConfirmButton: false,
        background: '#FFE600',
        color: '#000000',
        customClass: {
          popup: 'border-[3px] border-black shadow-[6px_6px_0px_#000] font-display font-bold'
        }
      });
    }
  };

  const handleCopyLink = () => {
    if (!currentOption) return;
    navigator.clipboard.writeText(currentOption.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleShareMedia = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: data.title || 'Media Downloader',
          text: `Download ${data.title} (${data.platformName})`,
          url: currentOption?.url || data.sourceUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // If Instagram Carousel post (multiple slides), render the specialized multi-slide carousel view
  if (
    data.platform === 'instagram' &&
    ((data.slides && data.slides.length > 1) || data.mediaType === 'carousel')
  ) {
    return (
      <div id="brutalist-result-card" className="w-full max-w-4xl mx-auto mt-5">
        <InstagramCarouselView
          data={data}
          onReset={onReset}
          onCopyLink={handleCopyLink}
          copiedUrl={copiedUrl}
        />
      </div>
    );
  }

  const isPortrait = aspectRatioMode === 'portrait';
  const isDownloading = transfer.active;

  return (
    <div
      id="brutalist-result-card"
      className={`w-full mx-auto mt-5 bg-white dark:bg-[#18181b] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#fff] rounded-[4px] overflow-hidden transition-all duration-200 ${
        isPortrait ? 'max-w-[380px]' : 'max-w-md'
      }`}
    >
      {/* Editorial Neo-Brutalist Card Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-black text-white border-b-[3px] border-black">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#FFE600] inline-block border border-black" />
          <span className="font-display font-black text-xs uppercase tracking-wider">
            [ 02 // MEDIA READY ]
          </span>
        </div>

        {/* Platform Sticker Badge */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#FFE600] text-black border border-black font-code font-bold text-[11px] uppercase shadow-[2px_2px_0px_#fff]">
          {getPlatformIcon(data.platform)}
          <span>
            {data.platform === 'instagram'
              ? data.mediaType === 'reel'
                ? 'INSTAGRAM REEL'
                : 'INSTAGRAM POST'
              : data.platformName}
          </span>
        </div>
      </div>

      {/* Media Player Viewport Frame */}
      <div
        id="media-player-section"
        className={`relative w-full bg-black flex items-center justify-center overflow-hidden border-b-[3px] border-black ${
          isPortrait ? 'aspect-[9/14] max-h-[380px]' : 'aspect-video max-h-[260px]'
        }`}
      >
        {isPlaying ? (
          currentOption?.type === 'video' ? (
            <video
              ref={videoRef}
              src={validMediaUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
              onLoadedMetadata={handleVideoMetadataLoaded}
              onError={() => setVideoLoadError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white text-center bg-zinc-950">
              <div className="w-16 h-16 bg-[#FFE600] text-black border-2 border-white flex items-center justify-center mb-3 shadow-[3px_3px_0px_#fff]">
                <Volume2 className="w-8 h-8" />
              </div>
              <p className="text-xs font-bold font-display uppercase tracking-tight mb-2 max-w-xs truncate">
                {data.title}
              </p>
              <audio ref={audioRef} src={validMediaUrl} controls className="w-full max-w-xs" />
            </div>
          )
        ) : (
          <div
            className="relative w-full h-full flex items-center justify-center group cursor-pointer"
            onClick={handlePlayToggle}
          >
            {data.thumbnail ? (
              <img
                src={data.thumbnail}
                alt={data.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                <Film className="w-10 h-10 text-zinc-600" />
              </div>
            )}

            {/* Geometric Corner Registration Marks */}
            <div className="absolute top-2 left-2 text-[9px] font-code text-white bg-black px-1 border border-white">
              + 01
            </div>
            <div className="absolute bottom-2 left-2 text-[9px] font-code text-white bg-black px-1 border border-white">
              + 02
            </div>

            {/* Neo-Brutalist Play Button */}
            <button
              type="button"
              className="absolute z-10 w-14 h-14 bg-[#FFE600] hover:bg-white text-black border-[2.5px] border-black flex items-center justify-center shadow-[4px_4px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all cursor-pointer"
              aria-label="Putar Media"
            >
              <PlayIcon className="w-6 h-6 translate-x-0.5 fill-black text-black" />
            </button>
          </div>
        )}

        {/* Aspect Ratio Toggle (Top Right) */}
        <button
          type="button"
          onClick={toggleAspectRatio}
          className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-white text-black border-2 border-black font-code text-[10px] font-bold shadow-[2px_2px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer z-20"
          title="Ubah Rasio Layar"
        >
          {isPortrait ? <Smartphone className="w-3 h-3 text-black" /> : <Monitor className="w-3 h-3 text-black" />}
          <span>{isPortrait ? '9:16' : '16:9'}</span>
        </button>

        {/* Duration Badge Bottom Right */}
        {data.duration && !isPlaying && (
          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[10px] font-code font-bold bg-black text-[#FFE600] border border-white z-10">
            {data.duration}
          </div>
        )}
      </div>

      {/* Metadata & Title Block */}
      <div className="p-3.5 bg-[#F5F3EE] dark:bg-[#1f1f23] border-b-[2.5px] border-black dark:border-white">
        <h2 className="text-xs sm:text-sm font-display font-extrabold text-black dark:text-white leading-snug line-clamp-2 uppercase">
          {data.title || 'MEDIA VIDEO / AUDIO'}
        </h2>
        {data.author && (
          <div className="mt-1 flex items-center gap-1.5 font-code text-[11px] text-zinc-600 dark:text-zinc-400 font-semibold">
            <span>BY:</span>
            <span className="text-black dark:text-white bg-white dark:bg-black px-1 border border-black dark:border-white">
              @{data.authorUsername || data.author}
            </span>
          </div>
        )}
      </div>

      {/* Neo-Brutalist Controls & Single Primary Action */}
      <div className="p-3.5 space-y-3.5 bg-white dark:bg-[#18181b]">
        {/* Step 1: Format Selector Buttons */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-display font-bold uppercase tracking-wider text-black dark:text-white">
              PILIH FORMAT:
            </span>
            <span className="text-[10px] font-code text-zinc-500">[STEP 01]</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {videoOptions.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFormat('video')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 border-2 border-black font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  selectedFormat === 'video'
                    ? 'bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]'
                    : 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                }`}
              >
                <Film className="w-3.5 h-3.5 text-[#FFE600]" />
                <span>{data.mediaType === 'reel' ? 'REEL (MP4)' : 'VIDEO (MP4)'}</span>
              </button>
            )}

            {imageOptions.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFormat('image')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 border-2 border-black font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  selectedFormat === 'image'
                    ? 'bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]'
                    : 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#FFE600]" />
                <span>FOTO (JPG)</span>
              </button>
            )}

            {audioOptions.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedFormat('audio')}
                className={`flex-1 min-w-[120px] py-2.5 px-3 border-2 border-black font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                  selectedFormat === 'audio'
                    ? 'bg-black text-white shadow-none translate-x-[2px] translate-y-[2px]'
                    : 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5 text-[#FFE600]" />
                <span>AUDIO (MP3)</span>
              </button>
            )}
          </div>
        </div>

        {/* Step 2: Watermark Selector (If Video has options) */}
        {selectedFormat === 'video' && hasWatermarkChoice && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-display font-bold uppercase tracking-wider text-black dark:text-white">
                PILIH KUALITAS:
              </span>
              <span className="text-[10px] font-code text-zinc-500">[STEP 02]</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWatermarkChoice('no_wm')}
                className={`py-2 px-2 border-2 border-black font-display font-extrabold text-[11px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  watermarkChoice === 'no_wm'
                    ? 'bg-[#FFE600] text-black shadow-none translate-x-[2px] translate-y-[2px]'
                    : 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]'
                }`}
              >
                <span>TANPA WATERMARK *</span>
              </button>

              <button
                type="button"
                onClick={() => setWatermarkChoice('with_wm')}
                className={`py-2 px-2 border-2 border-black font-display font-extrabold text-[11px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
                  watermarkChoice === 'with_wm'
                    ? 'bg-[#FFE600] text-black shadow-none translate-x-[2px] translate-y-[2px]'
                    : 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]'
                }`}
              >
                <span>WATERMARK ASLI</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Audio Version Selector (If Audio has multiple options like Lagu Penuh vs Preview) */}
        {selectedFormat === 'audio' && audioOptions.length > 1 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-display font-bold uppercase tracking-wider text-black dark:text-white">
                PILIH VERSI AUDIO:
              </span>
              <span className="text-[10px] font-code text-zinc-500">[STEP 02]</span>
            </div>

            <div className="space-y-1.5">
              {audioOptions.map((opt, idx) => {
                const isSelected = selectedAudioIndex === idx;
                const isFull =
                  opt.quality?.toLowerCase().includes('penuh') ||
                  opt.label?.toLowerCase().includes('penuh') ||
                  opt.quality?.toLowerCase().includes('320kbps');
                const isPreview =
                  opt.quality?.toLowerCase().includes('preview') ||
                  opt.quality?.toLowerCase().includes('cuplikan') ||
                  opt.label?.toLowerCase().includes('preview');

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAudioIndex(idx)}
                    className={`w-full py-2 px-2.5 border-2 border-black font-display font-bold text-xs uppercase flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#FFE600] text-black shadow-none translate-x-[2px] translate-y-[2px]'
                        : 'bg-white dark:bg-zinc-800 text-black dark:text-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]'
                    }`}
                  >
                    <span className="truncate text-left">{opt.quality || opt.label}</span>
                    {isFull && (
                      <span className="text-[9px] font-code bg-black text-white px-1.5 py-0.5 shrink-0 ml-2 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>LAGU PENUH</span>
                      </span>
                    )}
                    {isPreview && !isFull && (
                      <span className="text-[9px] font-code bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 px-1 py-0.5 shrink-0 ml-2">
                        PREVIEW 30s
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Real-Time Download Progress Box */}
        <DownloadProgressBar
          transfer={transfer}
          onCancel={handleCancelTransfer}
          onDismiss={handleDismissTransfer}
        />

        {/* Primary Action Button (Huge Neo-Brutalist Tactile CTA) */}
        {currentOption && (
          <button
            id="btn-brutalist-primary-download"
            type="button"
            disabled={isDownloading}
            onClick={() => startDownload(currentOption)}
            className={`w-full py-3.5 px-4 border-[3px] border-black font-display font-black text-sm uppercase tracking-tight flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isDownloading
                ? 'bg-[#FFE600] text-black cursor-wait shadow-none translate-x-[3px] translate-y-[3px]'
                : 'bg-[#FFE600] hover:bg-[#FFDE00] text-black shadow-[5px_5px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none'
            }`}
          >
            {isDownloading ? (
              <>
                <SpinnerIcon className="w-4 h-4 animate-spin text-black" />
                <span>
                  {transfer.totalBytes
                    ? `MENGUNDUH ${Math.round(transfer.progress)}%...`
                    : 'MENGUNDUH...'}
                </span>
              </>
            ) : (
              <>
                <DownloadIcon className="w-4 h-4 text-black" />
                <span className="flex items-center gap-1">
                  {selectedFormat === 'video'
                    ? data.platform === 'instagram' && data.mediaType === 'reel'
                      ? 'DOWNLOAD REEL MP4 (HD)'
                      : watermarkChoice === 'no_wm' && hasWatermarkChoice
                      ? 'DOWNLOAD MP4 (NO WATERMARK)'
                      : 'DOWNLOAD VIDEO MP4'
                    : selectedFormat === 'image'
                    ? 'DOWNLOAD FOTO HD (JPG)'
                    : currentOption.quality?.toLowerCase().includes('penuh') || currentOption.label?.toLowerCase().includes('penuh')
                    ? 'DOWNLOAD LAGU PENUH (MP3)'
                    : currentOption.quality?.toLowerCase().includes('preview') || currentOption.quality?.toLowerCase().includes('cuplikan')
                    ? 'DOWNLOAD PREVIEW (30 DETIK)'
                    : 'DOWNLOAD AUDIO MP3'}
                  <ArrowRight className="w-4 h-4 ml-0.5 inline-block" />
                </span>
                {currentOption.size && (
                  <span className="font-code text-xs bg-black text-white px-1.5 py-0.5 ml-1">
                    {currentOption.size}
                  </span>
                )}
              </>
            )}
          </button>
        )}

        {/* Micro-Utility Buttons */}
        <div className="pt-2 border-t-2 border-black dark:border-zinc-800 flex items-center justify-between text-xs font-code gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-black bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_#000]"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? 'DISALIN!' : 'SALIN URL'}</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              type="button"
              onClick={handleShareMedia}
              className="flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-black bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_#000]"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>BAGIKAN</span>
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="flex-1 flex items-center justify-center gap-1 py-1 px-2 border border-black bg-[#FFE600] text-black hover:bg-white transition-colors cursor-pointer shadow-[2px_2px_0px_#000] font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>LINK LAIN +</span>
          </button>
        </div>
      </div>
    </div>
  );
};
