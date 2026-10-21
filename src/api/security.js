import request from '@/utils/request'

export const securityStatus = () => request({ url: '/security/status', method: 'get' })
export const securityAction = (action, data) => request({ url: '/security/' + action, method: 'post', data })

export const serverHealth = () => request({ url: '/security/diagnostics', method: 'get' })
