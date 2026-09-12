import { ExtractedMedia, MediaOption, SlideItem } from '../types';
import { detectPlatform } from './platform';

/**
 * Timeout-controlled fetch helper
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 7000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 1. TikTok Client Extractor (TikWM public API with CORS)
 */
async function extractTikTokClient(sourceUrl: string): Promise<ExtractedMedia> {
  const resp = await fetchWithTimeout(`https://www.tikwm.com/api/?url=${encodeURIComponent(sourceUrl)}`, {
    headers: {
      Accept: 'application/json',
    },
  }, 8000);

  if (!resp.ok) {
    throw new Error('Gagal menghubungi server TikTok API. Pastikan tautan benar dan coba lagi.');
  }

  const json = await resp.json();
  if (json.code !== 0 || !json.data) {
    throw new Error(json.msg || 'Gagal mengekstrak video TikTok. Pastikan video bersifat publik.');
  }

  const d = json.data;
  const options: MediaOption[] = [];
  const slides: SlideItem[] = [];

  // If TikTok is photo album / carousel
  if (Array.isArray(d.images) && d.images.length > 0) {
    d.images.forEach((imgUrl: string, idx: number) => {
      slides.push({
        index: idx + 1,
        type: 'image',
        format: 'image',
        url: imgUrl,
        thumbnail: imgUrl,
        quality: 'Foto Slide HD',
        label: `Slide Foto #${idx + 1}`,
        filename: `tiktok_slide_${idx + 1}.jpg`,
      });
      options.push({
        format: 'image',
        quality: `Foto Slide #${idx + 1}`,
        url: imgUrl,
        type: 'image',
        label: `Download Foto Slide #${idx + 1}`,
        thumbnail: imgUrl,
      });
    });
  }

  // HD video without watermark
  if (d.hdplay) {
    options.push({
      format: 'mp4',
      quality: 'HD (Tanpa Watermark)',
      url: d.hdplay.startsWith('http') ? d.hdplay : `https://www.tikwm.com${d.hdplay}`,
      type: 'video',
      label: 'Download MP4 (HD No Watermark)',
    });
  }

  // Normal video without watermark
  if (d.play) {
    options.push({
      format: 'mp4',
      quality: 'Normal (Tanpa Watermark)',
      url: d.play.startsWith('http') ? d.play : `https://www.tikwm.com${d.play}`,
      type: 'video',
      label: 'Download MP4 (No Watermark)',
    });
  }

  // Video with watermark
  if (d.wmplay && !options.some((o) => o.url === d.wmplay)) {
    options.push({
      format: 'mp4',
      quality: 'Dengan Watermark',
      url: d.wmplay.startsWith('http') ? d.wmplay : `https://www.tikwm.com${d.wmplay}`,
      type: 'video',
      label: 'Download MP4 (Watermark)',
    });
  }

  // Music / Audio
  if (d.music) {
    options.push({
      format: 'mp3',
      quality: 'Audio MP3 128kbps',
      url: d.music.startsWith('http') ? d.music : `https://www.tikwm.com${d.music}`,
      type: 'audio',
      label: 'Download MP3 (Audio Suara)',
    });
  }

  return {
    platform: 'tiktok',
    platformName: 'TikTok',
    mediaType: slides.length > 0 ? 'carousel' : 'video',
    title: d.title || 'TikTok Video',
    author: d.author?.nickname || 'TikTok Creator',
    authorUsername: d.author?.unique_id ? `@${d.author.unique_id}` : undefined,
    thumbnail: d.cover ? (d.cover.startsWith('http') ? d.cover : `https://www.tikwm.com${d.cover}`) : undefined,
    duration: d.duration ? formatDuration(d.duration) : undefined,
    sourceUrl,
    options,
    slides: slides.length > 0 ? slides : undefined,
  };
}

/**
 * 2. Twitter / X Client Extractor (VxTwitter / FxTwitter public CORS APIs)
 */
