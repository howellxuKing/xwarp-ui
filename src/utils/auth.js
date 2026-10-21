import Cookies from 'js-cookie'

// Legacy root cookies can survive path-scoped logout and cause a redirect loop.
// A separate cookie also keeps older panels on this domain from supplying a JWT.
const TokenKey = 'XWarpAuthorizationV2'
const cookiePath = () => window.__XWARP_BASE__ || '/'

function removeLegacyToken() {
  Cookies.remove('Authorization', { path: cookiePath() })
  Cookies.remove('Authorization', { path: '/' })
}

/**
 * 获取token
 * @returns {*}
 */
export function getToken() {
  return Cookies.get(TokenKey)
}

/**
 * 设置token
 * @param token
 * @returns {*}
 */
export function setToken(token) {
  removeLegacyToken()
  return Cookies.set(TokenKey, token, { secure: location.protocol === 'https:', sameSite: 'Strict', path: cookiePath() })
}

/**
 * 移除token
 * @returns {*}
 */
export function removeToken() {
  removeLegacyToken()
  return Cookies.remove(TokenKey, { path: cookiePath() })
}
