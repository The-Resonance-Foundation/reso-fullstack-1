import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

// Source-map upload only runs when SENTRY_AUTH_TOKEN is present at build time;
// without it the wrapper is inert apart from the runtime SDK glue.
export default withSentryConfig(nextConfig, {
  org: "the-resonance-foundation",
  project: "resonance-portal",
  silent: true,
  widenClientFileUpload: false,
  disableLogger: true,
});
