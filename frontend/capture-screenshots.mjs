// Captures screenshots of each page for the submission.
// Usage: node capture-screenshots.mjs   (both dev servers must be running)
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'screenshots')
const BASE = process.env.APP_URL || 'http://127.0.0.1:5173'

const shots = [
  { path: '/', file: '01-dashboard.png', wait: 1500 },
  { path: '/employees', file: '02-employees.png', wait: 1500 },
  { path: '/seats', file: '03-seats.png', wait: 1500 },
  { path: '/new-joiner', file: '04-new-joiner.png', wait: 1000 },
  { path: '/assistant', file: '05-assistant.png', wait: 800, ai: true },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

for (const s of shots) {
  await page.goto(BASE + s.path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(s.wait)
  if (s.ai) {
    // Fire a couple of sample questions so the chat has content.
    const chips = await page.locator('button.rounded-full').all()
    if (chips[0]) { await chips[0].click(); await page.waitForTimeout(1200) }
    if (chips[2]) { await chips[2].click(); await page.waitForTimeout(1200) }
  }
  await page.screenshot({ path: join(OUT, s.file), fullPage: true })
  console.log('saved', s.file)
}

await browser.close()
console.log('done')
