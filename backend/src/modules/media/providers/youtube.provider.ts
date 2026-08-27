import type { IMediaProvider, ParsedMediaInfo } from './media-provider.interface.js';
import { BadRequestError } from '../../../core/errors/index.js';

export class YouTubeMediaProvider implements IMediaProvider {
  public readonly provider = 'YOUTUBE';

  private static YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;

  public supports(url: string): boolean {
    return YouTubeMediaProvider.YOUTUBE_REGEX.test(url) || /^[a-zA-Z0-9_-]{11}$/.test(url);
  }

  public extractVideoId(url: string): string | null {
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }
    const match = url.match(YouTubeMediaProvider.YOUTUBE_REGEX);
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
      duration: null,
      metadata: {
        videoId,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1`,
      },
    };
  }
}

export class MediaProviderStrategy {
  private providers: IMediaProvider[] = [];

  constructor() {
    this.register(new YouTubeMediaProvider());
  }

  public register(provider: IMediaProvider): void {
    this.providers.push(provider);
  }

  public resolve(url: string): IMediaProvider {
    const provider = this.providers.find((p) => p.supports(url));
    if (!provider) {
      throw new BadRequestError(`No media provider found to handle URL: ${url}`);
    }
    return provider;
  }
}
