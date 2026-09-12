import React from 'react';
import { VideoIcon, DownloadIcon } from './Icons';

interface ExtractionSkeletonProps {
  platformName?: string;
  platformKey?: string;
  progress: number;
  statusText: string;
}

export const ExtractionSkeleton: React.FC<ExtractionSkeletonProps> = ({
  platformName = 'Media',
  platformKey = 'generic',
  progress,
  statusText,
}) => {
  const isPortraitHint = platformKey === 'tiktok' || platformKey === 'instagram';

  return (
    <div
      id="extraction-skeleton-container"
      className={`w-full mx-auto mt-5 bg-white dark:bg-[#18181b] border-[3px] border-black dark:border-white shadow-[5px_5px_0px_#000] dark:shadow-[5px_5px_0px_#fff] rounded-[4px] overflow-hidden transition-all duration-200 ${
        isPortraitHint ? 'max-w-[370px]' : 'max-w-md'
      }`}
    >
      {/* Editorial Card Header */}
      <div className="bg-[#FFE600] border-b-[3px] border-black p-3 text-black">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-black animate-ping" />
            <span className="font-display font-black text-xs uppercase tracking-tight">
              [ANALISIS // {platformName}]
            </span>
          </div>
          <span className="font-code font-bold text-xs bg-black text-[#FFE600] px-2 py-0.5 border border-black">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Hard Bordered Brutalist Progress Line */}
        <div className="w-full h-3 bg-white border-2 border-black overflow-hidden relative">
          <div
            className="h-full bg-black transition-all duration-200"
            style={{ width: `${Math.min(Math.max(progress, 8), 100)}%` }}
          />
        </div>
        <div className="mt-1.5 text-[10px] font-code uppercase font-bold text-black flex items-center justify-between">
          <span>{statusText || 'EKSTRAKSI STREAM MEDIA...'}</span>
          <span>SYS.ACTIVE</span>
        </div>
      </div>

      {/* Brutalist Media Viewport Placeholder */}
      <div
        className={`relative w-full bg-[#111] flex flex-col items-center justify-center p-6 border-b-[3px] border-black text-white ${
          isPortraitHint ? 'aspect-[9/14] max-h-[380px]' : 'aspect-video max-h-[260px]'
        }`}
      >
        {/* Geometric Corner Markers */}
        <div className="absolute top-2 left-2 text-[10px] font-code text-white/50">┌ 01</div>
        <div className="absolute top-2 right-2 text-[10px] font-code text-white/50">02 ┐</div>
        <div className="absolute bottom-2 left-2 text-[10px] font-code text-white/50">└ 03</div>
        <div className="absolute bottom-2 right-2 text-[10px] font-code text-white/50">04 ┘</div>

        {/* Center Geometric Block */}
        <div className="w-16 h-16 bg-[#FFE600] text-black border-2 border-white flex items-center justify-center shadow-[4px_4px_0px_#fff] mb-3 animate-pulse">
          <VideoIcon className="w-8 h-8 stroke-[2]" />
        </div>
        <div className="bg-black border-2 border-white px-3 py-1 text-xs font-code font-bold text-[#FFE600] shadow-[2px_2px_0px_#fff]">
          &gt; PROSES EKSTRAKSI STREAM...
        </div>
      </div>

      {/* Content Skeletons */}
      <div className="p-3.5 space-y-3 bg-[#FAF8F5] dark:bg-[#121212]">
        <div className="space-y-1.5">
          <div className="h-4 bg-black/10 dark:bg-white/15 border border-black/30 w-5/6" />
          <div className="h-3 bg-black/10 dark:bg-white/15 border border-black/30 w-1/2" />
        </div>

        {/* Format placeholder buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-10 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] flex items-center justify-center text-xs font-display font-bold">
            [VIDEO MP4]
          </div>
          <div className="h-10 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white shadow-[2px_2px_0px_#000] dark:shadow-[2px_2px_0px_#fff] flex items-center justify-center text-xs font-display font-bold">
            [AUDIO MP3]
          </div>
        </div>

        {/* CTA Button Skeleton */}
        <div className="h-12 w-full bg-[#FFE600]/60 border-2 border-black flex items-center justify-center gap-2 font-display font-black text-xs uppercase shadow-[3px_3px_0px_#000]">
          <DownloadIcon className="w-4 h-4" />
          <span>MENYIAPKAN UNDUHAN...</span>
        </div>
      </div>
    </div>
  );
};
