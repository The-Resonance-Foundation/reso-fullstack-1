import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Certificate fonts/logo are read from disk at runtime — make sure they are
  // traced into the serverless bundle on Vercel.
  outputFileTracingIncludes: {
    "/**": ["./lib/pdf/assets/**/*"],
  },
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
