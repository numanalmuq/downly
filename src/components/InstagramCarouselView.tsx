import React, { useState } from 'react';
import JSZip from 'jszip';
import Swal from 'sweetalert2';
import {
  Check,
  CheckSquare,
  Square,
  Download,
  FileArchive,
  Image as ImageIcon,
  Film,
  Copy,
  RefreshCw,
  Share2,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowDownToLine,
  Eye
} from 'lucide-react';
import { ExtractedMedia, SlideItem } from '../types';
import { addDownloadHistory } from '../utils/history';
import { InstagramLogo } from './Icons';

interface InstagramCarouselViewProps {
  data: ExtractedMedia;
  onReset: () => void;
  onCopyLink: () => void;
  copiedUrl: boolean;
}

export const InstagramCarouselView: React.FC<InstagramCarouselViewProps> = ({
  data,
  onReset,
  onCopyLink,
  copiedUrl,
}) => {
  const slides: SlideItem[] = data.slides || [];
  
  // By default, select all slides
  const [selectedIndices, setSelectedIndices] = useState<number[]>(() =>
    slides.map((s) => s.index)
  );

  // Status for zip packaging / batch download
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const [zipProgress, setZipProgress] = useState<number>(0);
  const [zipStatusText, setZipStatusText] = useState<string>('');
  const [singleDownloadingIndex, setSingleDownloadingIndex] = useState<number | null>(null);
  const [expandedCaption, setExpandedCaption] = useState<boolean>(false);
  const [previewSlide, setPreviewSlide] = useState<SlideItem | null>(null);

  const isAllSelected = selectedIndices.length === slides.length && slides.length > 0;
  const isNoneSelected = selectedIndices.length === 0;

  // Toggle single slide selection
  const toggleSlideSelection = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index].sort((a, b) => a - b)
    );
  };

  // Select all slides
  const handleSelectAll = () => {
    setSelectedIndices(slides.map((s) => s.index));
  };

  // Deselect all slides
  const handleDeselectAll = () => {
    setSelectedIndices([]);
  };

  // Trigger browser download via <a> element
  const triggerDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download a single slide immediately
  const handleDownloadSingleSlide = async (slide: SlideItem) => {
    setSingleDownloadingIndex(slide.index);
    try {
      const ext = slide.type === 'video' ? 'mp4' : 'jpg';
      const filename = `instagram_slide_${slide.index}.${ext}`;
      
      try {
        const res = await fetch(slide.url);
        if (res.ok) {
          const blob = await res.blob();
          const blobUrl = URL.createObjectURL(blob);
          triggerDownload(blobUrl, filename);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
        } else {
          triggerDownload(slide.url, filename);
        }
      } catch {
        triggerDownload(slide.url, filename);
      }
      
      // Record in download history
      addDownloadHistory({
        platform: 'instagram',
        platformName: 'Instagram',
        title: data.title ? `${data.title} (Slide ${slide.index})` : `Instagram Slide ${slide.index}`,
        author: data.author || (data.authorUsername ? `@${data.authorUsername}` : undefined),
        sourceUrl: data.sourceUrl,
        filename,
        format: slide.type === 'video' ? 'mp4' : 'image',
        quality: slide.type === 'video' ? 'Video Slide HD' : 'Foto Slide HD',
        type: slide.type === 'video' ? 'video' : 'image',
        downloadUrl: slide.url,
        thumbnail: slide.thumbnail || slide.url,
      });

      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
      });
      Toast.fire({
        icon: 'success',
        title: `Mengunduh Slide ${slide.index}...`,
      });
    } catch {
      Swal.fire({
        title: 'Gagal Mengunduh',
        text: `Tidak dapat mengunduh Slide ${slide.index}. Silakan coba lagi.`,
        icon: 'error',
        confirmButtonColor: '#000',
      });
    } finally {
      setTimeout(() => setSingleDownloadingIndex(null), 800);
    }
  };

  // Download slides packaged into a ZIP archive
  const handleDownloadZip = async (targetIndices?: number[]) => {
    const indicesToDownload = targetIndices || selectedIndices;
    if (indicesToDownload.length === 0) {
      Swal.fire({
        title: 'Pilih Slide Terlebih Dahulu',
        text: 'Centang setidaknya satu slide yang ingin Anda unduh.',
        icon: 'warning',
        confirmButtonColor: '#FFE600',
      });
      return;
    }

    const targetSlides = slides.filter((s) => indicesToDownload.includes(s.index));
    setIsZipping(true);
    setZipProgress(5);
    setZipStatusText(`Menyiapkan ${targetSlides.length} file slide...`);

    const zip = new JSZip();

    try {
      for (let i = 0; i < targetSlides.length; i++) {
        const slide = targetSlides[i];
        const ext = slide.type === 'video' ? 'mp4' : 'jpg';
        const filename = `slide_${slide.index}.${ext}`;
        
        setZipStatusText(`Mengunduh slide ${i + 1} dari ${targetSlides.length}...`);
        
        // Fetch file directly in browser
        try {
          const res = await fetch(slide.url);
          if (res.ok) {
            const blob = await res.blob();
            zip.file(filename, blob);
          }
        } catch {
          // If direct fetch is restricted, continue with other slides
        }

        const currentPct = Math.round(10 + ((i + 1) / targetSlides.length) * 75);
        setZipProgress(currentPct);
      }

      setZipStatusText('Mengompresi ke format ZIP...');
      setZipProgress(90);

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      setZipProgress(100);
      setZipStatusText('Selesai! Menyimpan file...');

      const zipFilename = `instagram_post_${targetSlides.length}_slides.zip`;
      const blobUrl = URL.createObjectURL(zipBlob);
      triggerDownload(blobUrl, zipFilename);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      // Record in download history
      addDownloadHistory({
        platform: 'instagram',
        platformName: 'Instagram',
        title: data.title ? `${data.title} (${targetSlides.length} Slides ZIP)` : `Instagram Post (${targetSlides.length} Slides ZIP)`,
        author: data.author || (data.authorUsername ? `@${data.authorUsername}` : undefined),
        sourceUrl: data.sourceUrl,
        filename: zipFilename,
        format: 'zip',
        quality: `${targetSlides.length} Slides Package`,
        type: 'zip',
        downloadUrl: data.sourceUrl,
        thumbnail: targetSlides[0]?.thumbnail || data.thumbnail,
      });

      Swal.fire({
        title: 'Unduhan Berhasil!',
        text: `Semua ${targetSlides.length} slide berhasil dikompresi ke ${zipFilename}`,
        icon: 'success',
        confirmButtonColor: '#000',
        timer: 3000,
      });
    } catch (err: any) {
      Swal.fire({
        title: 'Gagal Membuat ZIP',
        text: err?.message || 'Terjadi kesalahan saat mengunduh slide.',
        icon: 'error',
        confirmButtonColor: '#000',
      });
    } finally {
      setIsZipping(false);
      setZipProgress(0);
      setZipStatusText('');
    }
  };

  // Download slides individually (sequential browser download)
  const handleDownloadSequential = async (targetIndices?: number[]) => {
    const indicesToDownload = targetIndices || selectedIndices;
    if (indicesToDownload.length === 0) return;

    const targetSlides = slides.filter((s) => indicesToDownload.includes(s.index));

    const confirm = await Swal.fire({
      title: `Unduh ${targetSlides.length} File Sekaligus?`,
      text: `Browser akan mengunduh ${targetSlides.length} file gambar/video secara bertahap.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Unduh Semua',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#000',
    });

    if (!confirm.isConfirmed) return;

    for (let i = 0; i < targetSlides.length; i++) {
      const slide = targetSlides[i];
      const ext = slide.type === 'video' ? 'mp4' : 'jpg';
      const filename = `instagram_slide_${slide.index}.${ext}`;
      triggerDownload(slide.url, filename);
      // Wait 350ms between downloads so browser doesn't block multi-download
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#121214] border-[3px] border-black dark:border-white shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#FFE600] overflow-hidden">
      {/* Top Banner: Instagram Carousel Identification */}
      <div className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] p-3 text-white flex items-center justify-between border-b-[2.5px] border-black dark:border-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 backdrop-blur-sm border-2 border-white flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <InstagramLogo className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-xs sm:text-sm tracking-wider uppercase text-white drop-shadow-[1px_1px_0px_#000]">
                INSTAGRAM POSTINGAN
              </span>
              <span className="bg-black text-[#FFE600] font-code text-[10px] font-extrabold px-1.5 py-0.5 border border-white">
                CAROUSEL
              </span>
            </div>
            <p className="text-[11px] font-sans font-medium text-white/95">
              Tersedia {slides.length} slide foto & video
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-black text-[#FFE600] px-2.5 py-1 border-2 border-white shadow-[2px_2px_0px_#000]">
          <Layers className="w-3.5 h-3.5" />
          <span className="font-code text-xs font-bold">{slides.length} SLIDE</span>
        </div>
      </div>

      {/* Caption & Post Metadata */}
      {data.title && (
        <div className="p-3.5 bg-[#F8F7F4] dark:bg-[#1a1a1e] border-b-2 border-black dark:border-white">
          <p className={`text-xs text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed ${!expandedCaption ? 'line-clamp-2' : ''}`}>
            {data.title}
          </p>
          {data.title.length > 120 && (
            <button
              type="button"
              onClick={() => setExpandedCaption(!expandedCaption)}
              className="mt-1 text-[11px] font-code font-bold text-black dark:text-[#FFE600] underline cursor-pointer"
            >
              {expandedCaption ? 'Sembunyikan' : 'Lihat Selengkapnya...'}
            </button>
          )}
        </div>
      )}

      {/* Main Action Control Bar: Neo-Brutalist Sticky Panel */}
      <div className="p-3.5 bg-white dark:bg-[#151518] border-b-[2.5px] border-black dark:border-white space-y-3">
        {/* Selection Stats and Select All / Deselect All Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-xs uppercase tracking-tight text-black dark:text-white">
              PILIH SLIDE:
            </span>
            <span className="font-code text-xs font-bold px-2 py-0.5 bg-[#FFE600] text-black border border-black shadow-[1.5px_1.5px_0px_#000]">
              {selectedIndices.length} / {slides.length} DIPILIH
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={isAllSelected}
              className={`px-2.5 py-1 text-xs font-code font-bold border-2 border-black flex items-center gap-1 cursor-pointer transition-all ${
                isAllSelected
                  ? 'bg-zinc-200 text-zinc-500 border-zinc-400 cursor-not-allowed'
                  : 'bg-white hover:bg-zinc-100 text-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>PILIH SEMUA</span>
            </button>

            <button
              type="button"
              onClick={handleDeselectAll}
              disabled={isNoneSelected}
              className={`px-2.5 py-1 text-xs font-code font-bold border-2 border-black flex items-center gap-1 cursor-pointer transition-all ${
                isNoneSelected
                  ? 'bg-zinc-200 text-zinc-500 border-zinc-400 cursor-not-allowed'
                  : 'bg-white hover:bg-zinc-100 text-black shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>BATAL PILIH</span>
            </button>
          </div>
        </div>

        {/* Zipping / Download Progress Feedback */}
        {isZipping && (
          <div className="p-3 bg-[#FFFBEA] dark:bg-yellow-950/40 border-2 border-black dark:border-yellow-400 space-y-1.5 animate-pulse">
            <div className="flex items-center justify-between text-xs font-code font-bold">
              <span className="text-black dark:text-yellow-300">{zipStatusText}</span>
              <span className="text-black dark:text-yellow-300">{zipProgress}%</span>
            </div>
            <div className="w-full h-3 bg-white dark:bg-black border border-black overflow-hidden">
              <div
                className="h-full bg-[#FFE600] transition-all duration-200"
                style={{ width: `${zipProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Big Dual Download Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Action 1: Download All Slides in ZIP */}
          <button
            type="button"
            disabled={isZipping || slides.length === 0}
            onClick={() => handleDownloadZip(slides.map((s) => s.index))}
            className="w-full py-3 px-3 bg-[#FFE600] hover:bg-[#FFDE00] text-black border-[2.5px] border-black font-display font-black text-xs sm:text-sm uppercase tracking-tight flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileArchive className="w-4 h-4 text-black shrink-0" />
            <span>DOWNLOAD SEMUA SLIDE (ZIP)</span>
          </button>

          {/* Action 2: Download Selected Slides in ZIP */}
          <button
            type="button"
            disabled={isZipping || selectedIndices.length === 0}
            onClick={() => handleDownloadZip(selectedIndices)}
            className="w-full py-3 px-3 bg-black hover:bg-zinc-800 text-white border-[2.5px] border-black font-display font-black text-xs sm:text-sm uppercase tracking-tight flex items-center justify-center gap-2 shadow-[4px_4px_0px_#FFE600] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-[#FFE600] shrink-0" />
            <span>
              DOWNLOAD TERPILIH ({selectedIndices.length} SLIDE)
            </span>
          </button>
        </div>

        {/* Secondary helper: Download individually */}
        <div className="flex justify-end">
          <button
            type="button"
            disabled={isZipping || selectedIndices.length === 0}
            onClick={() => handleDownloadSequential(selectedIndices)}
            className="text-[11px] font-code font-bold text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white underline flex items-center gap-1 cursor-pointer"
          >
            <ArrowDownToLine className="w-3 h-3" />
            <span>Unduh {selectedIndices.length} file satu per satu (tanpa ZIP)</span>
          </button>
        </div>
      </div>

      {/* Slide Gallery Grid: Every Slide Displayed Individually */}
      <div className="p-3.5 bg-[#FAF9F6] dark:bg-[#121214]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-extrabold text-xs uppercase tracking-wider text-black dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#FD1D1D]" />
            <span>DAFTAR SEMUA SLIDE ({slides.length})</span>
          </h3>
          <span className="text-[10px] font-code text-zinc-500">
            Klik gambar untuk melihat / unduh terpisah
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {slides.map((slide) => {
            const isSelected = selectedIndices.includes(slide.index);
            const isDownloadingThis = singleDownloadingIndex === slide.index;
            const isVideo = slide.type === 'video' || slide.format === 'mp4';

            return (
              <div
                key={slide.index}
                className={`bg-white dark:bg-[#1a1a1e] border-2 transition-all duration-150 flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'border-black dark:border-[#FFE600] shadow-[3.5px_3.5px_0px_#000] dark:shadow-[3.5px_3.5px_0px_#FFE600]'
                    : 'border-zinc-300 dark:border-zinc-700 opacity-80 hover:opacity-100 shadow-none'
                }`}
              >
                {/* Slide Card Header: Checkbox + Slide Index Badge */}
                <div
                  onClick={() => toggleSlideSelection(slide.index)}
                  className="p-2 bg-zinc-100 dark:bg-zinc-800/80 border-b border-black dark:border-zinc-700 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-4 h-4 border-2 border-black flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-[#FFE600]' : 'bg-white dark:bg-black'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                    </div>
                    <span className="font-display font-black text-xs uppercase text-black dark:text-white">
                      SLIDE {slide.index}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-code font-bold px-1.5 py-0.5 border border-black ${
                      isVideo
                        ? 'bg-purple-600 text-white'
                        : 'bg-emerald-500 text-white'
                    }`}
                  >
                    {isVideo ? 'VIDEO MP4' : 'FOTO JPG'}
                  </span>
                </div>

                {/* Slide Media Thumbnail / Preview Box */}
                <div className="relative aspect-square w-full bg-zinc-900 overflow-hidden flex items-center justify-center group">
                  {slide.thumbnail || slide.url ? (
                    <img
                      src={slide.thumbnail || slide.url}
                      alt={`Slide ${slide.index}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-zinc-500">
                      {isVideo ? <Film className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                      <span className="text-[10px] font-code mt-1">Slide {slide.index}</span>
                    </div>
                  )}

                  {/* Overlay Type Icon */}
                  <div className="absolute top-1.5 left-1.5 bg-black/80 text-white px-1.5 py-0.5 font-code text-[10px] flex items-center gap-1 border border-white/40">
                    {isVideo ? <Film className="w-3 h-3 text-[#FFE600]" /> : <ImageIcon className="w-3 h-3 text-white" />}
                    <span>{isVideo ? 'MP4' : 'JPG'}</span>
                  </div>

                  {/* Preview Enlarge Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewSlide(slide);
                    }}
                    className="absolute bottom-1.5 right-1.5 p-1 bg-black/80 text-white hover:bg-black border border-white/40 cursor-pointer shadow"
                    title="Perbesar Preview"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Individual Slide Download Button */}
                <div className="p-2 bg-white dark:bg-[#1a1a1e] border-t border-black dark:border-zinc-700">
                  <button
                    type="button"
                    disabled={isDownloadingThis}
                    onClick={() => handleDownloadSingleSlide(slide)}
                    className="w-full py-2 px-2 bg-white hover:bg-[#FFE600] text-black border border-black font-display font-black text-[11px] uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>
                      {isDownloadingThis ? 'MENGUNDUH...' : `DOWNLOAD SLIDE ${slide.index}`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal / Lightbox for Enlarged Preview */}
      {previewSlide && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewSlide(null)}
        >
          <div
            className="bg-white dark:bg-[#18181b] border-[3px] border-black dark:border-white p-3 max-w-lg w-full shadow-[8px_8px_0px_#FFE600] space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <span className="font-display font-black text-sm uppercase">
                PREVIEW SLIDE {previewSlide.index} ({previewSlide.type === 'video' ? 'VIDEO MP4' : 'FOTO HD'})
              </span>
              <button
                type="button"
                onClick={() => setPreviewSlide(null)}
                className="w-6 h-6 border-2 border-black bg-[#FFE600] text-black font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="w-full max-h-[65vh] overflow-hidden flex items-center justify-center bg-black">
              {previewSlide.type === 'video' ? (
                <video
                  src={previewSlide.url}
                  controls
                  autoPlay
                  className="w-full max-h-[60vh] object-contain"
                />
              ) : (
                <img
                  src={previewSlide.url}
                  alt={`Slide ${previewSlide.index}`}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[60vh] object-contain"
                />
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDownloadSingleSlide(previewSlide)}
                className="flex-1 py-2.5 bg-[#FFE600] text-black border-2 border-black font-display font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD SLIDE {previewSlide.index} SEKARANG</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewSlide(null)}
                className="py-2.5 px-3 bg-white dark:bg-black border-2 border-black text-black dark:text-white font-code text-xs font-bold cursor-pointer"
              >
                TUTUP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Micro Utilities: Copy Link, Share, Reset */}
      <div className="p-3 bg-white dark:bg-[#151518] border-t-2 border-black dark:border-zinc-800 flex items-center justify-between text-xs font-code gap-2">
        <button
          type="button"
          onClick={onCopyLink}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-black bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_#000]"
        >
          {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedUrl ? 'DISALIN!' : 'SALIN URL'}</span>
        </button>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={() => {
              navigator.share({
                title: data.title || 'Instagram Post',
                url: data.sourceUrl,
              }).catch(() => {});
            }}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-black bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white transition-colors cursor-pointer shadow-[2px_2px_0px_#000]"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>BAGIKAN</span>
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 border border-black bg-[#FFE600] text-black hover:bg-white transition-colors cursor-pointer shadow-[2px_2px_0px_#000] font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>LINK LAIN +</span>
        </button>
      </div>
    </div>
  );
};
