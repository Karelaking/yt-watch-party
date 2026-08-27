import { describe, it, expect } from 'vitest';
import { YouTubeMediaProvider, MediaProviderStrategy } from '../src/modules/media/providers/youtube.provider.js';

describe('YouTubeMediaProvider', () => {
  const provider = new YouTubeMediaProvider();

  it('should extract video id from standard watch URL', () => {
    const id = provider.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract video id from short youtu.be URL', () => {
    const id = provider.extractVideoId('https://youtu.be/dQw4w9WgXcQ?t=42');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should extract video id from shorts URL', () => {
    const id = provider.extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    expect(id).toBe('dQw4w9WgXcQ');
  });

  it('should parse media info correctly', async () => {
    const info = await provider.parse('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(info.provider).toBe('YOUTUBE');
    expect(info.externalId).toBe('dQw4w9WgXcQ');
    expect(info.sourceUrl).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(info.thumbnailUrl).toContain('dQw4w9WgXcQ');
  });
});

describe('MediaProviderStrategy', () => {
  const strategy = new MediaProviderStrategy();

  it('should resolve YouTube provider for YouTube URLs', () => {
    const resolved = strategy.resolve('https://youtu.be/dQw4w9WgXcQ');
    expect(resolved.provider).toBe('YOUTUBE');
  });

  it('should throw for unsupported URLs', () => {
    expect(() => strategy.resolve('https://unknown-video-site.com/video123')).toThrow();
  });
});
