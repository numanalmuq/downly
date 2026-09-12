import React from 'react';
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
} from './Icons';

export const SupportedPlatforms: React.FC = () => {
  const platforms = [
    {
      name: 'TIKTOK',
      color: 'bg-black text-white',
      icon: <TikTokLogo className="w-4 h-4" />,
      formats: 'MP4 NO-WM // MP3',
      tag: '01',
    },
    {
      name: 'YOUTUBE',
      color: 'bg-[#FF0000] text-white',
      icon: <YouTubeLogo className="w-4 h-4" />,
      formats: 'SHORTS // MP4 720P',
      tag: '02',
    },
    {
      name: 'INSTAGRAM',
      color: 'bg-[#E1306C] text-white',
      icon: <InstagramLogo className="w-4 h-4" />,
      formats: 'REELS // CAROUSEL // POST',
      tag: '03',
    },
    {
      name: 'TWITTER / X',
      color: 'bg-black text-white',
      icon: <TwitterLogo className="w-4 h-4" />,
      formats: 'TWEET VIDEO MP4',
      tag: '04',
    },
    {
      name: 'FACEBOOK',
      color: 'bg-[#0866FF] text-white',
      icon: <FacebookLogo className="w-4 h-4" />,
      formats: 'WATCH // REELS',
      tag: '05',
    },
    {
      name: 'PINTEREST',
      color: 'bg-[#BD081C] text-white',
      icon: <PinterestLogo className="w-4 h-4" />,
      formats: 'PIN VIDEO // IMAGE',
      tag: '06',
    },
    {
      name: 'SPOTIFY',
      color: 'bg-[#1ED760] text-black',
      icon: <SpotifyLogo className="w-4 h-4" />,
      formats: 'TRACK MP3 // 320 KBPS',
      tag: '07',
    },
    {
      name: 'THREADS',
      color: 'bg-black text-white',
      icon: <ThreadsLogo className="w-4 h-4" />,
      formats: 'POST VIDEO // MEDIA',
      tag: '08',
    },
    {
      name: 'CAPCUT',
      color: 'bg-black text-white',
      icon: <CapCutLogo className="w-4 h-4" />,
      formats: 'NO-WM MP4 // AUDIO',
      tag: '09',
    },
  ];

  return (
    <section id="supported-platforms-section" className="mt-8 mb-6">
      <div className="flex items-center justify-between mb-3 border-b-2 border-black pb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="font-display font-black text-xs uppercase tracking-tight text-black dark:text-white">
            [ 03 // SUPPORTED PLATFORMS ]
          </span>
        </div>
        <span className="font-code text-[10px] text-zinc-500">AUTODETECT.READY</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {platforms.map((p) => (
          <div
            key={p.name}
            className="p-2.5 bg-white dark:bg-[#18181b] border-2 border-black dark:border-white shadow-[3px_3px_0px_#000] dark:shadow-[3px_3px_0px_#fff] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className={`w-6 h-6 border border-black flex items-center justify-center ${p.color}`}>
                  {p.icon}
                </div>
                <span className="font-code text-[10px] font-bold text-zinc-400">
                  {p.tag}
                </span>
              </div>

              <div className="font-display font-extrabold text-xs text-black dark:text-white tracking-tight">
                {p.name}
              </div>
              <div className="font-code text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                {p.formats}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

