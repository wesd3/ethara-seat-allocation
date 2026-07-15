// Verification helper: capture the app in several accent themes + dark mode.
import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'screenshots')
const BASE = 'http://127.0.0.1:5173'

const variants = [
  { path: '/', accent: 'indigo', mode: 'light', file: 'theme-indigo-light.png' },
  { path: '/', accent: 'emerald', mode: 'dark', file: 'theme-emerald-dark.png' },
  { path: '/employees', accent: 'rose', mode: 'dark', file: 'theme-rose-dark-employees.png' },
  { path: '/assistant', accent: 'blue', mode: 'dark', file: 'theme-blue-dark-assistant.png' },
]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

for (const v of variants) {
  await page.addInitScript(({ a, m }) => {
    localStorage.setItem('ethara-accent', a)
    localStorage.setItem('ethara-mode', m)
  }, { a: v.accent, m: v.mode })
  await page.goto(BASE + v.path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  if (v.path === '/assistant') {
    const chips = await page.locator('button.chip').all()
    if (chips[0]) { await chips[0].click(); await page.waitForTimeout(1000) }
  }
  await page.screenshot({ path: join(OUT, v.file), fullPage: true })
  console.log('saved', v.file)
}
await browser.close()
console.log('done')
