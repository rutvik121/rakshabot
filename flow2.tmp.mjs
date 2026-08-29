import { chromium } from 'playwright'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await browser.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 })
const page = await ctx.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))

await page.goto('http://localhost:5222/', { waitUntil: 'networkidle' })
await page.screenshot({ path: `${process.env.OUT}/1-landing.png` })
console.log('landing shows a chosen universe:', await page.locator('article').first().isVisible())

await page.getByRole('button', { name: /review|start|roast/i }).first().click()
await page.waitForSelector('#sibling-name')
await page.fill('#sibling-name', 'Kabir')
const ANSWERS = [
  'Screaming at his game at 3am while everyone is asleep',
  'Skins in Valorant, obviously',
  'Winning games he has no business winning',
  'My headphones and my charger constantly',
  'He is genuinely the funniest person I know',
]
for (const a of ANSWERS) {
  await page.getByRole('button', { name: /next|generate/i }).click()
  const ta = await page.$('textarea')
  if (ta) await ta.fill(a)
}
await page.getByRole('button', { name: /generate/i }).click()

// Capture the reveal beats as they play.
const beats = []
for (let i = 0; i < 22; i++) {
  await page.waitForTimeout(400)
  const h = await page.locator('h1').first().textContent().catch(() => null)
  if (h && beats[beats.length - 1] !== h.trim()) {
    beats.push(h.trim())
    await page.screenshot({ path: `${process.env.OUT}/2-beat-${beats.length}.png` })
  }
  if (await page.locator('article').first().isVisible().catch(() => false)) break
}
console.log('reveal beats:')
for (const b of beats) console.log('   ·', b)

await page.waitForTimeout(800)
await page.screenshot({ path: `${process.env.OUT}/3-result.png` })
const card = page.locator('article').first()
console.log('final artifact rendered:', await card.isVisible())
console.log('page errors:', errs.length ? errs : 'none ✓')
await browser.close()
