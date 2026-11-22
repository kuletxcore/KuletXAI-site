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
try {
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

      const homeRes = await page.goto(base + '/', { waitUntil: 'networkidle' })
      check(!!homeRes && homeRes.status() < 400, `${tag}: home HTTP status`)
      check(await page.locator('h1').first().isVisible(), `${tag}: home renders`)
      // Every in-page link points at something that exists
      const dead = await page.$$eval('a[href^="#"], a[href^="/#"]', (as) => as.map((a) => a.getAttribute('href').split('#')[1]).filter((id) => id && !document.getElementById(id)))
      check(dead.length === 0, `${tag}: in-page links resolve ${dead.join(' ')}`)
      await page.evaluate(() => window.dispatchEvent(new Event('kx:controls')))
      check(await page.locator('#kx-controls-title').isVisible(), `${tag}: controls sheet opens`)
      await page.keyboard.press('Escape')
      check((await page.locator('#kx-controls-title').count()) === 0, `${tag}: controls sheet closes on Escape`)
      if (label === 'desktop') {
        await page.keyboard.press('/')
        await page.waitForTimeout(600)
        check((await page.locator('[role="dialog"]').count()) > 0, `${tag}: finder opens on /`)
        await page.keyboard.type('kaiju')
        await page.waitForTimeout(150)
        check((await page.locator('#kx-finder-list [role="option"]').count()) >= 1, `${tag}: finder filters results`)
        await page.keyboard.press('Escape')
        // A pad press moves focus off the body
        await page.evaluate(() => { window.__pad.buttons[13].pressed = true; window.__pad.buttons[13].value = 1 })
        await page.waitForTimeout(150)
        await page.evaluate(() => { window.__pad.buttons[13].pressed = false; window.__pad.buttons[13].value = 0 })
        await page.waitForTimeout(250)
        check(await page.evaluate(() => document.activeElement !== document.body), `${tag}: D-pad moves focus`)
      }

      for (const slug of ['acolytes', 'wristbound']) {
        const res = await page.goto(`${base}/stories/${slug}`, { waitUntil: 'networkidle' })
        check(!!res && res.status() < 400, `${tag}: hub ${slug} HTTP status`)
        check(await page.locator('.ps5-title, h1').first().isVisible(), `${tag}: hub ${slug} renders`)
      }
      const trophyRes = await page.goto(`${base}/stories/acolytes/trophies`, { waitUntil: 'networkidle' })
      check(!!trophyRes && trophyRes.status() < 400, `${tag}: trophies HTTP status`)
      check(await page.locator('h1').first().isVisible(), `${tag}: trophies renders`)

      // Share cards: one per tab, the right size, not blank, and titled for what's on screen
      if (label === 'desktop') {
        for (const [tabName, query, expect] of [
          ['story', '', 'Acolytes'],
          ['series', '?tab=trimz&series=side-b', 'Side B'],
          ['video', '?tab=youtube', ''],
        ]) {
          await page.goto(`${base}/stories/acolytes${query}`, { waitUntil: 'networkidle' })
          await page.locator('button[aria-label="Make a share card"]').first().click()
          const img = page.locator('img[alt^="Share card for"]')
          const shown = await img.waitFor({ timeout: 15000 }).then(() => true).catch(() => false)
          const info = shown
            ? await img.evaluate((el) => {
                const c = document.createElement('canvas')
                c.width = 54
                c.height = 68
                const x = c.getContext('2d')
                x.drawImage(el, 0, 0, 54, 68)
                const d = x.getImageData(0, 0, 54, 68).data
                let sum = 0
                let sq = 0
                for (let i = 0; i < d.length; i += 4) {
                  const v = (d[i] + d[i + 1] + d[i + 2]) / 3
                  sum += v
                  sq += v * v
                }
                const n = d.length / 4
                return { w: el.naturalWidth, h: el.naturalHeight, std: Math.sqrt(sq / n - (sum / n) ** 2), alt: el.alt }
              })
            : null
          // The video card must not fall back to the story's card, which is what the YouTube tab used to draw
          const rightOne = tabName === 'video' ? info?.alt !== 'Share card for Acolytes: Maid for your Protection' : info?.alt.includes(expect)
          const ok = !!info && info.w === 1080 && info.h === 1350 && info.std > 10 && rightOne
          check(ok, `${tag}: ${tabName} share card ${info ? `${info.w}x${info.h} "${info.alt}"` : 'missing'}`)
          await page.keyboard.press('Escape')
        }
      }
      const md = await page.request.get(`${base}/stories/acolytes.md`)
      check(md.ok() && (await md.text()).startsWith('# '), `${tag}: Markdown mirror`)
      if (label === 'desktop' && mode === 'full') {
        const llms = await page.request.get(`${base}/llms.txt`)
        check(llms.ok() && (await llms.text()).includes('# KuletXAI'), `${tag}: llms.txt`)
        const sitemap = await page.request.get(`${base}/sitemap.xml`)
        check(sitemap.ok() && (await sitemap.text()).includes('<urlset'), `${tag}: sitemap.xml`)
      }
      check(errors.length === 0, `${tag}: no page errors ${errors.join(' | ')}`)
      await ctx.close()
    }
  }
} finally {
  await browser.close()
}
console.log(fails.length ? `\n${fails.length} failed` : '\nall passed')
process.exit(fails.length ? 1 : 0)
