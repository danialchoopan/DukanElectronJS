/**
 * useTheme — hook that returns resolved theme colors + nav accent.
 *
 * Usage:
 *   const { isDark, colors, primary } = useTheme()
 *   style={{ backgroundColor: colors.bg.card, color: colors.text.primary }}
 */

import { useSettingsStore, getNavColors, type NavTheme } from '../store/settingsStore'
import { themes, type ThemeColors } from '../theme'

export function useTheme(): { isDark: boolean; colors: ThemeColors; primary: string; navTheme: NavTheme } {
  const { theme, navTheme } = useSettingsStore()
  const isDark = theme === 'dark'
  const colors = themes[theme]
  const primary = getNavColors(navTheme, isDark)
  return { isDark, colors, primary, navTheme }
}
