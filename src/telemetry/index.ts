// Telemetry adapter. Brief §14 — events go to PostHog if keyed, else console.
// Respect Do Not Track. No PII.

interface EventPayload {
  [k: string]: string | number | boolean | undefined;
}

const dnt =
  typeof navigator !== 'undefined' &&
  ((navigator as Navigator & { doNotTrack?: string }).doNotTrack === '1' ||
    (window as Window & { doNotTrack?: string }).doNotTrack === '1');

const POSTHOG_KEY = (import.meta.env.VITE_POSTHOG_KEY as string | undefined) ?? '';

let inited = false;

function init() {
  if (inited) return;
  inited = true;
  if (POSTHOG_KEY && !dnt) {
    // Stub: a real implementation would lazy-load posthog-js here. We keep it
    // out of the bundle until a key is present so the cold start is unaffected.
    // eslint-disable-next-line no-console
    console.info('[telemetry] PostHog key present; would initialize here.');
  }
}

export function track(event: string, props: EventPayload = {}): void {
  init();
  if (dnt) return;
  // eslint-disable-next-line no-console
  console.debug('[telemetry]', event, props);
}
