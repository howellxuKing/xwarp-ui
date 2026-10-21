/* Isolated browser acceptance: local fixture only; never connects to a deployed panel. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const http = require('node:http')
const path = require('node:path')
const { chromium } = require('playwright')

if (process.env.GITHUB_ACTIONS !== 'true') throw Error('Browser fixture runs only in ephemeral CI')
const root = path.resolve('dist')
const password = 'DemoPassword12AB'
const registrations = []
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname
  if (pathname === '/api/auth/setting') {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ code: 20000, data: { registerEnable: 1, captchaEnable: 0, systemName: 'XWarp' } }))
    return
  }
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      const data = JSON.parse(body)
      registrations.push(data)
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'no-store')
      res.end(JSON.stringify({ code: 20000, data: { username: data.username, initialPassword: password } }))
    })
    return
  }
  if (pathname.startsWith('/api/image/')) {
    res.writeHead(404); res.end(); return
  }
  const filename = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname))
  if (!filename.startsWith(root + path.sep) || !fs.existsSync(filename) || !fs.statSync(filename).isFile()) {
    res.writeHead(404); res.end(); return
  }
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }
  res.setHeader('Content-Type', types[path.extname(filename)] || 'application/octet-stream')
  fs.createReadStream(filename).pipe(res)
})

;(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const base = 'http://127.0.0.1:' + server.address().port
  fs.mkdirSync('browser-proof', { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    for (const [name, width, height, theme] of [['desktop', 1280, 960, 'dark'], ['mobile', 390, 844, 'dark'], ['light', 1280, 960, 'light']]) {
      const context = await browser.newContext({ viewport: { width, height }, locale: 'zh-CN' })
      await context.addCookies([{ name: 'language', value: 'zh', url: base }])
      await context.addInitScript((value) => localStorage.setItem('xwarp-theme', value), theme)
      const page = await context.newPage()
      const errors = []
      page.on('pageerror', (error) => errors.push(error.message))
      await page.goto(base + '/#/register')
      await page.getByPlaceholder('账号', { exact: true }).fill('previewuser')
      assert.equal(await page.locator('input[type=password]').count(), 0)
      await page.getByRole('button', { name: '注册', exact: true }).click()
      await page.getByRole('heading', { name: '注册成功，请保存账号密码' }).waitFor()
      assert.equal(await page.getByText(password, { exact: true }).count(), 1)
      assert.equal(await page.getByText('previewuser', { exact: true }).count(), 1)
      assert.equal(await page.getByRole('button', { name: '已保存，前往登录' }).isDisabled(), true)
      assert.ok(page.url().endsWith('/#/register'))
      assert.equal('pass' in registrations[registrations.length - 1], false)
      const dimensions = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      assert.ok(dimensions.scroll <= dimensions.client, 'Registration result must not overflow horizontally')
      await page.screenshot({ path: 'browser-proof/registration-' + name + '.png', fullPage: true })
      await page.getByText('我已保存账号和密码', { exact: true }).click()
      assert.equal(await page.getByRole('checkbox', { name: '我已保存账号和密码' }).isChecked(), true)
      await page.getByRole('button', { name: '已保存，前往登录' }).click()
      await page.waitForURL('**/#/login')
      assert.equal(await page.getByText(password, { exact: true }).count(), 0)
      assert.deepEqual(errors, [])
      await context.close()
    }
    console.log('Browser acceptance passed: desktop/mobile/light, generated credential display, explicit save acknowledgement and login navigation')
  } finally {
    await browser.close()
    server.close()
  }
})().catch((error) => { console.error(error); server.close(); process.exitCode = 1 })
