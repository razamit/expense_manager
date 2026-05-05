---
name: Finance Professional
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  h1:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h2:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  h3:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
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
  data-tabular:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin: 40px
---

## Brand & Style

The design system is engineered for rigor, precision, and institutional trust. It caters to finance professionals who require high information density without cognitive overload. The aesthetic is rooted in **Corporate Modernism**, prioritizing functional utility over decorative flair. 

Every visual choice reinforces the product's role as a reliable analytical tool. By avoiding "lifestyle" imagery and gamified interactions, the interface establishes a serious environment where data is the primary protagonist. The style is characterized by surgical precision, clear borders, and a neutral atmosphere that allows semantic status colors to communicate urgency and value effectively.

## Colors

The palette is anchored by a high-contrast white and off-white foundation to ensure maximum readability for long-form data analysis. The primary color—a deep, credible navy (#0F172A)—is used sparingly for structural elements and primary actions to maintain its weight and authority.

Status colors are strictly semantic. **Positive Green** is reserved for income and growth; **Negative Red** for spending and destructive actions; **Amber** for uncategorized data or warnings. Secondary information utilizes a range of slate and blue-grays to create a clear hierarchy without introducing unnecessary hue shifts that could distract from critical financial indicators.

## Typography

The design system utilizes **Inter** for its exceptional legibility and comprehensive support for tabular OpenType features. Financial data must always utilize `tabular-nums` to ensure that columns of numbers align perfectly, allowing for effortless vertical scanning and comparison.

Hierarchy is established through weight and scale rather than color. Headers are substantial and grounded, while body text remains utilitarian. Special attention is given to mixed-language environments; the typography handles Hebrew and English bi-directionally with consistent x-heights and line-spacing to prevent visual jarring in transaction descriptions.

## Layout & Spacing

The layout employs a **disciplined 12-column grid** designed for desktop density. A strict 4px/8px incremental system governs all padding and margins, ensuring that even data-dense screens feel organized and intentional rather than cramped.

Information density is high but balanced by consistent gutters. Wide margins are used at the page level to focus the eye on the central data canvas. Vertical rhythm is critical; spacing between table rows and list items is optimized to maximize "above-the-fold" content while maintaining touch/click targets for professional workflows.

## Elevation & Depth

This design system avoids heavy shadows and floating elements to maintain a grounded, institutional feel. Depth is communicated primarily through **Tonal Layering** and **Low-Contrast Outlines**.

1.  **Level 0 (Canvas):** The base background (#FFFFFF).
2.  **Level 1 (Surface):** Off-white containers (#F8FAFC) used for sidebars or secondary content areas.
3.  **Level 2 (Plates):** Cards and main content modules, defined by a 1px border (#E2E8F0) rather than a shadow.

When depth is absolutely necessary (e.g., for dropdown menus), a single, crisp, low-opacity shadow is used: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`. This ensures that the interface feels architectural and structural.

## Shapes

The shape language is conservative and precise. A "Soft" roundedness (4px) is applied to most components, providing just enough approachability to feel modern without losing the "sharp" professional edge required for a fintech application.

Interactive elements like buttons and inputs share this consistent 4px radius. Large containers like cards may use an 8px radius (`rounded-lg`) for structural distinction, but never exceed this. Pill-shaped elements are strictly forbidden unless used for status tags to differentiate them from functional buttons.

## Components

### Tables
The core component of this design system. Tables must be dense, using a 40px row height for standard data and 32px for compact views. Headers are sticky, styled with `label-sm` typography and a subtle bottom border. Highlighting occurs on row-hover using a faint slate tint.

### Cards
Cards are flat containers with 1px slate borders. They lack shadows by default. Content inside cards is organized into clear sections using 1px horizontal dividers.

### Buttons
Buttons are solid and functional. Primary buttons use the deep navy background with white text. Secondary buttons are outlined. There are no gradients; clarity and state (Hover, Active, Disabled) are communicated via subtle shifts in opacity or shade.

### Inputs & Selects
Form fields use a standard 1px border. The focus state is a high-contrast 2px border in the primary navy color. For RTL support, icons and labels must flip orientation, and text alignment for Hebrew entries must be right-aligned automatically.

### Charts
Charts are analytical. Line strokes are 2px. Grids are light gray and minimal. Legends are placed at the top-right or bottom for clear reference. Use the semantic status palette for data series (e.g., Green for revenue lines).