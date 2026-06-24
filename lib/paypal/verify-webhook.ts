export type PaypalWebhookHeaders = {
  transmissionId: string
  transmissionTime: string
  transmissionSig: string
  certUrl: string
  authAlgo: string
}

export function extractPaypalWebhookHeaders(
  headers: Headers
): PaypalWebhookHeaders | null {
  const transmissionId = headers.get("paypal-transmission-id")
  const transmissionTime = headers.get("paypal-transmission-time")
  const transmissionSig = headers.get("paypal-transmission-sig")
  const certUrl = headers.get("paypal-cert-url")
  const authAlgo = headers.get("paypal-auth-algo")

  if (
    !transmissionId ||
    !transmissionTime ||
    !transmissionSig ||
    !certUrl ||
    !authAlgo
  ) {
    return null
  }

  return {
    transmissionId,
    transmissionTime,
    transmissionSig,
    certUrl,
    authAlgo,
  }
}

export async function verifyPaypalWebhookSignature(
  rawBody: string,
  webhookHeaders: PaypalWebhookHeaders
): Promise<boolean> {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  const apiBase =
    process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com"

  if (!clientId || !clientSecret || !webhookId) {
    console.error("PayPal webhook env vars not configured")
    return false
  }

  let webhookEvent: unknown
  try {
    webhookEvent = JSON.parse(rawBody)
  } catch {
    return false
  }

  const tokenResponse = await fetch(`${apiBase}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!tokenResponse.ok) {
    console.error("PayPal token request failed", await tokenResponse.text())
    return false
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string }
  if (!tokenData.access_token) return false

  const verifyResponse = await fetch(
    `${apiBase}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: webhookHeaders.authAlgo,
        cert_url: webhookHeaders.certUrl,
        transmission_id: webhookHeaders.transmissionId,
        transmission_sig: webhookHeaders.transmissionSig,
        transmission_time: webhookHeaders.transmissionTime,
        webhook_id: webhookId,
        webhook_event: webhookEvent,
      }),
    }
  )

  if (!verifyResponse.ok) {
    console.error("PayPal verify request failed", await verifyResponse.text())
    return false
  }

  const verifyData = (await verifyResponse.json()) as {
    verification_status?: string
  }
  return verifyData.verification_status === "SUCCESS"
}