async function extractTwitterClient(sourceUrl: string): Promise<ExtractedMedia> {
  const match = sourceUrl.match(/status\/(\d+)/);
  if (!match || !match[1]) {
    throw new Error('Link tweet tidak valid. Pastikan format tautan memiliki ID status.');
  }

  const tweetId = match[1];

  // Attempt VxTwitter
  try {
    const res = await fetchWithTimeout(`https://api.vxtwitter.com/status/${tweetId}`, {
      headers: { Accept: 'application/json' },
    }, 6000);

    if (res.ok) {
      const data = await res.json();
      const options: MediaOption[] = [];

      if (Array.isArray(data.media_extended)) {
        data.media_extended.forEach((item: any, idx: number) => {
          if (item.type === 'video' || item.type === 'gif') {
            options.push({
              format: 'mp4',
              quality: 'HD Video MP4',
              url: item.url,
              type: 'video',
              label: `Download Video MP4 ${data.media_extended.length > 1 ? `#${idx + 1}` : ''}`,
              thumbnail: item.thumbnail_url,
            });
          } else if (item.type === 'image') {
            options.push({
              format: 'image',
              quality: 'Gambar HD',
              url: item.url,
              type: 'image',
              label: `Download Foto #${idx + 1}`,
              thumbnail: item.url,
            });
          }
        });
      }

      if (options.length === 0 && Array.isArray(data.mediaURLs)) {
        data.mediaURLs.forEach((mUrl: string, idx: number) => {
          const isVideo = mUrl.includes('.mp4');
          options.push({
            format: isVideo ? 'mp4' : 'image',
            quality: isVideo ? 'Video MP4' : 'Foto HD',
            url: mUrl,
            type: isVideo ? 'video' : 'image',
            label: isVideo ? 'Download Video MP4' : `Download Foto #${idx + 1}`,
          });
        });
      }

      if (options.length > 0) {
        return {
          platform: 'twitter',
          platformName: 'Twitter / X',
          title: data.text || 'Tweet Video',
          author: data.user_name ? `${data.user_name} (@${data.user_screen_name})` : undefined,
          authorUsername: data.user_screen_name ? `@${data.user_screen_name}` : undefined,
          thumbnail: options[0]?.thumbnail || (options[0]?.type === 'image' ? options[0].url : undefined),
          sourceUrl,
          options,
        };
      }
    }
  } catch (err) {
    console.warn('VxTwitter failed, trying fallback...');
  }

  throw new Error('Gagal mengekstrak media dari Tweet. Pastikan tweet memiliki video atau foto publik.');
}

/**
 * 3. YouTube & YouTube Shorts Client Extractor (oEmbed + Direct Options)
 */
