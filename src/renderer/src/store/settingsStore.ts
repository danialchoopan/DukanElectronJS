/**
 * Settings Store — manages theme, language, UI preferences, and scanner toggle.
 *
 * Persists all settings to the database via IPC (settings:set/get).
 * Restores settings from DB on app startup.
 *
 * Settings managed:
 *   - theme: 'dark' | 'light'
 *   - language: 'fa' | 'en'
 *   - navTheme: sidebar appearance
 *   - fontSize / fontSizeCustom: text size control
 *   - highContrast: accessibility mode
 *   - showCameraScanner: enables barcode/QR camera in POS and AddProduct
 */

import { create } from 'zustand'

export type Theme = 'dark' | 'light'
export type NavTheme = 'blue' | 'green' | 'purple' | 'orange' | 'teal' | 'slate'

const navColors: Record<NavTheme, { dark: string; light: string }> = {
  blue: { dark: '#1e293b', light: '#2563eb' },
  green: { dark: '#0f2922', light: '#16a34a' },
  purple: { dark: '#1e1533', light: '#9333ea' },
  orange: { dark: '#1c1308', light: '#ea580c' },
  teal: { dark: '#0f292a', light: '#0d9488' },
  slate: { dark: '#1e293b', light: '#475569' },
}

export function getNavColors(navTheme: NavTheme, isDark: boolean) {
  const colors = navColors[navTheme] || navColors.blue
  return isDark ? colors.dark : colors.light
}

interface SettingsState {
  theme: Theme
  language: 'fa' | 'en'
  navTheme: NavTheme
  fontSize: string
  fontSizeCustom: number
  highContrast: boolean
  showCameraScanner: boolean
  showCalculatorNav: boolean
  setTheme: (theme: Theme) => void
  setLanguage: (lang: 'fa' | 'en') => void
  setNavTheme: (navTheme: NavTheme) => void
  setFontSize: (size: string) => void
  setFontSizeCustom: (size: number) => void
  setHighContrast: (hc: boolean) => void
  setShowCameraScanner: (v: boolean) => void
  setShowCalculatorNav: (v: boolean) => void
  init: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'dark',
  language: 'fa',
  navTheme: 'blue',
  fontSize: 'md',
  fontSizeCustom: 1,
  highContrast: false,
  showCameraScanner: true,
  showCalculatorNav: false,

  setTheme: (theme) => {
    set({ theme })
    applyTheme(theme)
    window.api.settings.set('theme', theme)
  },

  setLanguage: (language) => {
    set({ language })
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr'
    document.documentElement.lang = language
    window.api.settings.set('language', language)
  },

  setNavTheme: (navTheme) => {
    set({ navTheme })
    window.api.settings.set('navTheme', navTheme)
  },

  setFontSize: (fontSize) => {
    const scaleMap: Record<string, number> = { sm: 0.85, md: 1, 'md-lg': 1.08, lg: 1.15, xl: 1.3 }
    const scale = scaleMap[fontSize] || 1
    set({ fontSize, fontSizeCustom: scale })
    document.documentElement.style.fontSize = `${scale * 16}px`
    window.api.settings.set('fontSize', fontSize)
    window.api.settings.set('fontSizeCustom', String(scale))
  },

  setFontSizeCustom: (scale) => {
    set({ fontSize: 'custom', fontSizeCustom: scale })
    document.documentElement.style.fontSize = `${scale * 16}px`
    window.api.settings.set('fontSize', 'custom')
    window.api.settings.set('fontSizeCustom', String(scale))
  },

  setHighContrast: (highContrast) => {
    set({ highContrast })
    if (highContrast) document.documentElement.classList.add('high-contrast')
    else document.documentElement.classList.remove('high-contrast')
    window.api.settings.set('highContrast', String(highContrast))
  },

  setShowCameraScanner: (showCameraScanner) => {
    set({ showCameraScanner })
    window.api.settings.set('showCameraScanner', String(showCameraScanner))
  },

  setShowCalculatorNav: (showCalculatorNav) => {
    set({ showCalculatorNav })
    window.api.settings.set('showCalculatorNav', String(showCalculatorNav))
  },

  init: async () => {
    const result = await window.api.settings.getAll()
    if (result.success && result.data) {
      const theme = (result.data.theme as Theme) || 'dark'
      const language = (result.data.language as 'fa' | 'en') || 'fa'
      const navTheme = (result.data.navTheme as NavTheme) || 'blue'
      const fontSize = result.data.fontSize || 'md'
      const fontSizeCustom = parseFloat(result.data.fontSizeCustom) || 1
      const highContrast = result.data.highContrast === 'true'
      const showCameraScanner = result.data.showCameraScanner !== 'false'
      const showCalculatorNav = result.data.showCalculatorNav === 'true'
      set({ theme, language, navTheme, fontSize, fontSizeCustom, highContrast, showCameraScanner, showCalculatorNav })
      applyTheme(theme)
      document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr'
      document.documentElement.lang = language
      document.documentElement.style.fontSize = `${fontSizeCustom * 16}px`
      if (highContrast) document.documentElement.classList.add('high-contrast')
    }
  },
}))

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'light') {
    root.classList.remove('dark')
    root.classList.add('light')
  } else {
    root.classList.remove('light')
    root.classList.add('dark')
  }
}
