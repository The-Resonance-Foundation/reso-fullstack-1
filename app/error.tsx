"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"

/**
 * Root error boundary. The most common visitor-facing failure is deployment
 * skew: a tab held open across a deploy submits a server action that no
 * longer exists. A hard refresh fixes that, so the page says so plainly.
 * Renders inside the root layout (light brand tokens), so colors are pinned
 * explicitly to stay legible regardless of which section crashed.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "#FDFCF9",
        color: "#33384E",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: 460 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#2A397B",
            marginBottom: 14,
          }}
        >
          The Resonance Foundation
        </div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#2A397B",
            margin: "0 0 12px",
            lineHeight: 1.2,
          }}
        >
          Something went out of tune
        </h1>
        <p style={{ margin: "0 0 8px", lineHeight: 1.6 }}>
          Sorry about that. If this page has been open for a while, we probably
          just shipped an update, and a quick refresh fixes it.
        </p>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "#6E7387" }}>
          If it keeps happening, email administrator@theresonancefoundation.org
          and we will take a look.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
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
          <button
            onClick={() => reset()}
            style={{
              background: "transparent",
              color: "#2A397B",
              border: "1px solid #2A397B",
              borderRadius: 8,
              padding: "10px 22px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