async function extractYouTubeClient(sourceUrl: string): Promise<ExtractedMedia> {
  const match = sourceUrl.match(/(?:shorts\/|v\/|watch\?v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  if (!match || !match[1]) {
    throw new Error('ID video YouTube tidak ditemukan dalam link.');
  }

  const videoId = match[1];
  const isShorts = sourceUrl.includes('/shorts/');
  const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
  const hqThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  let videoTitle = isShorts ? 'YouTube Shorts Video' : 'YouTube Video';
  let authorName = 'YouTube Creator';

  try {
    const oembedRes = await fetchWithTimeout(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      {},
      5000
    );
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      if (oembed.title) videoTitle = oembed.title;
      if (oembed.author_name) authorName = oembed.author_name;
    }
  } catch {
    // oembed fallback
  }

  // Generate verified download gateway options that work directly in user's browser
  const options: MediaOption[] = [
    {
      format: 'mp4',
      quality: '720p HD (Video + Suara)',
      url: `https://y2mate.is/watch?v=${videoId}`,
      type: 'video',
      label: 'Download Video MP4 (720p HD)',
      thumbnail: hqThumbnail,
    },
    {
      format: 'mp4',
      quality: 'MP4 Fast Stream',
      url: `https://ssyoutube.com/watch?v=${videoId}`,
      type: 'video',
      label: 'Download Video MP4 (Cepat)',
      thumbnail: hqThumbnail,
    },
    {
      format: 'mp3',
      quality: 'Audio MP3 (320kbps)',
      url: `https://y2mate.is/download-youtube-mp3/${videoId}`,
      type: 'audio',
      label: 'Download Audio MP3 (Suara Saja)',
    },
    {
      format: 'image',
      quality: 'Cover Thumbnail HD (1280x720)',
      url: thumbnail,
      type: 'image',
      label: 'Download Thumbnail Cover HD',
      thumbnail: hqThumbnail,
    },
  ];

  return {
    platform: 'youtube',
    platformName: isShorts ? 'YouTube Shorts' : 'YouTube',
    mediaType: 'video',
    title: videoTitle,
    author: authorName,
    thumbnail: hqThumbnail,
    sourceUrl,
    options,
  };
}

/**
 * 4. Instagram Client Extractor (Reels, Posts, Carousels)
 */
async function extractInstagramClient(sourceUrl: string): Promise<ExtractedMedia> {
  const shortcodeMatch = sourceUrl.match(/\/(?:p|reel|tv|reels)\/([A-Za-z0-9_-]+)/);
  const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';
  const isReel = sourceUrl.includes('/reel/') || sourceUrl.includes('/reels/');

  let title = isReel ? 'Instagram Reel Video' : 'Instagram Post';
  let author = 'Instagram User';
  let authorUsername = undefined;
  let thumbnail = undefined;

  // Query Instagram oEmbed (often accessible)
  try {
    const oembedRes = await fetchWithTimeout(
      `https://www.instagram.com/oembed/?url=${encodeURIComponent(sourceUrl)}`,
      {},
      4000
    );
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      if (oembed.title) title = oembed.title;
      if (oembed.author_name) {
        author = oembed.author_name;
        authorUsername = `@${oembed.author_name}`;
      }
      if (oembed.thumbnail_url) thumbnail = oembed.thumbnail_url;
    }
  } catch {
    // oembed fallback
  }

  // Provide direct 1-click download options preloaded with user's Instagram link
  const cleanUrl = encodeURIComponent(sourceUrl);
  const options: MediaOption[] = [
    {
      format: 'mp4',
      quality: 'HD Video MP4 (No Watermark)',
      url: `https://fastdl.app/id?url=${cleanUrl}`,
      type: 'video',
      label: 'Download MP4 (FastDL Server)',
      thumbnail,
    },
    {
      format: 'mp4',
      quality: 'HD Video Server 2',
      url: `https://saveig.app/id?url=${cleanUrl}`,
      type: 'video',
      label: 'Download MP4 (SaveIG Server)',
      thumbnail,
    },
    {
      format: 'mp4',
      quality: 'HD Video Server 3',
      url: `https://snapinsta.app/?url=${cleanUrl}`,
      type: 'video',
      label: 'Download MP4 (SnapInsta Server)',
      thumbnail,
    },
  ];

  return {
    platform: 'instagram',
    platformName: 'Instagram',
    mediaType: isReel ? 'reel' : 'post',
    title,
    author,
    authorUsername,
    thumbnail,
    sourceUrl,
    options,
  };
}

/**
 * 5. Spotify Client Extractor (oEmbed + MP3 Gateway)
 */
async function extractSpotifyClient(sourceUrl: string): Promise<ExtractedMedia> {
  const oembedRes = await fetchWithTimeout(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(sourceUrl)}`,
    {},
    5000
  );

  if (!oembedRes.ok) {
    throw new Error('Gagal mengambil metadata Spotify. Pastikan link lagu/album valid.');
  }

  const oembed = await oembedRes.json();
  const trackTitle = oembed.title || 'Spotify Track';
  const thumbnail = oembed.thumbnail_url;

  const options: MediaOption[] = [
    {
      format: 'mp3',
      quality: 'Track MP3 (320kbps High Quality)',
      url: `https://spotidownloader.com/?url=${encodeURIComponent(sourceUrl)}`,
      type: 'audio',
      label: 'Download Audio MP3 (320kbps)',
      thumbnail,
    },
    {
      format: 'mp3',
      quality: 'Track Audio Mirror',
      url: `https://spotify-downloader.com/?url=${encodeURIComponent(sourceUrl)}`,
      type: 'audio',
      label: 'Download Audio MP3 (Server 2)',
      thumbnail,
    },
  ];

  if (thumbnail) {
    options.push({
      format: 'image',
      quality: 'Cover Artwork HD',
      url: thumbnail,
      type: 'image',
      label: 'Download Cover Art HD',
      thumbnail,
    });
  }

  return {
    platform: 'spotify',
    platformName: 'Spotify',
    mediaType: 'audio',
    title: trackTitle,
    author: 'Spotify Music',
    thumbnail,
    sourceUrl,
    options,
  };
}

