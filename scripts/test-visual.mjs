/**
 * Layout regression test.
 *
 * Two classes of bug have shipped from this project already, and neither is
 * catchable by typechecking or by looking at a screenshot on a laptop:
 *
 *   1. Copy overrunning the fixed 1080×1350 canvas. The templates have no
 *      scroll and no reflow, so an over-long string is a broken artifact.
 *   2. The on-screen keyboard covering the field being typed into. This one
 *      shipped twice, because it only reproduces when the page lays out tall
 *      first and the *visual* viewport shrinks afterwards — exactly what a
 *      phone does, and exactly what resizing a browser window does not.
 *
 *   npm run test:visual
 *
 * Boots the dev server itself (the template gallery is DEV-only), so it needs
 * no build and no running server.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

const PORT = 5199
const BASE = `http://localhost:${PORT}`
const STYLES = [
  'CASE_FILE',
  'AWARDS_NIGHT',
  'SIBLING_WRAPPED',
  'SCRAPBOOK',
  'STOCK_REPORT',
  'CHARACTER_STATS',
  'stress',
]

/** This sandbox ships a preinstalled browser; elsewhere Playwright finds its own. */
const EXECUTABLE = existsSync('/opt/pw-browsers/chromium')
  ? { executablePath: '/opt/pw-browsers/chromium' }
  : {}

const failures = []
const note = (ok, line) => {
  if (!ok) failures.push(line)
  console.log(`  ${ok ? '✓' : '✗'} ${line}`)
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    try {
      const res = await fetch(BASE)
      if (res.ok) return
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`dev server never came up on ${BASE}`)
}

/*
 * Decorations are deliberately bled past the edge and clipped by the frame, so
 * only real content escaping the canvas counts as a defect.
 */
function measureCard(el) {
  const r = el.getBoundingClientRect()
  let worst = 0
  let who = ''
  for (const c of el.querySelectorAll('*')) {
    if (c.closest('[aria-hidden="true"]')) continue
    const cr = c.getBoundingClientRect()
    if (!cr.width && !cr.height) continue
    const over = Math.max(cr.bottom - r.bottom, cr.right - r.right, r.top - cr.top, r.left - cr.left)
    if (over > worst) {
      worst = over
      who = (c.textContent || c.tagName).trim().slice(0, 40)
    }
  }
  const footer = el.querySelector('footer')
  const last = footer?.previousElementSibling?.lastElementChild
  const slack =
    footer && last ? footer.getBoundingClientRect().top - last.getBoundingClientRect().bottom : 0
  return { overflow: Math.round(worst), who, slack: Math.round(slack) }
}

async function checkTemplates(ctx) {
  console.log('\nTemplates at export size (1080×1350)\n')
  for (const style of STYLES) {
    const page = await ctx.newPage()
    await page.goto(`${BASE}/?preview=${style}&width=1080`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(300)
    const m = await page.locator('article').first().evaluate(measureCard)
    note(
      m.overflow <= 1,
      `${style.padEnd(16)} content stays inside the canvas` +
        (m.overflow > 1 ? ` — ${m.overflow}px escaped: "${m.who}"` : ''),
    )
    note(
      m.slack < 60,
      `${style.padEnd(16)} fills the frame` +
        (m.slack >= 60 ? ` — ${m.slack}px of dead space above the footer` : ''),
    )
    await page.close()
  }
}

async function checkKeyboard(ctx) {
  console.log('\nQuestion flow with the keyboard open\n')
  // Heights a phone actually leaves above its keyboard.
  for (const visible of [450, 405, 360]) {
    const page = await ctx.newPage()
    /*
     * The layout viewport stays at full phone height — so `max-height` media
     * queries see 844px, exactly as on a real device — while the visual
     * viewport reports the space above the keyboard.
     */
    await page.addInitScript(() => {
      const vv = window.visualViewport
      let fake = null
      Object.defineProperty(vv, 'height', { get: () => fake ?? window.innerHeight })
      window.__keyboard = (h) => {
        fake = h
        vv.dispatchEvent(new Event('resize'))
      }
    })
    await page.goto(BASE, { waitUntil: 'networkidle' })
    await page.getByRole('button', { name: /review|start|roast/i }).first().click()
    await page.waitForSelector('#sibling-name')

    for (const step of ['name', 'question']) {
      if (step === 'question') {
        await page.fill('#sibling-name', 'Ananya')
        await page.getByRole('button', { name: /next/i }).click()
        await page.waitForSelector('textarea')
      }
      const sel = step === 'name' ? '#sibling-name' : 'textarea'
      await page.focus(sel)
      await page.evaluate((h) => window.__keyboard(h), visible)
      await page.waitForTimeout(650)

      const hidden = await page.evaluate((s) => {
        const f = document.querySelector(s).getBoundingClientRect()
        const footTop = document.querySelector('footer').getBoundingClientRect().top
        const headBottom = document.querySelector('header').getBoundingClientRect().bottom
        return Math.round(Math.max(0, f.bottom - footTop) + Math.max(0, headBottom - f.top))
      }, sel)

      note(
        hidden === 0,
        `${String(visible).padStart(3)}px visible · ${step.padEnd(8)} field stays clear` +
          (hidden ? ` — ${hidden}px behind the chrome` : ''),
      )
    }
    await page.close()
  }
}

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  detached: false,
})

try {
  await waitForServer()
  const browser = await chromium.launch(EXECUTABLE)
  const ctx = await browser.newContext({ deviceScaleFactor: 1, viewport: { width: 390, height: 844 } })
  await checkTemplates(ctx)
  await checkKeyboard(ctx)
  await browser.close()
} finally {
  server.kill()
}

console.log('')
if (failures.length) {
  console.error(`FAILED — ${failures.length} layout check(s) did not hold.\n`)
  process.exit(1)
}
console.log('Every template fits its canvas, and no field hides behind the keyboard.\n')
