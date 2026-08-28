import type { IMediaProvider, ParsedMediaInfo } from './media-provider.interface.js';
import { BadRequestError } from '../../../core/errors/index.js';

export class YouTubeMediaProvider implements IMediaProvider {
  public readonly provider = 'YOUTUBE';

  private static YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts|watch)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;

  public supports(url: string): boolean {
    if (!url) return false;
    const clean = url.trim();
    return YouTubeMediaProvider.YOUTUBE_REGEX.test(clean) || /^[a-zA-Z0-9_-]{11}$/.test(clean);
  }

  public extractVideoId(url: string): string | null {
    if (!url) return null;
    const clean = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(clean)) {
      return clean;
    }
    const match = clean.match(YouTubeMediaProvider.YOUTUBE_REGEX);
    return match && match[1] ? match[1] : null;
  }

  public async parse(url: string): Promise<ParsedMediaInfo> {
    const videoId = this.extractVideoId(url);
    if (!videoId) {
      throw new BadRequestError('Invalid YouTube URL or Video ID');
    }

    const standardUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    return {
      provider: 'YOUTUBE',
      type: 'VIDEO',
      externalId: videoId,
      sourceUrl: standardUrl,
      title: `YouTube Video (${videoId})`,
      description: null,
      thumbnailUrl,
      duration: 600,
      metadata: {
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1`,
      },
    };
  }
}

export class TwitchMediaProvider implements IMediaProvider {
  public readonly provider = 'TWITCH';

  public supports(url: string): boolean {
    return /twitch\.tv\/([a-zA-Z0-9_]+)/i.test(url.trim());
  }

  public async parse(url: string): Promise<ParsedMediaInfo> {
    const match = url.trim().match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
    const channel = match && match[1] ? match[1] : 'stream';
    return {
      provider: 'TWITCH',
      type: 'STREAM',
      externalId: channel,
      sourceUrl: url.trim(),
      title: `Twitch Stream: ${channel}`,
      description: null,
      thumbnailUrl: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-440x248.jpg`,
      duration: null,
      metadata: { channel },
    };
  }
}

export class VimeoMediaProvider implements IMediaProvider {
  public readonly provider = 'VIMEO';

  public supports(url: string): boolean {
    return /vimeo\.com\/(\d+)/i.test(url.trim());
  }

  public async parse(url: string): Promise<ParsedMediaInfo> {
    const match = url.trim().match(/vimeo\.com\/(\d+)/i);
    const vimeoId = match && match[1] ? match[1] : 'video';
    return {
      provider: 'VIMEO',
      type: 'VIDEO',
      externalId: vimeoId,
      sourceUrl: url.trim(),
      title: `Vimeo Video (${vimeoId})`,
      description: null,
      thumbnailUrl: null,
      duration: 300,
      metadata: { vimeoId },
    };
  }
}

export class DirectMediaProvider implements IMediaProvider {
  public readonly provider = 'DIRECT_URL';

  public supports(url: string): boolean {
    const clean = (url || '').trim();
    return /\.(mp4|webm|ogg|m3u8|mov|flv|avi)($|\?)/i.test(clean) || clean.includes('.m3u8');
  }

  public async parse(url: string): Promise<ParsedMediaInfo> {
    const clean = url.trim();
    const isHls = clean.includes('.m3u8');
    return {
      provider: isHls ? 'HLS' : 'DIRECT_URL',
      type: 'VIDEO',
      externalId: `direct-${Date.now()}`,
      sourceUrl: clean,
      title: isHls ? 'HLS Live Stream' : 'Direct Video Stream',
      description: null,
      thumbnailUrl: null,
      duration: 600,
      metadata: { url: clean },
    };
  }
}

export class MediaProviderStrategy {
  private providers: IMediaProvider[] = [];

  constructor() {
    this.register(new YouTubeMediaProvider());
    this.register(new TwitchMediaProvider());
    this.register(new VimeoMediaProvider());
    this.register(new DirectMediaProvider());
  }

  public register(provider: IMediaProvider): void {
    this.providers.push(provider);
  }

  public resolve(url: string): IMediaProvider {
    const clean = (url || '').trim();
    const provider = this.providers.find((p) => p.supports(clean));
    if (!provider) {
      throw new BadRequestError(`No media provider found to handle URL: ${url}`);
    }
    return provider;
  }
}