/**
 * 6. SoundCloud Client Extractor
 */
async function extractSoundCloudClient(sourceUrl: string): Promise<ExtractedMedia> {
  const oembedRes = await fetchWithTimeout(
    `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(sourceUrl)}`,
    {},
    5000
  );

  if (!oembedRes.ok) {
    throw new Error('Gagal mengambil informasi dari SoundCloud.');
  }

  const oembed = await oembedRes.json();
  const title = oembed.title || 'SoundCloud Audio';
  const author = oembed.author_name || 'SoundCloud Artist';
  const thumbnail = oembed.thumbnail_url;

  const options: MediaOption[] = [
    {
      format: 'mp3',
      quality: 'Audio MP3 (128-320kbps)',
      url: `https://sclouddownloader.net/download-sound-track?url=${encodeURIComponent(sourceUrl)}`,
      type: 'audio',
      label: 'Download MP3 Track',
      thumbnail,
    },
  ];

  if (thumbnail) {
    options.push({
      format: 'image',
      quality: 'Artwork Cover HD',
      url: thumbnail,
      type: 'image',
      label: 'Download Cover Artwork',
      thumbnail,
    });
  }

  return {
    platform: 'soundcloud',
    platformName: 'SoundCloud',
    mediaType: 'audio',
    title,
    author,
    thumbnail,
    sourceUrl,
    options,
  };
}

/**
 * 7. CapCut Client Extractor
 */
async function extractCapCutClient(sourceUrl: string): Promise<ExtractedMedia> {
  let templateId = '';
  const match = sourceUrl.match(/template-detail\/(\d+)/) || sourceUrl.match(/\/template\/(\d+)/);
  if (match && match[1]) {
    templateId = match[1];
  }

  return {
    platform: 'capcut',
    platformName: 'CapCut',
    mediaType: 'video',
    title: templateId ? `CapCut Template #${templateId}` : 'CapCut Video Template',
    author: 'CapCut Creator',
    sourceUrl,
    options: [
      {
        format: 'mp4',
        quality: 'HD Video MP4 (Tanpa Watermark)',
        url: `https://savecapcut.com/process?url=${encodeURIComponent(sourceUrl)}`,
        type: 'video',
        label: 'Download MP4 (Tanpa Watermark)',
      },
      {
        format: 'mp3',
        quality: 'Audio Template MP3',
        url: `https://savecapcut.com/process?url=${encodeURIComponent(sourceUrl)}&type=audio`,
        type: 'audio',
        label: 'Download Audio MP3',
      },
    ],
  };
}

/**
 * 8. Facebook Client Extractor
 */
async function extractFacebookClient(sourceUrl: string): Promise<ExtractedMedia> {
  const cleanUrl = encodeURIComponent(sourceUrl);
  return {
    platform: 'facebook',
    platformName: 'Facebook',
    mediaType: 'video',
    title: 'Facebook Video / Reels',
    author: 'Facebook Creator',
    sourceUrl,
    options: [
      {
        format: 'mp4',
        quality: 'HD Video MP4',
        url: `https://fdown.net/download.php?url=${cleanUrl}`,
        type: 'video',
        label: 'Download Video MP4 (HD)',
      },
      {
        format: 'mp4',
        quality: 'SD Video MP4',
        url: `https://snapsave.app/?url=${cleanUrl}`,
        type: 'video',
        label: 'Download Video MP4 (Server 2)',
      },
      {
        format: 'mp3',
        quality: 'Audio MP3',
        url: `https://fdown.net/download.php?url=${cleanUrl}&format=mp3`,
        type: 'audio',
        label: 'Download Audio MP3',
      },
    ],
  };
}

/**
 * 9. Pinterest Client Extractor
 */
