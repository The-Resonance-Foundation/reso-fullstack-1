import * as Sentry from "@sentry/nextjs";

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Cloudflare Turnstile's third-party script reports transient client
    // errors (e.g. 300010 on some mobile browsers). The widget resets itself
    // and recovers; paging on every mobile hiccup is pure noise.
    ignoreErrors: [/\[Cloudflare Turnstile\]/],
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
