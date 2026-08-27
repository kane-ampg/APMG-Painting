/**
 * Renders a JSON-LD block.
 *
 * Server-rendered, so no client JavaScript is involved. The payload is built by
 * `lib/schema` and only ever describes content that is visible on the page.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Payloads are built from typed, first-party content — but content is
      // still text: the day a first-party review quote contains "</script>",
      // an unescaped "<" terminates this block and injects markup. The
      // < escape is valid JSON and inert in HTML, so parsers see
      // identical data.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
