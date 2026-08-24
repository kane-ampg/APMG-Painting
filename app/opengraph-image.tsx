import { ImageResponse } from 'next/og';
import { site } from '@/lib/site';

/**
 * Default social share card.
 *
 * Every page's OpenGraph and Twitter metadata pointed at
 * /images/og/apmg-default.jpg, which does not exist — public/images/og/ is an
 * empty directory, so every shared link rendered a broken card. Generating the
 * card here removes the dependency on an asset nobody has produced, and keeps
 * it in step with the brand automatically.
 *
 * Drawn with the APMG black and red rather than an approximation: ink #0F1113,
 * brand red #C8102E, brand-400 #E24356 for the rule.
 */
export const alt = `${site.name} — commercial and residential painters, Melbourne`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#0F1113',
        padding: '72px 80px',
        fontFamily: 'Georgia, serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          APMG
        </div>
        <div
          style={{
            fontSize: 20,
            color: '#C8102E',
            letterSpacing: '0.18em',
            marginTop: 8,
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 600,
          }}
        >
          PAINTING
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ width: 96, height: 6, backgroundColor: '#C8102E', marginBottom: 32 }} />
        <div
          style={{
            fontSize: 62,
            color: '#FFFFFF',
            lineHeight: 1.08,
            letterSpacing: '-0.03em',
            maxWidth: 900,
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
          fontFamily: 'system-ui, sans-serif',
          fontSize: 24,
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <span>Commercial &amp; residential · {site.serviceArea.primary}</span>
        <span style={{ color: '#E24356', fontWeight: 600 }}>{site.phone.display}</span>
      </div>
    </div>,
    size,
  );
}
