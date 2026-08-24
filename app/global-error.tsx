"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

/**
 * Last-resort boundary for crashes in the root layout itself. Must render its
 * own <html>/<body>, so everything is inline and self-contained.
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#FDFCF9",
          color: "#33384E",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 460 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#2A397B", margin: "0 0 12px" }}>
            Something went out of tune
          </h1>
          <p style={{ margin: "0 0 24px", lineHeight: 1.6 }}>
            Sorry about that. A refresh usually fixes it. If it keeps
            happening, email administrator@theresonancefoundation.org.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#2A397B",
              color: "#FDFCF9",
              border: "none",
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Refresh the page
          </button>
        </div>
      </body>
    </html>
  )
}
