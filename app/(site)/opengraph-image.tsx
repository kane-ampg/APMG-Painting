import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';
import { getSiteSettings } from '@/lib/content/source';

/**
 * Default social share card.
 *
 * Every page's OpenGraph and Twitter metadata pointed at
 * /images/og/apmg-default.jpg, which does not exist — public/images/og/ is an
 * empty directory, so every shared link rendered a broken card. Generating the
 * card here removes the dependency on an asset nobody has produced, and keeps
 * it in step with the brand automatically.
 *
 * Drawn in the brand guide's colours and faces rather than an approximation:
 * Industrial Black #1C1C1C, Primary Red #C8102E, brand-400 #E24356 for the
 * rule; Oswald for the headline and Roboto for everything else. The renderer
 * cannot see the fonts next/font self-hosts for the pages, and has no system
 * fonts at all, so the two cuts it needs are checked in under public/fonts/og
 * and read from disk here. Both are Open Font Licence.
 */
export const alt = `${site.name} — commercial painters, Melbourne`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const INK = '#1C1C1C';
const RED = '#C8102E';
const RED_LIGHT = '#E24356';

function ogFont(file: string) {
  return readFile(join(process.cwd(), 'public', 'fonts', 'og', file));
}

export default async function OpengraphImage() {
  const [settings, oswald, roboto] = await Promise.all([
    getSiteSettings(),
    ogFont('oswald-500.ttf'),
    ogFont('roboto-400.ttf'),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: INK,
        padding: '72px 80px',
        fontFamily: 'Roboto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontFamily: 'Oswald',
            fontSize: 48,
            color: '#FFFFFF',
            letterSpacing: '0.02em',
            lineHeight: 1,
          }}
        >
          APMG
        </div>
        <div
          style={{
            fontSize: 20,
            color: RED,
            letterSpacing: '0.18em',
            marginTop: 10,
          }}
        >
          PAINTING
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 96, height: 6, backgroundColor: RED, marginBottom: 32 }} />
        <div
          style={{
            fontFamily: 'Oswald',
            fontSize: 66,
            color: '#FFFFFF',
            lineHeight: 1.08,
            letterSpacing: '0.01em',
            maxWidth: 940,
          }}
        >
          Painters for buildings that cannot stop running
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          fontSize: 24,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <span>Commercial painting · {settings.serviceAreaPrimary}</span>
        <span style={{ color: RED_LIGHT }}>{settings.phone}</span>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Oswald', data: oswald, weight: 500, style: 'normal' },
        { name: 'Roboto', data: roboto, weight: 400, style: 'normal' },
      ],
    },
  );
}
