const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const loginScript = fs.readFileSync('src/views/login/index.vue', 'utf8').split('<script>')[1].split('</script>')[0]
const loginContext = vm.createContext({ LangSelect: {} })
vm.runInContext(loginScript.replace(/^import .+\r?\n/gm, '').replace('export default', 'var loginComponent ='), loginContext)
assert.equal(typeof loginContext.loginComponent.computed.logoSrc, 'function')
assert.equal(typeof loginContext.loginComponent.computed.sessionNotice, 'function')
for (const reason of ['expired', 'invalid']) {
  assert.equal(loginContext.loginComponent.computed.sessionNotice.call({ $route: { query: { session: reason } }, $t: (key) => key }), reason === 'expired' ? 'login.sessionExpired' : 'login.sessionInvalid')
}

let responseHandler
let token = 'old-session'
let resetCount = 0
let redirectCount = 0
let currentUrl = '#/dashboard/index'
const messages = []
const context = vm.createContext({
  Promise, setTimeout,
  window: { __XWARP_BASE__: '/p-test1234567890123456/', location: { replace(url) { currentUrl = url; redirectCount++ } } },
  axios: { create() { return { interceptors: { request: { use() {} }, response: { use(callback) { responseHandler = callback } } } } } },
  store: { dispatch: async () => { resetCount++; token = null }, getters: { token } },
  getToken: () => token,
  Message: (message) => messages.push(message),
  Blob: class Blob {}
})
vm.runInContext(fs.readFileSync('src/utils/session-expiry.js', 'utf8').replace(/export /g, ''), context)
vm.runInContext(fs.readFileSync('src/utils/request.js', 'utf8').replace(/^import .+\r?\n/gm, '').replace('export default service', ''), context)
;(async () => {
  const failures = [50008, 50008, 50401].map((code) => responseHandler({ data: { code, message: 'authentication failed' } }).catch((error) => {
    assert.equal(error.sessionExpired, true)
    // Vue cancels its in-flight navigation after the request rejects.
    currentUrl = '#/'
  }))
  await Promise.all(failures)
  await new Promise((resolve) => setTimeout(resolve, 10))
  assert.equal(currentUrl, '/p-test1234567890123456/#/login?session=invalid')
  assert.equal(resetCount, 1)
  assert.equal(redirectCount, 1)
  assert.equal(messages.length, 0)
  await responseHandler({ data: { code: 50403, message: 'permission denied' } }).catch(() => {})
  assert.equal(resetCount, 1)
  assert.equal(messages[0].message, 'permission denied')
  console.log('Real interceptor: redirect survives cancelled navigation, parallel failures show no duplicate dialogs, permission errors retain session')
})().catch((error) => { console.error(error); process.exitCode = 1 })
