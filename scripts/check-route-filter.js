const assert = require('assert')
const { filterAsyncRoutes } = require('../src/store/modules/route-filter')

const routes = [
  {
    path: '/account-manage',
    meta: { roles: ['sysadmin', 'admin'] },
    children: [{ path: 'account-list', meta: { roles: ['sysadmin', 'admin'] } }]
  },
  {
    path: '/system',
    meta: { roles: ['sysadmin'] },
    children: [{ path: 'base-config', meta: { roles: ['sysadmin'] } }]
  }
]

const sysadmin = filterAsyncRoutes(routes, ['sysadmin', 'admin', 'user'])
assert.deepStrictEqual(sysadmin.map((route) => route.path), ['/account-manage', '/system'])

const admin = filterAsyncRoutes(routes, ['admin', 'user'])
assert.deepStrictEqual(admin.map((route) => route.path), ['/account-manage'])

const user = filterAsyncRoutes(routes, ['user'])
assert.deepStrictEqual(user, [])

console.log('route filter checks passed')
