import { asyncRoutes, constantRoutes } from '@/router'
import { filterAsyncRoutes as filterByRole } from './route-filter'

export function filterAsyncRoutes(routes, roles) {
  return filterByRole(routes, roles)
}

const state = {
  routes: [],
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  generateRoutes({ commit }, roles) {
    return new Promise((resolve) => {
      // sysadmin already carries the child role name admin. Do not treat that
      // name as permission to see every route.
      const accessedRoutes = filterAsyncRoutes(asyncRoutes, roles)
      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
