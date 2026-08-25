/**
 * Node's native ESM resolver requires explicit file extensions on relative
 * specifiers, even for TypeScript files it strips at load time (this is
 * documented Node behaviour, not a stripping bug: 'import ./foo' does not
 * resolve to './foo.ts' the way it does under tsc's "bundler" resolution or a
 * bundler like webpack/vite).
 *
 * lib/geo and lib/locations are shared across the whole app (Next.js,
 * Vitest) and correctly use extensionless relative imports for that bundler
 * resolution. Rather than adding extensions there — which only this one
 * script, run directly by node, needs — this hook customizes module
 * resolution just for that invocation: if the default resolution of a
 * relative specifier fails, retry with a TypeScript extension appended.
 */
const TS_EXTENSIONS = ['.ts', '.mts', '.tsx'];

export async function resolve(specifier, context, nextResolve) {
  const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
  if (!isRelative || /\.[a-z]+$/i.test(specifier)) {
    return nextResolve(specifier, context);
  }
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err?.code !== 'ERR_MODULE_NOT_FOUND') throw err;
    for (const ext of TS_EXTENSIONS) {
      try {
        return await nextResolve(specifier + ext, context);
      } catch {
        // try the next extension
      }
    }
    throw err;
  }
}
