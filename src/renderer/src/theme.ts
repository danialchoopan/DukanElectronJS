/**
 * Theme — single source of truth for all dark/light color tokens.
 *
 * Every component imports from here instead of defining its own isDark ternaries.
 * Keep this file flat and simple — no side effects, no store imports.
 */

/**
 * Complete theme color tokens. Components import from here instead of
 * using isDark ternaries inline. Keep flat — no side effects.
 */
export interface ThemeColors {
  /** Background layers: primary (page), secondary (cards), tertiary (subtle), input, card, sidebar (gradient pair) */
  bg: { primary: string; secondary: string; tertiary: string; input: string; card: string; sidebar: [string, string] }
  /** Border colors: default (standard), light (subtle dividers) */
  border: { default: string; light: string }
  /** Text hierarchy: primary (headings), secondary (body), muted (labels) */
  text: { primary: string; secondary: string; muted: string }
  /** Accent/brand: primary (base), hover (darker), active (pressed state overlay) */
  accent: { primary: string; hover: string; active: string }
  /** Toggle/switch track color */
  toggle: { track: string }
  /** Row hover states: light (subtle), medium (more visible) */
  hover: { light: string; medium: string }
  /** Very subtle border for cards/sections (rgba with low opacity) */
  borderSubtle: string
  /** Box shadow for elevated elements */
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
