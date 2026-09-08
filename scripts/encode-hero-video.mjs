#!/usr/bin/env node
/**
 * Hero reel encoder.
 *
 * The master APMG banner video is 3840x2160, 57s, 50 Mbps — 342 MB. That file
 * is a deliverable from the editor, not a web asset: it lives in `media/`,
 * which is gitignored, and it is never deployed. Everything the browser sees
 * is produced here.
 *
 * Two decisions are baked in:
 *
 * 1. The cut ends at 28.767s, on a scene boundary. That is the last frame
 *    before the reel moves to residential work — and this site is deliberately
 *    commercial-only (there is a `no-residential` test enforcing it). The
 *    commercial run is: Docklands aerial, the branded vans on a shopping strip,
 *    occupied open-plan office, stairwell roller, stairwell cut-in, retail
 *    showroom. It loops back to the aerial on a hard cut, which is what the
 *    reel already does every four seconds.
 *
 * 2. Audio is stripped, not muted. A background hero can never play it, and it
 *    is ~460 KB of payload that no one will ever hear.
 *
 * 3. H.264 only. VP9 was encoded alongside it first and came in 4-9% smaller
 *    at matching quality on this footage — not enough to justify a second
 *    7 MB of committed binaries, a second `<source>`, and tripling the encode
 *    time. H.264 also needs no fallback: every browser that can autoplay a
 *    muted background video can decode it.
 *
 * Outputs, all into public/video/:
 *
 *   hero-1080.mp4   desktop
 *   hero-720.mp4    phones and tablets, chosen at runtime
 *   ../images/hero/banner-poster.webp   first frame, the LCP element
 *
 * Run it with:  node scripts/encode-hero-video.mjs
 *
 * Requires ffmpeg. It is resolved from PATH first, then from the `ffmpeg-static`
 * package if that happens to be installed — the project does not depend on it,
 * because this script runs when the footage changes, not when the site builds.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MASTER = join(root, 'media', 'apmg-banner-master.mp4');
const VIDEO_DIR = join(root, 'public', 'video');
const POSTER = join(root, 'public', 'images', 'hero', 'banner-poster.webp');

/** Last frame before the reel leaves commercial work. See the header note. */
const DURATION = '28.767';

function findFfmpeg() {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {
    /* not on PATH — fall through */
  }
  try {
    return createRequire(import.meta.url)('ffmpeg-static');
  } catch {
    throw new Error(
      'ffmpeg not found. Install it on PATH, or run `npm i --no-save ffmpeg-static` first.',
    );
  }
}

const ffmpeg = findFfmpeg();

function run(label, args) {
  process.stdout.write(`${label}… `);
  const started = Date.now();
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(0);
  console.log(`${seconds}s`);
}

function report(path) {
  const kb = statSync(path).size / 1024;
  const size = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`;
  console.log(`  ${path.replace(root, '.').replace(/\\/g, '/')}  ${size}`);
}

/** Shared trim + downscale. `format=yuv420p` is what makes Safari play it. */
const source = (height) => [
  '-t',
  DURATION,
  '-i',
  MASTER,
  '-an',
  '-vf',
  `scale=-2:${height}:flags=lanczos,format=yuv420p`,
];

/**
 * H.264 High, the universal fallback.
 *
 * A 2-second keyframe interval with `sc_threshold 0` keeps seeking and the
 * loop restart cheap, and `+faststart` moves the index to the front of the
 * file so playback can begin on the first range request rather than after the
 * whole download.
 */
const h264 = (crf) => [
  '-c:v',
  'libx264',
  '-profile:v',
  'high',
  '-preset',
  'slow',
  '-crf',
  String(crf),
  '-g',
  '60',
  '-keyint_min',
  '60',
  '-sc_threshold',
  '0',
  '-movflags',
  '+faststart',
];

if (!existsSync(MASTER)) {
  console.error(`Master not found: ${MASTER}`);
  console.error('It is gitignored — copy it back from the editor deliverable before encoding.');
  process.exit(1);
}

mkdirSync(VIDEO_DIR, { recursive: true });
mkdirSync(dirname(POSTER), { recursive: true });

const outputs = [
  ['1080p MP4', [...source(1080), ...h264(29), join(VIDEO_DIR, 'hero-1080.mp4')]],
  ['720p MP4', [...source(720), ...h264(30), join(VIDEO_DIR, 'hero-720.mp4')]],
  [
    'poster',
    [
      '-i',
      MASTER,
      '-frames:v',
      '1',
      '-vf',
      'scale=1920:-2:flags=lanczos',
      '-quality',
      '82',
      POSTER,
    ],
  ],
];

for (const [label, args] of outputs) run(label, args);

console.log('\nWrote:');
for (const [, args] of outputs) report(args[args.length - 1]);
