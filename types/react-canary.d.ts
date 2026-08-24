/*
 * `<ViewTransition>` ships in the React canary that the App Router runs on —
 * Next bundles it at node_modules/next/dist/compiled/react and aliases `react`
 * to it for app/ code. The published @types/react keeps canary-channel types in
 * a separate entry point, so without this reference `tsc` sees no such export.
 *
 * Types only. Nothing here reaches the bundle.
 */
/// <reference types="react/canary" />
