import { describe, expect, it } from 'vitest';
import { globSync, readFileSync } from 'node:fs';

const SOURCE_GLOB = [
  'app/**/*.tsx',
  'app/**/*.ts',
  'components/**/*.tsx',
  'content/**/*.ts',
  'lib/**/*.ts',
];

function sourceFiles(): string[] {
  return SOURCE_GLOB.flatMap((p) => globSync(p, { cwd: process.cwd() }));
}

describe('residential surface is gone', () => {
  const banned = [/\bresidential\b/i, /\bhouse painting\b/i, /\bhomeowner/i];

  it.each(banned.map((r) => [r.source, r] as const))('no source file matches %s', (_label, re) => {
    const hits = sourceFiles().filter((f) => re.test(readFileSync(f, 'utf8')));
    expect(hits).toEqual([]);
  });

  it('has no residential route', () => {
    expect(globSync('app/residential-painting/**', { cwd: process.cwd() })).toEqual([]);
  });
});
