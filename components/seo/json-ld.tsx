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
      // Payloads are built from typed, first-party content — never user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
