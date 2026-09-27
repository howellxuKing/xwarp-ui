import { getTheme, applyTheme } from '@/utils/theme'

const state = {
  theme: getTheme()
}

const mutations = {
  SET_THEME: (state, theme) => {
    state.theme = theme
  }
}

const actions = {
  initTheme({ commit }) {
    commit('SET_THEME', applyTheme(state.theme))
  },
  setTheme({ commit }, theme) {
    commit('SET_THEME', applyTheme(theme))
  },
  toggleTheme({ state, commit }) {
    commit('SET_THEME', applyTheme(state.theme === 'dark' ? 'light' : 'dark'))
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
