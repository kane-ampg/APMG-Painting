import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { JsonLd } from '@/components/seo/json-ld';

/**
 * JSON.stringify does not escape `<`, so a content string containing
 * "</script>" would terminate the JSON-LD block and inject markup into the
 * document. Nothing in content/ carries one today, but first-party review
 * quotes — customer-authored text — flow into this sink the day one is added.
 * The component escapes `<` as <, which is valid JSON and inert in HTML.
 */
describe('JsonLd', () => {
  it('cannot be broken out of by a </script> sequence in content', () => {
    const html = renderToStaticMarkup(
      createElement(JsonLd, {
        data: { name: 'quote with </script><script>alert(1)</script> inside' },
      }),
    );
    expect(html.match(/<script/gi)).toHaveLength(1);
    expect(html).not.toContain('</script><script>');
  });

  it('still emits parseable JSON', () => {
    const html = renderToStaticMarkup(
      createElement(JsonLd, { data: { name: 'a < b', nested: { q: '</script>' } } }),
    );
    const body = html.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '');
    expect(JSON.parse(body)).toEqual({ name: 'a < b', nested: { q: '</script>' } });
  });
});
