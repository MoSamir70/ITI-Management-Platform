---
name: ITI Enterprise Portal
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#58413f'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#8c716e'
  outline-variant: '#dfbfbc'
  surface-tint: '#ab3330'
  primary: '#8f1d1e'
  on-primary: '#ffffff'
  primary-container: '#b03633'
  on-primary-container: '#ffd4d0'
  inverse-primary: '#ffb3ad'
  secondary: '#496271'
  on-secondary: '#ffffff'
  secondary-container: '#c9e3f5'
  on-secondary-container: '#4d6675'
  tertiary: '#901b20'
  on-tertiary: '#ffffff'
  tertiary-container: '#b13435'
  on-tertiary-container: '#ffd3d0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad6'
  primary-fixed-dim: '#ffb3ad'
  on-primary-fixed: '#410003'
  on-primary-fixed-variant: '#8a1a1b'
  secondary-fixed: '#cce6f8'
  secondary-fixed-dim: '#b0cadc'
  on-secondary-fixed: '#021e2b'
  on-secondary-fixed-variant: '#314a58'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3ae'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#8b171d'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
  iti-red: '#B03633'
  deep-navy: '#203947'
  dark-crimson: '#901B20'
  surface-gray: '#EDEDED'
  pure-white: '#FFFFFF'
typography:
  display-lg:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 16px
  margin-desktop: 32px
  gutter: 24px
  sidebar-width: 280px
---

## Brand & Style

The design system is engineered for the **ITI Branch Portal**, an enterprise-grade environment serving an esteemed educational institution. The aesthetic balances the heritage of a government-backed academy with the forward-looking precision of a modern tech hub.

The design style is **Corporate Modern with Glassmorphic Accents**. It prioritizes clarity and institutional authority while utilizing contemporary UI techniques like frosted glass navigation and soft, elevated surfaces to reduce cognitive load. The goal is to evoke a sense of reliability, intelligence, and academic excellence, ensuring that administrators and students feel they are navigating a world-class digital campus.

Key stylistic pillars include:
- **Professionalism:** High-quality typography and structured layouts.
- **Translucency:** Subtle backdrop blurs for top-level navigation to provide context and depth.
- **Soft Geometry:** Rounded containers that soften the industrial nature of enterprise data.

## Colors

The palette is anchored by **ITI Red**, a high-energy, authoritative primary color used for critical actions and brand markers. It is tempered by **Deep Navy** and **Dark Crimson**, which provide the "Executive" weight required for an enterprise portal.

**Functional Color Usage:**
- **Primary (ITI Red):** Action buttons, progress bar fills, and active states.
- **Secondary (Deep Navy):** Sidebar backgrounds, primary headings, and data visualization anchors.
- **Surface (Neutral/White):** A crisp `#FFFFFF` base is supported by `#EDEDED` for subtle containment and background zoning.
- **Accent (Dark Crimson):** Used sparingly for secondary alerts or hover states on primary elements to provide depth.

## Typography

This design system utilizes a dual-font strategy to balance character with utility. 

**Montserrat** is the display face, used for headlines and dashboard titles. Its geometric construction provides a modern, confident tone. **Inter** is the workhorse for all body text, data tables, and labels. Its high x-height and neutral character ensure maximum legibility for dense enterprise information.

- **Headlines:** Always use Montserrat. Tighten letter spacing slightly for larger sizes to maintain a premium feel.
- **Data & UI:** Use Inter. For labels and captions, use Medium or Semi-Bold weights to create clear hierarchy against body text.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid grid**. The main content area utilizes a 12-column fluid grid, while the Sidebar remains a fixed width of 280px to provide a consistent navigation anchor.

- **Vertical Rhythm:** Built on an 8px base unit. All component heights and margins should be multiples of 8.
- **Responsive Behavior:** 
  - **Desktop (1440px+):** 32px outer margins, 24px gutters.
  - **Tablet (768px - 1439px):** 24px outer margins, 16px gutters. Sidebar may collapse into an icon-only rail.
  - **Mobile (< 768px):** 16px outer margins. The layout reflows to a single column, and the sidebar becomes a hidden drawer.

## Elevation & Depth

The design system employs **Tonal Layering** and **Subtle Glassmorphism** to create hierarchy:

1.  **Level 0 (Base):** The portal background (`#F8F9FA` or similar off-white).
2.  **Level 1 (Cards):** Pure white containers with a very soft, diffused shadow (`0px 4px 20px rgba(0, 0, 0, 0.05)`).
3.  **Level 2 (Navigation):** The top navbar uses a Glassmorphic effect: `background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(0, 0, 0, 0.05)`.
4.  **Level 3 (Modals/Popovers):** Higher elevation with more pronounced shadows and a dark overlay (scrim) for focus.

Avoid heavy borders; use subtle shifts in background color or extremely light outlines (`#EDEDED`) to define boundaries.

## Shapes

The shape language is defined by a **Rounded (0.5rem)** baseline. This choice softens the "rigid" feel of traditional enterprise software without appearing overly consumer-focused.

- **Cards & Dashboard Modules:** Use `rounded-lg` (1rem) for a friendly, modern container feel.
- **Buttons & Inputs:** Follow the `0.5rem` standard for a precise, professional look.
- **Progress Bars:** Fully rounded (pill-shaped) to represent fluidity and movement.

## Components

### Buttons
- **Primary:** Solid ITI Red (`#B03633`) with white text. 
- **Secondary:** Deep Navy (`#203947`) or transparent with a navy outline.
- **Ghost:** No background, subtle grey hover state for low-priority actions.

### Sidebar Navigation
The sidebar should use the Deep Navy color palette. Active states should be indicated with a thick ITI Red left-border and a subtle background highlight. Icons should be "Duotone" or "Thin" style for an elegant, modern feel.

### Dashboard Cards
Cards are the primary container. They should feature:
- White backgrounds with 16px padding.
- `rounded-lg` corners.
- Subtle shadows (Elevation Level 1).
- Integrated progress bars using ITI Red for completion and Soft Gray for the track.

### Tables
Enterprise tables must be clean:
- No vertical borders.
- Light horizontal separators (`#EDEDED`).
- Header row in a subtle gray background (`#F8F9FA`) with uppercase labels using `label-sm`.

### Inputs & Form Fields
Fields use a 1px border (`#D1D5DB`). On focus, the border transitions to ITI Red with a subtle 2px glow (soft shadow) to ensure accessibility and clarity.