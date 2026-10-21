const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')

function loadVue(file, globals = {}) {
  const code = fs.readFileSync(file, 'utf8').split('<script>')[1].split('</script>')[0]
  const context = vm.createContext(globals)
  vm.runInContext(code.replace(/^import .+\r?\n/gm, '').replace('export default', 'var component ='), context)
  return context.component
}

;(async () => {
  const credentials = { username: 'fixtureuser', initialPassword: 'FixturePassword1' }
  let sent
  const accountContext = vm.createContext({
    getToken: () => null,
    register: async (payload) => { sent = payload; return { data: credentials } }
  })
  vm.runInContext(fs.readFileSync('src/store/modules/account.js', 'utf8')
    .replace(/^import .+\r?\n/gm, '').replace('export default', 'var accountModule ='), accountContext)
  const response = await accountContext.accountModule.actions.register({}, { username: ' fixtureuser ', captchaId: '', captchaCode: '' })
  assert.equal(sent.username, 'fixtureuser')
  assert.equal('pass' in sent, false)
  assert.equal(response, credentials)

  let resolveRegistration
  let dispatches = 0
  let navigated = null
  let copied = ''
  const component = loadVue('src/views/register/index.vue', { copy: (text) => { copied = text; return true } })
  const view = { $t: (key) => key }
  Object.assign(view, component.data.call(view))
  for (const [name, method] of Object.entries(component.methods)) view[name] = method.bind(view)
  view.$refs = { registerForm: { validate: (done) => done(true) } }
  view.$router = { push: (path) => { navigated = path } }
  view.$message = { success() {}, error(message) { throw Error(message) } }
  view.$store = { dispatch: () => { dispatches++; return new Promise((resolve) => { resolveRegistration = resolve }) } }
  view.settingsLoaded = true
  view.registerForm.username = credentials.username
  assert.equal('pass' in view.registerForm, false)
  view.handleRegister()
  view.handleRegister()
  assert.equal(dispatches, 1, 'Repeated clicks must not create duplicate accounts')
  resolveRegistration(credentials)
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(navigated, null, 'Successful registration must stay on the save-credentials screen')
  assert.equal(view.credentials.initialPassword, credentials.initialPassword)
  view.goToLogin()
  assert.equal(navigated, null, 'Saving must be acknowledged before leaving for login')
  view.copyCredentials()
  assert.ok(copied.includes(credentials.username) && copied.includes(credentials.initialPassword))
  view.credentialsSaved = true
  view.goToLogin()
  assert.equal(navigated, '/login')
  assert.equal(view.credentials, null, 'Credentials must not be retained after leaving')

  const profile = loadVue('src/views/account/modify/index.vue', { SecuritySettings: {}, ModifyPass: {}, ModifyProperty: {} })
  for (const [roles, expected] of [[['user'], false], [['sysadmin', 'admin', 'user'], true], [['admin', 'user'], true]]) {
    const context = { $store: { getters: { roles } } }
    assert.equal(profile.computed.canManagePasswords.call(context), expected)
    assert.equal(profile.data.call(context).activeName, expected ? 'modify-pass' : 'modify-property')
  }
  console.log('Registration checks passed: username-only request, credential display/copy/save, duplicate prevention and role-based password UI')
})().catch((error) => { console.error(error); process.exitCode = 1 })
