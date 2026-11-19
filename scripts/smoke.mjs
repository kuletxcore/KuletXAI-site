// Browser smoke test against a running build: node scripts/smoke.mjs http://localhost:4186
// Covers the paths unit tests can't: the pages render, the finder and controls sheet open, a pad works, links resolve.
import { chromium, devices } from 'playwright'

const base = process.argv[2] ?? 'http://localhost:4186'
const fails = []
const check = (ok, what) => {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${what}`)
  if (!ok) fails.push(what)
}

const browser = await chromium.launch()
for (const [label, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['phone', devices['Pixel 7']],
]) {
  for (const mode of ['full', 'lite']) {
    const ctx = await browser.newContext(opts)
    await ctx.addInitScript(([m, pad]) => {
      localStorage.setItem('kx_perf', m)
      sessionStorage.setItem('kx_boot_seen', '1')
      if (!pad) return
      const make = () => ({ id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', index: 0, connected: true, mapping: 'standard', timestamp: 1, axes: [0, 0, 0, 0], buttons: Array.from({ length: 18 }, () => ({ pressed: false, touched: false, value: 0 })) })
      window.__pad = make()
      navigator.getGamepads = () => [{ ...window.__pad, buttons: window.__pad.buttons.map((b) => ({ ...b })) }, null, null, null]
      setTimeout(() => window.dispatchEvent(new Event('gamepadconnected')), 200)
    }, [mode, label === 'desktop'])
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    const tag = `${label}/${mode}`

    await page.goto(base + '/', { waitUntil: 'networkidle' })
    check(await page.locator('h1').first().isVisible(), `${tag}: home renders`)
    // Every in-page link points at something that exists
    const dead = await page.$$eval('a[href^="#"], a[href^="/#"]', (as) => as.map((a) => a.getAttribute('href').split('#')[1]).filter((id) => id && !document.getElementById(id)))
    check(dead.length === 0, `${tag}: in-page links resolve ${dead.join(' ')}`)
    await page.evaluate(() => window.dispatchEvent(new Event('kx:controls')))
    check(await page.locator('#kx-controls-title').isVisible(), `${tag}: controls sheet opens`)
    await page.keyboard.press('Escape')
    if (label === 'desktop') {
      await page.keyboard.press('/')
      await page.waitForTimeout(600)
      check((await page.locator('[role="dialog"]').count()) > 0, `${tag}: finder opens on /`)
      await page.keyboard.press('Escape')
      // A pad press moves focus off the body
      await page.evaluate(() => { window.__pad.buttons[13].pressed = true; window.__pad.buttons[13].value = 1 })
      await page.waitForTimeout(150)
      await page.evaluate(() => { window.__pad.buttons[13].pressed = false; window.__pad.buttons[13].value = 0 })
      await page.waitForTimeout(250)
      check(await page.evaluate(() => document.activeElement !== document.body), `${tag}: D-pad moves focus`)
    }

    for (const slug of ['acolytes', 'wristbound']) {
      await page.goto(`${base}/stories/${slug}`, { waitUntil: 'networkidle' })
      check(await page.locator('.ps5-title, h1').first().isVisible(), `${tag}: hub ${slug} renders`)
    }
    const md = await page.request.get(`${base}/stories/acolytes.md`)
    check(md.ok() && (await md.text()).startsWith('# '), `${tag}: Markdown mirror`)
    check(errors.length === 0, `${tag}: no page errors ${errors.join(' | ')}`)
    await ctx.close()
  }
}
await browser.close()
console.log(fails.length ? `\n${fails.length} failed` : '\nall passed')
process.exit(fails.length ? 1 : 0)
