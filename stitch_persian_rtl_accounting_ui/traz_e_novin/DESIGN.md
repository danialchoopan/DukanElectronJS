---
name: Traz-e-Novin
colors:
  surface: '#f8f9ff'
  surface-dim: '#ccdbf3'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d5e3fc'
  on-surface: '#0d1c2e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#233144'
  inverse-on-surface: '#eaf1ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#894d00'
  on-tertiary: '#ffffff'
  tertiary-container: '#ac6200'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#ffdcc0'
  tertiary-fixed-dim: '#ffb875'
  on-tertiary-fixed: '#2d1600'
  on-tertiary-fixed-variant: '#6b3b00'
  background: '#f8f9ff'
  on-background: '#0d1c2e'
  surface-variant: '#d5e3fc'
typography:
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 48px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 36px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  numeric-data:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is built on a foundation of precision, transparency, and fiscal responsibility. Targeting finance professionals and business owners, the UI prioritizes clarity over ornamentation to reduce cognitive load during complex data entry. 

The aesthetic follows a **Corporate / Modern** approach with a distinct **RTL-first** mindset. Every element is engineered to flow naturally from right to left, ensuring that the visual hierarchy aligns with Persian reading patterns. The interface feels stable and architectural, utilizing structured grids and high-quality typography to evoke a sense of institutional security.

## Colors
The palette is anchored by "Trust Blue" (Primary) and "Balance Teal" (Secondary). 

- **Primary:** Used for main actions, active states, and focus indicators.
- **Secondary:** Applied to secondary data visualizations and specialized account types.
- **Functional Colors:** Success (Green) and Error (Red) are strictly reserved for financial status indicators (profits vs. losses) and system feedback.
- **Surface Strategy:** In Light Mode, surfaces use subtle cool-gray tints to separate content blocks. In Dark Mode, deep navy-charcoal shades replace pure blacks to maintain depth and reduce eye strain during late-night audits.

## Typography
This design system utilizes a combination of **IBM Plex Sans** (for its systematic, technical feel) and **Noto Sans** (for its exceptional RTL/Farsi legibility). 

**Implementation Notes:**
- **Farsi Support:** While the system variables list Latin fonts for structural reference, the implementation must prioritize **Vazirmatn** or **Dana** for all Persian strings. 
- **Numbers:** Financial figures should use "Western Arabic" numerals (1, 2, 3) in technical dashboards for global compatibility, but "Eastern Arabic" numerals (۱, ۲, ۳) in localized reports and customer-facing invoices.
- **Alignment:** All text is `right-aligned` by default. Letter spacing is set to `0` for Farsi text to maintain script connectivity.

## Layout & Spacing
The layout follows a **Fluid Grid** model based on an 8px spacing system to ensure mathematical consistency.

- **Mobile:** 4-column grid with 16px margins.
- **Desktop:** 12-column grid with 32px margins and 24px gutters.
- **RTL Logic:** Spacing logic is mirrored. `padding-right` serves as the start-padding, and `margin-left` serves as the end-margin. All navigation drawers and sidebars anchor to the right edge of the viewport.

## Elevation & Depth
Depth is communicated through **Tonal Layers** rather than heavy shadows to keep the UI clean and professional.

- **Level 0 (Background):** The base canvas.
- **Level 1 (Cards):** Subtle 1px borders in a slightly darker/lighter neutral than the background.
- **Level 2 (Popovers/Modals):** Soft, diffused shadows (Blur 12px, Y 4px, 5% opacity) to lift the element without creating visual noise.
- **Active States:** Inset shadows or subtle color shifts identify clicked or active inputs.

## Shapes
The design system uses a **Soft (0.25rem)** roundedness approach. This maintains a professional, "stable" look that feels more modern than sharp corners but more serious than highly rounded "bubbly" styles. 

- **Inputs & Buttons:** 4px (0.25rem) radius.
- **Account Cards:** 8px (0.5rem) radius.
- **Container Groups:** 12px (0.75rem) radius.

## Components

### RTL-Optimized Input Fields
- **Labeling:** Floating labels or top-right aligned labels.
- **Affixes:** Currency symbols (﷼) and icons are placed on the left side of the input (the "end" in RTL).
- **Validation:** Errors appear as a 2px bottom-border highlight in `#EF4444` with a right-aligned helper text.

### PIN Code Entries
- Four or six discrete boxes with 8px spacing.
- Cursor focus moves from **right to left** as the user types.
- Numbers are centered within each box using a semi-bold weight.

### Account Selection Cards
- **Structure:** Right-side icon or bank logo, followed by the account name/number, and left-aligned balance.
- **Interactive State:** A 2px primary color border indicates selection.
- **Balance Display:** Positive balances in Primary Blue; Negative/Overdraft in Error Red.

### Primary Buttons
- **Style:** Solid fill using the Primary color.
- **Typography:** Bold weight, centered.
- **Icons:** If an icon is used (e.g., an arrow for "Continue"), it must be mirrored (pointing left ←) to indicate forward progression in an RTL context.

### Data Tables
- **Alignment:** Text columns are right-aligned; numeric columns (amounts) are left-aligned to allow for decimal/unit alignment.
- **Striping:** Subtle row striping using `Level 0` and `Level 1` neutral tints.