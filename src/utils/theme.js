/**
 * XWarp 主题工具
 * 白天（light）/ 黑夜（dark）两种模式，默认黑夜（X 风格）
 * 选择保存在 localStorage，key: xwarp-theme
 */
const THEME_KEY = 'xwarp-theme'
const THEMES = ['dark', 'light']
const DEFAULT_THEME = 'dark'

export function getTheme() {
  let theme = null
  try {
    theme = localStorage.getItem(THEME_KEY)
  } catch (e) {
    theme = null
  }
  return THEMES.indexOf(theme) > -1 ? theme : DEFAULT_THEME
}

export function applyTheme(theme) {
  const t = THEMES.indexOf(theme) > -1 ? theme : DEFAULT_THEME
  const body = document.body
  if (body) {
    body.classList.remove('theme-dark', 'theme-light')
    body.classList.add('theme-' + t)
  }
  document.documentElement.setAttribute('data-theme', t)
  try {
    localStorage.setItem(THEME_KEY, t)
  } catch (e) {
    /* ignore */
  }
  return t
}

export function toggleTheme(current) {
  return applyTheme(current === 'dark' ? 'light' : 'dark')
}

export default { getTheme, applyTheme, toggleTheme }
