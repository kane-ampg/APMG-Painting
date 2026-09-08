import { describe, expect, it } from 'vitest';
import sharp from 'sharp';
import { objectName, processImage } from '@/lib/media/process';

describe('media processing', () => {
  it('builds an immutable, slugified object name', () => {
    expect(objectName('3f9a2c7d00', 'Noble Park FACTORY 01.WEBP', 'projects')).toBe(
      'projects/3f9a2c-noble-park-factory-01.webp',
    );
  });

  it('reads dimensions and produces a small blur data URI', async () => {
    const png = await sharp({
      create: { width: 640, height: 360, channels: 3, background: '#336699' },
    })
      .png()
      .toBuffer();
    const result = await processImage(png, 'test.png', 'work');
    expect(result.width).toBe(640);
    expect(result.height).toBe(360);
    expect(result.mimeType).toBe('image/png');
    expect(result.storagePath).toMatch(/^work\/[0-9a-f]{6}-test\.png$/);
    expect(result.blurDataURL.startsWith('data:image/webp;base64,')).toBe(true);
    expect(result.blurDataURL.length).toBeLessThan(1500);
  });

  it('rejects anything that is not an image', async () => {
    await expect(processImage(Buffer.from('hello'), 'x.txt', 'work')).rejects.toThrow();
  });
});
