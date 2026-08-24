// Renders docs/handbook/handbook.html to docs/Resonance-Portal-Handbook.pdf
// using the locally installed Chrome (puppeteer-core).
import puppeteer from "puppeteer-core"
import { fileURLToPath, pathToFileURL } from "node:url"
import { join } from "node:path"

const ROOT = fileURLToPath(new URL("../..", import.meta.url))
const htmlPath = join(ROOT, "docs", "handbook", "handbook.html")
const outPath = join(ROOT, "docs", "Resonance-Portal-Handbook.pdf")

const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
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
      THE RESONANCE FOUNDATION &nbsp;&middot;&nbsp; MEMBER PORTAL HANDBOOK
      &nbsp;&middot;&nbsp; PAGE <span class="pageNumber"></span> OF <span class="totalPages"></span>
    </div>`,
})
await browser.close()
console.log("wrote", outPath)
