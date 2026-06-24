import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const fixture = JSON.parse(
  readFileSync(join(root, "lib/paypal/fixtures/capture-completed.json"), "utf8")
)

const resource = fixture.resource
const amount = Number(resource.amount.value)
const captureId = resource.id

if (fixture.event_type !== "PAYMENT.CAPTURE.COMPLETED") {
  console.error("Wrong fixture event type")
  process.exit(1)
}

if (captureId !== "CAPTURE-FIXTURE-001" || amount !== 25) {
  console.error("Fixture structure unexpected", { captureId, amount })
  process.exit(1)
}

console.log("PayPal fixture OK:", { captureId, amount, eventId: fixture.id })
