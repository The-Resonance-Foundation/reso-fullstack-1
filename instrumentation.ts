import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    enableLogs: false,
    // Expected during deployments: a browser holding a page from an older
    // deployment submits a server action that no longer exists in the new
    // one. The error page tells the visitor to refresh; alerting on every
    // deploy is noise.
    ignoreErrors: ["Failed to find Server Action"],
  });
}

export const onRequestError = Sentry.captureRequestError;
