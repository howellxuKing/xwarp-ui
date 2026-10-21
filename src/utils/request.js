import axios from 'axios'
import { Message } from 'element-ui'
import store from '@/store'
import { getToken } from '@/utils/auth'
import { sessionReason, createSessionExpiryHandler } from './session-expiry'

const expireSession = createSessionExpiryHandler(
  () => store.dispatch('account/resetToken'),
  // Let an in-flight route guard finish cancelling its navigation first.
  (reason) => setTimeout(() => {
    window.location.replace((window.__XWARP_BASE__ || '/') + '#/login?session=' + reason)
  }, 0)
)
let expiringSession = false

const service = axios.create({
  baseURL: (window.__XWARP_BASE__ || '/') + 'api',
  timeout: 5000
})

service.interceptors.request.use(
  (config) => {
    if (store.getters.token) {
      config.headers['Authorization'] = getToken()
    }
    return config
  },
  (error) => {
    // console.log(error)
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code === 20000) {
      return res
    } else if (res instanceof Blob) {
      return response
    } else {
      const reason = sessionReason(res.code)
      if (reason && (getToken() || expiringSession)) {
        expiringSession = true
        const error = new Error(res.message || 'Session expired')
        error.sessionExpired = true
        expireSession(reason)
        return Promise.reject(error)
      }
      Message({
        message: res.message || 'Error',
        type: 'error',
        duration: 5 * 1000
      })

      return Promise.reject(new Error(res.message || 'Error'))
    }
  },
  (error) => {
    // console.log('err' + error)
    Message({
      message: error.message,
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
