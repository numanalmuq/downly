/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Zap, Globe, Info, ArrowRight, History as HistoryIcon } from 'lucide-react';
import { ExtractedMedia } from './types';
import { detectPlatform, validateInputUrl, DetectedPlatform } from './utils/platform';
import { extractMediaClient } from './utils/clientExtractors';
import { getDownloadHistory, HISTORY_UPDATED_EVENT } from './utils/history';
import { ResultCard } from './components/ResultCard';
import { ExtractionSkeleton } from './components/ExtractionSkeleton';
import { SupportedPlatforms } from './components/SupportedPlatforms';
import { HistoryView } from './components/HistoryView';
import {
  LogoIcon,
  DownloadIcon,
  PasteIcon,
  ClearIcon,
  SunIcon,
  MoonIcon,
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
} from './components/Icons';

export default function App() {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [processProgress, setProcessProgress] = useState<number>(0);
  const [processStatus, setProcessStatus] = useState<string>('');
  const [mediaResult, setMediaResult] = useState<ExtractedMedia | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<DetectedPlatform>(detectPlatform(''));
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeTab, setActiveTab] = useState<'extract' | 'history' | 'platforms' | 'guide'>('extract');
  const [historyCount, setHistoryCount] = useState<number>(0);

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const updateCount = () => {
      setHistoryCount(getDownloadHistory().length);
    };
    updateCount();
    window.addEventListener(HISTORY_UPDATED_EVENT, updateCount);
    window.addEventListener('storage', updateCount);

    return () => {
      window.removeEventListener(HISTORY_UPDATED_EVENT, updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('downly_theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'light';
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('downly_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Handle URL change & dynamic platform detection
  const handleUrlChange = (value: string) => {
    setUrl(value);
    if (value.trim()) {
      setDetectedPlatform(detectPlatform(value));
    } else {
      setDetectedPlatform(detectPlatform(''));
    }
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          handleUrlChange(text.trim());
          Swal.fire({
            icon: 'info',
            title: 'URL DITEMPEL',
            text: 'Tautan berhasil disalin dari clipboard.',
            timer: 1200,
            showConfirmButton: false,
            toast: true,
            position: 'top',
          });
        }
      } else {
        throw new Error('Clipboard API tidak didukung');
      }
    } catch {
      Swal.fire({
        icon: 'warning',
        title: 'TEMPEL MANUAL',
        text: 'Silakan gunakan pintasan (Ctrl+V / Cmd+V) atau tempel manual pada kolom URL.',
        timer: 2500,
        showConfirmButton: false,
        toast: true,
        position: 'top',
      });
    }
  };

  const handleClear = () => {
    setUrl('');
    setDetectedPlatform(detectPlatform(''));
  };

  // Main Submit Handler
  const handleProcess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedUrl = url.trim();

    // Step 1: Pre-validation
    const validation = validateInputUrl(trimmedUrl);
    if (!validation.isValid) {
      Swal.fire({
        icon: 'error',
        title: 'URL TIDAK VALID',
        text: validation.message || 'Masukkan link video yang valid.',
      });
      return;
    }

    setMediaResult(null);
    setLoading(true);
    setProcessProgress(15);
    const platformLabel = detectedPlatform.name !== 'Platform Lainnya' ? detectedPlatform.name : 'media';
    setProcessStatus(`KONEKSI KE ${platformLabel.toUpperCase()}...`);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      setProcessProgress((prev) => {
        if (prev < 42) {
          setProcessStatus(`EKSTRAKSI STREAM DARI ${platformLabel.toUpperCase()}...`);
          return prev + Math.floor(Math.random() * 8 + 6);
        } else if (prev < 72) {
          setProcessStatus('ANALISIS STREAM VIDEO & AUDIO...');
          return prev + Math.floor(Math.random() * 6 + 4);
        } else if (prev < 90) {
          setProcessStatus('MENYIAPKAN OPSi UNDUHAN GALERI...');
          return prev + Math.floor(Math.random() * 3 + 2);
        }
        return prev;
      });
    }, 280);

    try {
      const extractedData = await extractMediaClient(trimmedUrl);

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProcessProgress(100);
      setProcessStatus('EKSTRAKSI BERHASIL!');

      await new Promise((resolve) => setTimeout(resolve, 300));
      setMediaResult(extractedData);

      Swal.fire({
        icon: 'success',
        title: 'MEDIA SIAP!',
        text: `Berhasil menemukan media dari ${extractedData.platformName}.`,
        timer: 1800,
        showConfirmButton: false,
        toast: true,
        position: 'top',
      });

      setTimeout(() => {
        const resultElem = document.getElementById('brutalist-result-card');
        if (resultElem) {
          resultElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    } catch (err: any) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setProcessProgress(0);

      const errorMessage = err?.message || 'Gagal mengekstrak media. Coba beberapa saat lagi.';

      Swal.fire({
        icon: 'error',
        title: 'GAGAL MEMPROSES',
        text: errorMessage,
      });
    } finally {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setLoading(false);
    }
  };

  const handleReExtract = (sourceUrl: string) => {
    handleUrlChange(sourceUrl);
    setActiveTab('extract');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      const input = document.getElementById('downloader-input');
      input?.focus();
    }, 350);
  };

  const handleReset = () => {
    setMediaResult(null);
    setUrl('');
    setDetectedPlatform(detectPlatform(''));
    setActiveTab('extract');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPlatformBadgeIcon = (iconType: string) => {
    switch (iconType) {
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

  return (
    <div className="min-h-screen bg-[#E5E5E0] dark:bg-[#0A0A0A] text-black dark:text-white flex flex-col justify-between selection:bg-[#FFE600] selection:text-black font-sans">
      {/* Mobile Frame Container: Pure 390px Mobile Viewport with Editorial Frame */}
      <div className="w-full max-w-[430px] mx-auto min-h-screen bg-[#F5F3EE] dark:bg-[#121212] border-x-[3px] border-black dark:border-white shadow-[6px_0_0_#000] dark:shadow-[6px_0_0_#fff] flex flex-col relative pb-20">
        
        {/* Editorial Top Navigation */}
        <header className="sticky top-0 z-40 bg-[#F5F3EE] dark:bg-[#121212] border-b-[3px] border-black dark:border-white px-4 py-3 flex items-center justify-between">
          {/* Logo with Asterisk */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={handleReset}
          >
            <div className="w-7 h-7 bg-black text-[#FFE600] border-2 border-black flex items-center justify-center font-display font-black text-sm shadow-[2px_2px_0px_#000]">
              *
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-lg tracking-tight text-black dark:text-white">
                DOWNLY
              </span>
              <span className="font-code text-[10px] font-extrabold bg-[#FFE600] text-black border border-black px-1.5 py-0.2 uppercase">
                v2.4
              </span>
            </div>
          </div>

          {/* Header Controls */}
          <div className="flex items-center gap-2">
            {/* Live Indicator */}
            <div className="flex items-center gap-1 px-2 py-0.5 border-2 border-black bg-white dark:bg-black font-code text-[10px] font-bold">
              <span className="w-1.5 h-1.5 bg-[#84CC16] inline-block animate-pulse" />
              <span>ONLINE</span>
            </div>

            {/* Dark/Light Mode Neo-Brutalist Toggle */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle Mode"
              className="p-1.5 bg-white dark:bg-black border-2 border-black dark:border-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-4 h-4 text-[#FFE600]" />
              ) : (
                <MoonIcon className="w-4 h-4 text-black" />
              )}
            </button>
          </div>
        </header>

        {/* Tab View Container */}
        <main className="flex-1 px-4 py-4 flex flex-col">
          {activeTab === 'extract' && (
            <>
              {/* Editorial Hero Block */}
              <section className="mb-4 pt-1">
                <div className="flex items-center justify-between mb-1.5 font-code text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                  <span>[ 01 // EXTRACTOR ]</span>
                  <span className="text-black dark:text-[#FFE600]">RAW. FAST. NO-WM.</span>
                </div>

                <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight leading-[0.95] text-black dark:text-white">
                  UNIVERSAL <br />
                  <span className="bg-[#FFE600] text-black px-1 border-2 border-black inline-block my-1 shadow-[3px_3px_0px_#000]">
                    MEDIA GRABBER
                  </span>
                </h1>

                <p className="mt-2 text-xs font-sans text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                  Ekstrak video MP4 jernih & audio MP3 tanpa watermark dari TikTok, Instagram, YouTube, Spotify, dan Twitter/X langsung ke Galeri HP Anda.
                </p>
              </section>

              {/* Neo-Brutalist Input Box Card */}
              <div className="w-full">
                <form onSubmit={handleProcess} className="relative">
                  <div className="bg-white dark:bg-[#18181b] border-[3px] border-black dark:border-white shadow-[5px_5px_0px_#000] dark:shadow-[5px_5px_0px_#fff] rounded-[4px] p-3 transition-all">
                    
                    {/* Header Label Row */}
                    <div className="flex items-center justify-between pb-1.5 mb-2 border-b-2 border-black/15 dark:border-white/20 font-code text-[10px] font-bold uppercase text-zinc-500">
                      <span>&gt; TEMPEL TAUTAN DI BAWAH:</span>
                      {detectedPlatform.key !== 'unknown' && (
                        <span className="flex items-center gap-1 text-black dark:text-[#FFE600]">
                          {renderPlatformBadgeIcon(detectedPlatform.iconType)}
                          <span>{detectedPlatform.name}</span>
                        </span>
                      )}
                    </div>

                    {/* Input Field with Clear Button */}
                    <div className="relative flex items-center mb-3">
                      <input
                        id="downloader-input"
                        type="url"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        placeholder="https://tiktok.com/@.../video/..."
                        className="w-full py-2.5 px-2 text-xs sm:text-sm font-code bg-[#FAF8F5] dark:bg-black text-black dark:text-white border-2 border-black dark:border-white outline-none focus:bg-white placeholder:text-zinc-400 font-medium"
                        autoComplete="off"
                        disabled={loading}
                      />

                      {url && (
                        <button
                          id="btn-clear-url"
                          type="button"
                          onClick={handleClear}
                          title="Hapus"
                          disabled={loading}
                          className="absolute right-2 p-1 text-black dark:text-white hover:bg-[#FFE600] border border-black dark:border-white transition-colors cursor-pointer text-xs font-code font-bold"
                        >
                          [×]
                        </button>
                      )}
                    </div>

                    {/* Button Row: Paste & Big Analyze CTA */}
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-paste-url"
                        type="button"
                        onClick={handlePaste}
                        disabled={loading}
                        className="py-2.5 px-3 bg-white dark:bg-black text-black dark:text-white border-2 border-black dark:border-white font-display font-extrabold text-xs uppercase flex items-center justify-center gap-1 shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer shrink-0"
                      >
                        <PasteIcon className="w-3.5 h-3.5" />
                        <span>TEMPEL +</span>
                      </button>

                      {/* Primary Action Button */}
                      <button
                        id="btn-main-download"
                        type="submit"
                        disabled={loading || !url.trim()}
                        className={`flex-1 py-2.5 px-3 border-2 border-black font-display font-black text-xs sm:text-sm uppercase tracking-tight flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          loading
                            ? 'bg-[#FFE600] text-black cursor-wait shadow-none translate-x-[2px] translate-y-[2px]'
                            : !url.trim()
                            ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 border-zinc-400 dark:border-zinc-700 cursor-not-allowed shadow-none'
                            : 'bg-[#FFE600] hover:bg-[#FFDE00] text-black shadow-[4px_4px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'
                        }`}
                      >
                        {loading ? (
                          <div className="flex items-center gap-1.5">
                            <SpinnerIcon className="w-3.5 h-3.5 animate-spin text-black" />
                            <span className="font-code">{Math.round(processProgress)}%</span>
                            <span>ANALISIS...</span>
                          </div>
                        ) : (
                          <span className="flex items-center gap-1">
                            ANALISIS SEKARANG
                            <ArrowRight className="w-4 h-4 ml-0.5" />
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Live Processing Strip */}
                    {loading && (
                      <div className="mt-3 pt-2 border-t-2 border-black/15">
                        <div className="flex items-center justify-between text-[10px] font-code font-bold text-black dark:text-white mb-1">
                          <span className="truncate">{processStatus || 'PROSES...'}</span>
                          <span>{Math.round(processProgress)}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-black/10 dark:bg-white/10 border border-black overflow-hidden">
                          <div
                            className="h-full bg-black dark:bg-[#FFE600] transition-all duration-200"
                            style={{ width: `${Math.min(Math.max(processProgress, 10), 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </form>

                {/* Quick Platform Hint Icons */}
                <div className="flex items-center justify-between px-1 mt-2.5 font-code text-[10px] text-zinc-500 dark:text-zinc-400 font-bold uppercase">
                  <span>SUPPORT:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-black dark:text-white font-bold">TIKTOK</span>
                    <span>•</span>
                    <span className="text-black dark:text-white font-bold">IG</span>
                    <span>•</span>
                    <span className="text-black dark:text-white font-bold">YT</span>
                    <span>•</span>
                    <span className="text-black dark:text-white font-bold">X</span>
                  </div>
                </div>
              </div>

              {/* Skeleton During Request */}
              {loading && (
                <ExtractionSkeleton
                  platformName={detectedPlatform.name}
                  platformKey={detectedPlatform.key}
                  progress={processProgress}
                  statusText={processStatus}
                />
              )}

              {/* Media Result Card */}
              {!loading && mediaResult && (
                <ResultCard data={mediaResult} onReset={handleReset} />
              )}

              {/* Step Guide (Editorial 3-Step Grid) */}
              {!loading && !mediaResult && (
                <section className="mt-8 mb-4">
                  <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-1.5">
                    <span className="font-display font-black text-xs uppercase tracking-tight text-black dark:text-white">
                      [ PANDUAN CEPAT // 3 LANGKAH ]
                    </span>
                    <span className="font-code text-[10px] text-zinc-500">EASY // FAST</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="p-3 bg-white dark:bg-[#18181b] border-2 border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] flex items-start gap-2.5">
                      <span className="w-6 h-6 bg-black text-[#FFE600] font-display font-black text-xs flex items-center justify-center shrink-0 border border-black">
                        01
                      </span>
                      <div>
                        <div className="font-display font-bold text-xs uppercase text-black dark:text-white">
                          SALIN URL VIDEO
                        </div>
                        <p className="text-[11px] font-sans text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
                          Salin link dari TikTok, Instagram Reels, YouTube Shorts, atau Twitter/X.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-white dark:bg-[#18181b] border-2 border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] flex items-start gap-2.5">
                      <span className="w-6 h-6 bg-black text-[#FFE600] font-display font-black text-xs flex items-center justify-center shrink-0 border border-black">
                        02
                      </span>
                      <div>
                        <div className="font-display font-bold text-xs uppercase text-black dark:text-white">
                          TEMPEL & ANALISIS
                        </div>
                        <p className="text-[11px] font-sans text-zinc-600 dark:text-zinc-400 mt-0.5 leading-snug">
                          Klik tombol Tempel dan ketuk Analisis untuk memproses stream media.
                        </p>
                      </div>
                    </div>

                    <div className="p-3 bg-[#FFE600] border-2 border-black text-black shadow-[3px_3px_0px_#000] flex items-start gap-2.5">
                      <span className="w-6 h-6 bg-black text-white font-display font-black text-xs flex items-center justify-center shrink-0 border border-black">
                        03
                      </span>
                      <div>
                        <div className="font-display font-black text-xs uppercase text-black">
                          DOWNLOAD MP4 / MP3
                        </div>
                        <p className="text-[11px] font-sans text-black/90 font-medium mt-0.5 leading-snug">
                          Pilih format tanpa watermark dan klik Download. Media tersimpan langsung ke Galeri HP.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <div className="pt-1">
              <HistoryView onReExtract={handleReExtract} />
            </div>
          )}

          {activeTab === 'platforms' && (
            <div className="pt-1">
              <SupportedPlatforms />
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="pt-1 space-y-4">
              <div className="border-b-2 border-black pb-1.5">
                <span className="font-display font-black text-xs uppercase tracking-tight text-black dark:text-white">
                  [ INFORMASI & CARA KERJA ]
                </span>
              </div>

              <div className="p-3 bg-white dark:bg-[#18181b] border-2 border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]">
                <h3 className="font-display font-black text-xs uppercase text-black dark:text-white mb-1">
                  APAKAH HASIL VIDEO ADA WATERMARK?
                </h3>
                <p className="text-xs font-sans text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Tidak. Untuk platform seperti TikTok dan Reels, downloader otomatis mengekstrak file video resolusi jernih langsung dari Content Delivery Network (CDN) resmi tanpa logo/watermark overlay.
                </p>
              </div>

              <div className="p-3 bg-white dark:bg-[#18181b] border-2 border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff]">
                <h3 className="font-display font-black text-xs uppercase text-black dark:text-white mb-1">
                  BAGAIMANA CARA SIMPAN KE GALERI IPHONE / ANDROID?
                </h3>
                <p className="text-xs font-sans text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Di Android, file langsung terunduh ke folder Downloads dan terindeks di Google Photos/Galeri. Di iPhone (Safari), Anda bisa ketuk "Simpan Video" pada menu Share sheet yang muncul otomatis.
                </p>
              </div>

              <div className="p-3 bg-[#FFE600] border-2 border-black text-black shadow-[3px_3px_0px_#000]">
                <h3 className="font-display font-black text-xs uppercase mb-1">
                  CATATAN HAK CIPTA
                </h3>
                <p className="text-xs font-sans font-medium text-black/90 leading-relaxed">
                  Aplikasi ini hanya ditujukan untuk keperluan arsip pribadi konten publik. Harap selalu hargai hak cipta kreator aslinya.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Mobile Bottom Dock Navigation (Strict Physical Feel) */}
        <nav
          id="mobile-bottom-dock"
          className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-[#F5F3EE] dark:bg-[#121212] border-t-[3px] border-x-[3px] border-black dark:border-white p-2 z-40 shadow-[0_-4px_0_#000] flex items-center justify-between gap-1"
        >
          <button
            type="button"
            onClick={() => setActiveTab('extract')}
            className={`flex-1 py-2 px-1 border-2 border-black font-display font-extrabold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === 'extract'
                ? 'bg-[#FFE600] text-black shadow-none translate-x-[1px] translate-y-[1px]'
                : 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>EXTRACT</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-1 border-2 border-black font-display font-extrabold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-all relative ${
              activeTab === 'history'
                ? 'bg-[#FFE600] text-black shadow-none translate-x-[1px] translate-y-[1px]'
                : 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]'
            }`}
          >
            <HistoryIcon className="w-3.5 h-3.5 shrink-0" />
            <span>RIWAYAT</span>
            {historyCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-code font-black flex items-center justify-center shrink-0 border border-black ml-0.5">
                {historyCount > 99 ? '99+' : historyCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('platforms')}
            className={`flex-1 py-2 px-1 border-2 border-black font-display font-extrabold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === 'platforms'
                ? 'bg-[#FFE600] text-black shadow-none translate-x-[1px] translate-y-[1px]'
                : 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>PLATFORMS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2 px-1 border-2 border-black font-display font-extrabold text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
              activeTab === 'guide'
                ? 'bg-[#FFE600] text-black shadow-none translate-x-[1px] translate-y-[1px]'
                : 'bg-white dark:bg-zinc-900 text-black dark:text-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff]'
            }`}
          >
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>GUIDE</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
