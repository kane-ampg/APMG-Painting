import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CmsImage } from '@/components/media/cms-image';

describe('CmsImage', () => {
  it('passes stored dimensions and blur through to next/image', () => {
    const { container } = render(
      <CmsImage
        image={{
          src: '/images/work/x.webp',
          alt: 'A wall',
          width: 1600,
          height: 900,
          blurDataURL: 'data:image/webp;base64,AAAA',
        }}
        sizes="100vw"
      />,
    );
    const img = container.querySelector('img')!;
    expect(img.getAttribute('alt')).toBe('A wall');
    expect(img.getAttribute('width')).toBe('1600');
    expect(img.getAttribute('height')).toBe('900');
    // next/image's generated blur SVG genuinely carries the blurDataURL inside
    // its background-image value (verified via react-dom/server rendering,
    // which shows the raw markup a browser receives). jsdom's CSSOM
    // (cssstyle) rejects that value outright: parseUrl() in
    // node_modules/cssstyle/lib/parsers.js demands that spaces and quotes be
    // backslash-escaped even inside a quoted url("...") string, which
    // Next's SVG template does not do, so cssstyle silently drops the whole
    // background-image declaration on mount. That is a jsdom test-double gap,
    // not a defect in this component. background-size/position/repeat are
    // written by the same conditional in next/image and do survive jsdom's
    // CSSOM validation, so they are the reliable in-jsdom signal that the
    // blur placeholder engaged.
    expect(img.style.backgroundSize).toBe('cover');
  });

  it('marks a priority image fetchpriority=high, and leaves the rest alone', () => {
    // next/image's `priority` prop is deprecated in Next 16 and no longer
    // emits `fetchpriority`, so the hero would have quietly lost its place
    // at the front of the request queue. `preload` is what inserts the
    // <link rel=preload>; this attribute is the other half.
    const image = { src: '/images/work/x.webp', alt: 'A wall', width: 1600, height: 900 };
    const { container: withPriority } = render(<CmsImage image={image} sizes="100vw" priority />);
    expect(withPriority.querySelector('img')!.getAttribute('fetchpriority')).toBe('high');

    const { container: without } = render(<CmsImage image={image} sizes="100vw" />);
    expect(without.querySelector('img')!.getAttribute('fetchpriority')).toBeNull();
  });

  it('falls back to fill layout when dimensions are unknown', () => {
    const { container } = render(
      <div style={{ position: 'relative', width: 100, height: 100 }}>
        <CmsImage image={{ src: '/images/work/x.webp', alt: 'A wall' }} sizes="100vw" />
      </div>,
    );
    const img = container.querySelector('img')!;
    expect(img.getAttribute('width')).toBeNull();
  });
});