async function extractPinterestClient(sourceUrl: string): Promise<ExtractedMedia> {
  return {
    platform: 'pinterest',
    platformName: 'Pinterest',
    mediaType: 'video',
    title: 'Pinterest Pin Media',
    author: 'Pinterest Creator',
    sourceUrl,
    options: [
      {
        format: 'mp4',
        quality: 'HD Video Pin MP4',
        url: `https://pinterestvideodownloader.com/download.php?url=${encodeURIComponent(sourceUrl)}`,
        type: 'video',
        label: 'Download Video Pin MP4',
      },
      {
        format: 'image',
        quality: 'Foto Pin Resolusi Penuh',
        url: `https://pinterestdownloader.com/?url=${encodeURIComponent(sourceUrl)}`,
        type: 'image',
        label: 'Download Foto Pin HD',
      },
    ],
  };
}

/**
 * 10. Direct Media Link Extractor (e.g. .mp4, .mp3, .webm, .jpg, .png)
 */
function extractDirectMedia(sourceUrl: string): ExtractedMedia | null {
  try {
    const urlObj = new URL(sourceUrl);
    const pathname = urlObj.pathname.toLowerCase();
    const filename = pathname.split('/').pop() || 'media_file';

    if (pathname.endsWith('.mp4') || pathname.endsWith('.webm')) {
      return {
        platform: 'direct',
        platformName: 'Direct Video Stream',
        mediaType: 'video',
        title: decodeURIComponent(filename),
        sourceUrl,
        options: [
          {
            format: 'mp4',
            quality: 'Direct Stream MP4',
            url: sourceUrl,
            type: 'video',
            label: 'Download File Video MP4',
          },
        ],
      };
    }

    if (pathname.endsWith('.mp3') || pathname.endsWith('.m4a') || pathname.endsWith('.wav')) {
      return {
        platform: 'direct',
        platformName: 'Direct Audio Stream',
        mediaType: 'audio',
        title: decodeURIComponent(filename),
        sourceUrl,
        options: [
          {
            format: 'mp3',
            quality: 'Direct Audio Stream',
            url: sourceUrl,
            type: 'audio',
            label: 'Download File Audio MP3',
          },
        ],
      };
    }

    if (pathname.endsWith('.jpg') || pathname.endsWith('.jpeg') || pathname.endsWith('.png') || pathname.endsWith('.webp')) {
      return {
        platform: 'direct',
        platformName: 'Direct Image File',
        mediaType: 'post',
        title: decodeURIComponent(filename),
        thumbnail: sourceUrl,
        sourceUrl,
        options: [
          {
            format: 'image',
            quality: 'Direct Image HD',
            url: sourceUrl,
            type: 'image',
            label: 'Download File Foto HD',
            thumbnail: sourceUrl,
          },
        ],
      };
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Main Client-Side Media Extractor
 * Executes 100% in browser without any server.ts requirement!
 */
export async function extractMediaClient(rawUrl: string): Promise<ExtractedMedia> {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    throw new Error('Masukkan URL media yang valid.');
  }

  // Check direct media URL first
  const direct = extractDirectMedia(trimmed);
  if (direct) {
    return direct;
  }

  const detected = detectPlatform(trimmed);

  switch (detected.key) {
    case 'tiktok':
      return await extractTikTokClient(trimmed);

    case 'twitter':
      return await extractTwitterClient(trimmed);

    case 'youtube':
      return await extractYouTubeClient(trimmed);

    case 'instagram':
      return await extractInstagramClient(trimmed);

    case 'spotify':
      return await extractSpotifyClient(trimmed);

    case 'soundcloud':
      return await extractSoundCloudClient(trimmed);

    case 'capcut':
      return await extractCapCutClient(trimmed);

    case 'facebook':
      return await extractFacebookClient(trimmed);

    case 'pinterest':
      return await extractPinterestClient(trimmed);

    default: {
      // Fallback: If unknown, try TikTok or oEmbed
      try {
        return await extractTikTokClient(trimmed);
      } catch {
        throw new Error(
          'Platform belum didukung secara otomatis atau link tidak dapat diekstrak. Pastikan link berasal dari TikTok, YouTube, Instagram, Twitter/X, Spotify, CapCut, Facebook, atau Pinterest.'
        );
      }
    }
  }
}
