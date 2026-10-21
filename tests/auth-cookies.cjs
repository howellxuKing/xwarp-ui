const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

const panel = '/p-regression1234567890/'
const jar = new Map()
let pathname = panel
const writes = []
global.document = {
  get cookie() {
    return [...jar.values()]
      .filter((c) => pathname.startsWith(c.path))
      .sort((a, b) => b.path.length - a.path.length)
      .map((c) => c.pair)
      .join('; ')
  },
  set cookie(value) {
    writes.push(value)
    const [pair, ...parts] = value.split('; ')
    const attrs = Object.fromEntries(parts.map((part) => {
      const index = part.indexOf('=')
      return index < 0 ? [part.toLowerCase(), true] : [part.slice(0, index).toLowerCase(), part.slice(index + 1)]
    }))
    const name = pair.slice(0, pair.indexOf('='))
    const path = attrs.path || '/'
    const id = [name, path, attrs.domain || 'host-only'].join('|')
    if (attrs.expires && new Date(attrs.expires) < new Date()) jar.delete(id)
    else jar.set(id, { pair, path })
  }
}
const Cookies = require('js-cookie')
// Reproduce the old guard's failure: path-scoped removal cannot delete a root cookie.
Cookies.set('Authorization', 'Bearer expired-root-token', { path: '/' })
Cookies.remove('Authorization', { path: panel })
assert.equal(Cookies.get('Authorization'), 'Bearer expired-root-token')

const source = fs.readFileSync('src/utils/auth.js', 'utf8')
  .replace(/^import Cookies from 'js-cookie'\s*$/m, '')
  .replace(/export function /g, 'function ')
const context = { Cookies, window: { __XWARP_BASE__: panel }, location: { protocol: 'https:' }, module: { exports: {} } }
vm.runInNewContext(source + '\nmodule.exports = { getToken, setToken, removeToken }', context)
const auth = context.module.exports
assert.equal(auth.getToken(), undefined, 'Legacy root JWT must not trigger the logged-in guard')

// Domain cookies from an older panel can outlive host-only removal too.
Cookies.set('Authorization', 'Bearer expired-domain-token', { path: '/', domain: '.example.test' })
auth.setToken('Bearer fresh-token')
assert.equal(auth.getToken(), 'Bearer fresh-token')
assert(writes.some((value) => value.startsWith('XWarpAuthorizationV2=') && value.includes('secure') && value.includes('sameSite=Strict')))
pathname = '/another-panel/'
assert.equal(auth.getToken(), undefined, 'Panel JWT must not be exposed outside its path')
pathname = panel
auth.removeToken()
assert.equal(auth.getToken(), undefined, 'Reset must reach the login route even if legacy domain cookies remain')
assert.equal(Boolean(auth.getToken()), false)
auth.setToken('Bearer second-login')
assert.equal(auth.getToken(), 'Bearer second-login')
auth.removeToken()
assert.equal(auth.getToken(), undefined)
console.log('Auth cookie regression passed: legacy redirect loop, domain shadowing, path isolation, login and reset')
