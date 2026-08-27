export type MediaProviderType = 'YOUTUBE' | 'VIMEO' | 'TWITCH' | 'DIRECT_URL' | 'HLS' | 'DASH' | 'CUSTOM';
export type MediaType = 'VIDEO' | 'AUDIO' | 'STREAM' | 'SCREEN' | 'EXTERNAL';

export interface ParsedMediaInfo {
  provider: MediaProviderType;
  type: MediaType;
  externalId: string;
  sourceUrl: string;
  title: string | null;
  description: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  metadata: Record<string, unknown> | null;
}

export interface IMediaProvider {
  readonly provider: MediaProviderType;
  supports(url: string): boolean;
  parse(url: string): Promise<ParsedMediaInfo>;
}
