// Renders a docs/handbook/<name>.html guide to docs/<Output>.pdf via Chrome.
// Usage: node scripts/dev/build-role-handbook.mjs <input.html> <output.pdf>
import puppeteer from "puppeteer-core"
import { fileURLToPath, pathToFileURL } from "node:url"
import { join, isAbsolute } from "node:path"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const input = process.argv[2]
const output = process.argv[3]
if (!input || !output) {
  console.error("usage: build-role-handbook.mjs <input.html> <output.pdf>")
  process.exit(1)
}
const htmlPath = isAbsolute(input) ? input : join(ROOT, input)
const outPath = isAbsolute(output) ? output : join(ROOT, output)

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
})
const page = await browser.newPage()
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" })
await page.evaluateHandle("document.fonts.ready")

await page.pdf({
  path: outPath,
  format: "Letter",
  printBackground: true,
  displayHeaderFooter: true,
  margin: { top: "0in", right: "0in", left: "0in", bottom: "0.6in" },
  headerTemplate: "<span></span>",
  footerTemplate: `
    <div style="width:100%; text-align:center; font-size:6.6px; color:#2A397B;
                font-family:Arial, sans-serif; letter-spacing:0.25em; padding-top:14px;">
      THE RESONANCE FOUNDATION &nbsp;&middot;&nbsp; PORTAL GUIDE
      &nbsp;&middot;&nbsp; PAGE <span class="pageNumber"></span> OF <span class="totalPages"></span>
    </div>`,
})
await browser.close()
console.log("wrote", outPath)
