export interface DetectedPlatform {
  key: string;
  name: string;
  iconType: 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'facebook' | 'pinterest' | 'threads' | 'capcut' | 'soundcloud' | 'spotify' | 'generic';
  badgeBg: string;
  badgeText: string;
  supported: boolean;
}

export function detectPlatform(inputUrl: string): DetectedPlatform {
  const trimmed = inputUrl.trim();
  if (/^\d{15,}$/.test(trimmed)) {
    return {
      key: 'capcut',
      name: 'CapCut',
      iconType: 'capcut',
      badgeBg: 'bg-black text-white dark:bg-zinc-800',
      badgeText: 'text-zinc-900 dark:text-white',
      supported: true,
    };
  }

  let hostname = '';
  try {
    const parsed = new URL(trimmed);
    hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return {
      key: 'unknown',
      name: 'Unknown',
      iconType: 'generic',
      badgeBg: 'bg-zinc-200 dark:bg-zinc-800',
      badgeText: 'text-zinc-600 dark:text-zinc-400',
      supported: false,
    };
  }

  if (hostname.includes('tiktok.com')) {
    return {
      key: 'tiktok',
      name: 'TikTok',
      iconType: 'tiktok',
      badgeBg: 'bg-black text-white dark:bg-zinc-800 dark:text-zinc-100',
      badgeText: 'text-zinc-900 dark:text-white',
      supported: true,
    };
  }

  if (hostname.includes('instagram.com') || hostname === 'instagr.am') {
    return {
      key: 'instagram',
      name: 'Instagram',
      iconType: 'instagram',
      badgeBg: 'bg-pink-600 text-white',
      badgeText: 'text-pink-600 dark:text-pink-400',
      supported: true,
    };
  }

  if (hostname.includes('youtube.com') || hostname === 'youtu.be') {
    return {
      key: 'youtube',
      name: 'YouTube',
      iconType: 'youtube',
      badgeBg: 'bg-red-600 text-white',
      badgeText: 'text-red-600 dark:text-red-400',
      supported: true,
    };
  }

  if (hostname.includes('twitter.com') || hostname === 'x.com' || hostname.endsWith('.x.com') || hostname === 't.co' || hostname.endsWith('.t.co')) {
    return {
      key: 'twitter',
      name: 'Twitter / X',
      iconType: 'twitter',
      badgeBg: 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900',
      badgeText: 'text-zinc-900 dark:text-white',
      supported: true,
    };
  }

  if (hostname.includes('facebook.com') || hostname === 'fb.watch' || hostname === 'fb.com' || hostname.endsWith('.fb.com')) {
    return {
      key: 'facebook',
      name: 'Facebook',
      iconType: 'facebook',
      badgeBg: 'bg-blue-600 text-white',
      badgeText: 'text-blue-600 dark:text-blue-400',
      supported: true,
    };
  }

  if (hostname.includes('pinterest.com') || hostname === 'pin.it' || hostname.endsWith('.pin.it')) {
    return {
      key: 'pinterest',
      name: 'Pinterest',
      iconType: 'pinterest',
      badgeBg: 'bg-red-700 text-white',
      badgeText: 'text-red-700 dark:text-red-400',
      supported: true,
    };
  }

  if (hostname.includes('reddit.com') || hostname === 'redd.it' || hostname.endsWith('.redd.it') || hostname === 'v.redd.it') {
    return {
      key: 'reddit',
      name: 'Reddit',
      iconType: 'generic',
      badgeBg: 'bg-orange-600 text-white',
      badgeText: 'text-orange-600 dark:text-orange-400',
      supported: true,
    };
  }

  if (hostname.includes('threads.net') || hostname.includes('threads.com')) {
    return {
      key: 'threads',
      name: 'Threads',
      iconType: 'threads',
      badgeBg: 'bg-zinc-900 text-white dark:bg-zinc-800',
      badgeText: 'text-zinc-900 dark:text-white',
      supported: true,
    };
  }

  if (hostname.includes('capcut.com') || hostname.includes('capcutshare.com') || hostname.includes('capcut.net')) {
    return {
      key: 'capcut',
      name: 'CapCut',
      iconType: 'capcut',
      badgeBg: 'bg-black text-white dark:bg-zinc-800',
      badgeText: 'text-zinc-900 dark:text-white',
      supported: true,
    };
  }

  if (hostname.includes('soundcloud.com')) {
    return {
      key: 'soundcloud',
      name: 'SoundCloud',
      iconType: 'soundcloud',
      badgeBg: 'bg-amber-600 text-white',
      badgeText: 'text-amber-600 dark:text-amber-400',
      supported: true,
    };
  }

  if (hostname.includes('spotify.com') || hostname.includes('spotify.link')) {
    return {
      key: 'spotify',
      name: 'Spotify',
      iconType: 'spotify',
      badgeBg: 'bg-green-600 text-white',
      badgeText: 'text-green-600 dark:text-green-400',
      supported: true,
    };
  }

  return {
    key: 'unknown',
    name: 'Tidak Dikenal',
    iconType: 'generic',
    badgeBg: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300',
    badgeText: 'text-zinc-600 dark:text-zinc-400',
    supported: false,
  };
}

export function validateInputUrl(url: string): { isValid: boolean; message?: string; platform: DetectedPlatform } {
  const trimmed = url.trim();

  if (!trimmed) {
    return {
      isValid: false,
      message: 'Masukkan tautan video terlebih dahulu.',
      platform: detectPlatform(''),
    };
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return {
      isValid: false,
      message: 'URL tidak valid. Masukkan link lengkap diawali dengan https:// atau http://',
      platform: detectPlatform(''),
    };
  }

  try {
    new URL(trimmed);
  } catch {
    return {
      isValid: false,
      message: 'URL tidak valid. Masukkan format link yang benar.',
      platform: detectPlatform(''),
    };
  }

  const platform = detectPlatform(trimmed);

  if (!platform.supported) {
    return {
      isValid: false,
      message: 'Platform ini belum didukung. Silakan gunakan link dari TikTok, Instagram, YouTube, Spotify, Facebook, Twitter/X, Pinterest, atau Reddit.',
      platform,
    };
  }

  return {
    isValid: true,
    platform,
  };
}
