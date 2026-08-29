import { chromium } from 'playwright'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const ctx = await browser.newContext({ viewport: { width: 1500, height: 1100 }, deviceScaleFactor: 2 })

const STYLES = ['CASE_FILE','AWARDS_NIGHT','SIBLING_WRAPPED','SCRAPBOOK','STOCK_REPORT','CHARACTER_STATS']

/* Decorations are deliberately bled past the edge and clipped by the frame;
   only real content escaping the canvas is a defect. */
const measure = (el) => {
  const r = el.getBoundingClientRect()
  let worst = 0, who = '', slack = 0
  for (const c of el.querySelectorAll('*')) {
    if (c.closest('[aria-hidden="true"]')) continue
    const cr = c.getBoundingClientRect()
    if (!cr.width && !cr.height) continue
    const over = Math.max(cr.bottom - r.bottom, cr.right - r.right, r.top - cr.top, r.left - cr.left)
    if (over > worst) { worst = over; who = (c.textContent || c.tagName).trim().slice(0, 34) }
  }
  const footer = el.querySelector('footer')
  const above = el.querySelector('footer')?.previousElementSibling?.lastElementChild
  if (footer && above) slack = footer.getBoundingClientRect().top - above.getBoundingClientRect().bottom
  return { w: Math.round(r.width), h: Math.round(r.height), overflow: Math.round(worst), who, slack: Math.round(slack) }
}

for (const style of [...STYLES, 'stress']) {
  const p = await ctx.newPage()
  await p.goto(`http://localhost:5222/?preview=${style}&width=1080`, { waitUntil: 'networkidle' })
  await p.waitForTimeout(350)
  const card = p.locator('article').first()
  await card.screenshot({ path: `${process.env.OUT}/${style}.png` })
  const m = await card.evaluate(measure)
  console.log(
    `${style.padEnd(17)} ${m.w}x${m.h}  content-overflow ${String(m.overflow).padStart(3)}px ` +
    `${m.overflow > 1 ? '<-- ' + m.who : '✓'}   slack-above-footer ${m.slack}px`
  )
  await p.close()
}

const g = await ctx.newPage()
await g.goto('http://localhost:5222/?preview=all', { waitUntil: 'networkidle' })
await g.waitForTimeout(500)
await g.screenshot({ path: `${process.env.OUT}/gallery.png`, fullPage: true })
await browser.close()
