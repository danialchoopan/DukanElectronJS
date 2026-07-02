/**
 * Theme — single source of truth for all dark/light color tokens.
 *
 * Every component imports from here instead of defining its own isDark ternaries.
 * Keep this file flat and simple — no side effects, no store imports.
 */

export interface ThemeColors {
  bg: { primary: string; secondary: string; tertiary: string; input: string; card: string; sidebar: [string, string] }
  border: { default: string; light: string }
  text: { primary: string; secondary: string; muted: string }
  accent: { primary: string; hover: string; active: string }
  toggle: { track: string }
  hover: { light: string; medium: string }
  borderSubtle: string
  shadow: string
}

export const themes: Record<'dark' | 'light', ThemeColors> = {
  dark: {
    bg: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#162033',
      input: '#0f172a',
      card: '#1e293b',
      sidebar: ['#0f1a2e', '#162033'],
    },
    border: { default: '#334155', light: '#475569' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8', muted: '#64748b' },
    accent: { primary: '#006194', hover: '#007bb9', active: 'rgba(0,97,148,0.2)' },
    toggle: { track: '#475569' },
    hover: { light: 'rgba(255,255,255,0.04)', medium: 'rgba(255,255,255,0.08)' },
    borderSubtle: 'rgba(255,255,255,0.06)',
    shadow: '0 4px 24px rgba(0,0,0,0.25)',
  },
  light: {
    bg: {
      primary: '#f8fafc',
      secondary: '#ffffff',
      tertiary: '#f1f5f9',
      input: '#f8fafc',
      card: '#ffffff',
      sidebar: ['#ffffff', '#f8fafc'],
    },
    border: { default: '#e2e8f0', light: '#d1d5db' },
    text: { primary: '#0f172a', secondary: '#64748b', muted: '#94a3b8' },
    accent: { primary: '#006194', hover: '#007bb9', active: 'rgba(0,97,148,0.08)' },
    toggle: { track: '#d1d5db' },
    hover: { light: 'rgba(0,0,0,0.03)', medium: 'rgba(0,0,0,0.06)' },
    borderSubtle: 'rgba(0,0,0,0.06)',
    shadow: '0 4px 24px rgba(0,0,0,0.04)',
  },
}
