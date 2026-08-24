"use client"

import { useEffect, useRef } from "react"

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id: string) => void
      remove: (id: string) => void
    }
  }
}

/** Widget resets attempted after a client-side Turnstile error (e.g. 300010
 * on some mobile browsers) before giving up and showing Cloudflare's own
 * error UI. */
const MAX_ERROR_RETRIES = 3

function loadScript(onReady: () => void) {
  if (window.turnstile) {
    onReady()
    return
  }
  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`
  )
  const script = existing ?? document.createElement("script")
  script.addEventListener("load", onReady, { once: true })
  if (!existing) {
    script.src = SCRIPT_SRC
    script.async = true
    document.head.appendChild(script)
  }
}

/**
 * Cloudflare Turnstile CAPTCHA. Injects a hidden `captchaToken` input into the
 * surrounding form. Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is not
 * configured, so auth keeps working in environments without CAPTCHA keys.
 *
 * Tokens are single-use — pass the form's action state as `resetSignal` so a
 * failed submission issues a fresh token for the retry.
 */
export function TurnstileWidget({ resetSignal }: { resetSignal?: unknown }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const errorRetriesRef = useRef(0)

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false
    loadScript(() => {
      if (cancelled || !containerRef.current || widgetIdRef.current !== null) return
      // Auth pages always render on the dark aurora surface.
      widgetIdRef.current = window.turnstile!.render(containerRef.current, {
        sitekey: SITE_KEY,
        theme: "dark",
        "response-field-name": "captchaToken",
        retry: "auto",
        "refresh-expired": "auto",
        // Client-side widget errors (like 300010 on some mobile browsers) are
        // usually transient: reset a few times so the visitor still gets a
        // token instead of a dead form. Returning true marks the error as
        // handled so Turnstile doesn't throw it to the global error handler.
        "error-callback": () => {
          if (cancelled || widgetIdRef.current === null) return true
          if (errorRetriesRef.current >= MAX_ERROR_RETRIES) return false
          errorRetriesRef.current += 1
          const id = widgetIdRef.current
          setTimeout(() => {
            if (!cancelled && widgetIdRef.current === id) {
              try {
                window.turnstile?.reset(id)
              } catch {
                // widget already gone — nothing to recover
              }
            }
          }, 1500 * errorRetriesRef.current)
          return true
        },
      })
    })
    return () => {
      cancelled = true
      if (widgetIdRef.current !== null) {
        window.turnstile?.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (resetSignal !== undefined && widgetIdRef.current !== null) {
      window.turnstile?.reset(widgetIdRef.current)
    }
  }, [resetSignal])

  if (!SITE_KEY) return null
  return <div ref={containerRef} className="flex justify-center" />
}
