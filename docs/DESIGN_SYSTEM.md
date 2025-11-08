# Kontecst Design System

> Clean, modern, knowledge-first: neutral canvases, crisp typography, clear content hierarchy, and calm blue accents that signal authority and trust.

## Visual Direction

The Kontecst UI makes complex context authoring feel **simple and safe** through:
- Clean, professional aesthetics
- Knowledge-forward content presentation
- Clear visual hierarchy
- Trust-signaling brand colors
- Purposeful motion and interaction

---

## Color Palette

### Primary Brand Colors

```css
--brand-default: #165DFF;    /* Deep Blue */
--brand-light: #1FB1FF;      /* Bright Accent */
--brand-dark: #0E3FA8;       /* Darker variant */
```

**Brand Gradient:**
```css
background: linear-gradient(135deg, #165DFF 0%, #1FB1FF 100%);
```

### Neutral Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-0` | `#FFFFFF` | Pure white backgrounds |
| `neutral-100` | `#F8FAFC` | Surface backgrounds |
| `neutral-200` | `#F1F5F9` | Subtle backgrounds |
| `neutral-300` | `#E2E8F0` | Borders |
| `neutral-400` | `#D1D5DB` | Borders, dividers |
| `neutral-500` | `#9CA3AF` | Placeholder text |
| `neutral-600` | `#6B7280` | Muted text |
| `neutral-700` | `#4B5563` | Secondary text |
| `neutral-800` | `#1F2937` | Headings |
| `neutral-900` | `#0F1724` | Primary text |

### Support Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Success | `#10B981` | Positive actions, confirmations |
| Warning | `#F59E0B` | Alerts, cautions |
| Danger | `#EF4444` | Errors, destructive actions |
| Info | `#2563EB` | Informational messages |

---

## Typography

**Font Family:** Inter (Variable)
- Primary: `font-family: 'Inter', system-ui, sans-serif;`
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Type Scale

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-display` | 48px | 1.2 | 700 | Hero headlines |
| `text-h1` | 36px | 1.25 | 700 | Page titles |
| `text-h2` | 28px | 1.3 | 600 | Section headers |
| `text-h3` | 22px | 1.3 | 600 | Subsection headers |
| `text-h4` | 18px | 1.35 | 600 | Card titles |
| `text-body` | 16px | 1.5 | 400 | Body text |
| `text-small` | 14px | 1.4 | 400 | Small labels |
| `text-caption` | 13px | 1.4 | 400 | Captions, metadata |

### Font Features

```css
font-feature-settings: 'cv11', 'ss01';
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

---

## Spacing System

Based on **8px baseline grid**:

```
4px / 8px / 12px / 16px / 24px / 32px / 40px / 48px / 64px
```

Tailwind tokens:
- `space-1` = 4px
- `space-2` = 8px
- `space-3` = 12px
- `space-4` = 16px
- `space-6` = 24px
- `space-8` = 32px
- `space-10` = 40px
- `space-12` = 48px
- `space-16` = 64px

---

## Border Radius

| Token | Size | Usage |
|-------|------|-------|
| `rounded-xs` | 4px | Small elements, badges |
| `rounded-sm` | 6px | Buttons, inputs |
| `rounded-md` | 8px | Cards, modals |
| `rounded-lg` | 12px | Large cards, panels |

---

## Shadows

```css
/* Soft shadow - Default cards */
shadow-soft: 0 6px 18px rgba(16, 24, 40, 0.06);

/* Card shadow - Hover state */
shadow-card: 0 4px 12px rgba(16, 24, 40, 0.08);

/* Focus ring - Interactive elements */
shadow-focus: 0 0 0 4px rgba(29, 78, 216, 0.12);

/* Lift shadow - Elevated state */
shadow-lift: 0 8px 24px rgba(16, 24, 40, 0.12);
```

---

## Components

### Buttons

**Primary Button**
```tsx
<Button variant="primary" size="md">
  Get Started
</Button>
```
- Background: Brand gradient
- Text: White
- Hover: Lift effect (-translateY 2px)
- Shadow: soft → lift on hover

**Secondary Button**
```tsx
<Button variant="secondary" size="md">
  Learn More
</Button>
```
- Background: Transparent
- Border: neutral-400
- Text: neutral-800
- Hover: bg-neutral-100

**Danger Button**
```tsx
<Button variant="danger" size="md">
  Delete
</Button>
```
- Background: danger
- Text: White
- Hover: danger-dark + lift

**Ghost Button**
```tsx
<Button variant="ghost" size="md">
  Cancel
</Button>
```
- Background: Transparent
- Text: neutral-700
- Hover: bg-neutral-100

**Sizes:**
- `sm`: px-3 py-2 text-sm
- `md`: px-4 py-3 text-base (default)
- `lg`: px-6 py-3.5 text-lg

### Cards

```tsx
<div className="card">
  {/* Card content */}
</div>
```

**Styles:**
- Background: white
- Border radius: 12px
- Shadow: soft
- Padding: 24px
- Hover: shadow-card transition

### Badges

```tsx
<span className="badge-success">Active</span>
<span className="badge-warning">Pending</span>
<span className="badge-danger">Error</span>
<span className="badge-info">Info</span>
<span className="badge-neutral">Draft</span>
```

**Anatomy:**
- Rounded: full (pill shape)
- Padding: x-2.5 y-1
- Text: caption (13px)
- Font weight: 500

### Form Inputs

```tsx
<input className="input" type="text" placeholder="Enter text..." />
<textarea className="textarea" rows={4} />
```

**Styles:**
- Height: 48px (inputs), auto (textarea)
- Border: 1px neutral-400
- Border radius: 8px
- Padding: 16px
- Focus: border-brand + ring-4 ring-opacity-30
- Transition: 120ms

---

## Layout

### Container Widths

```tsx
<div className="container-dashboard">
  {/* Dashboard content - max 1400px */}
</div>
```

### Sidebar

- Width: 256px (64 * 4)
- Collapsible: icons only mode
- Background: white
- Border right: neutral-300

### Grid Systems

**Feature Grid:**
```tsx
<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards */}
</div>
```

---

## Motion & Animation

### Transition Durations

- `duration-80`: 80ms - Quick interactions
- `duration-120`: 120ms - Standard interactions (default)
- `duration-160`: 160ms - Cards, larger elements

### Animations

```css
/* Slide in from right */
@keyframes slide-in {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

/* Fade in */
@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* Scale in */
@keyframes scale-in {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
```

### Hover Effects

**Lift Effect (Buttons, Cards):**
```css
hover:shadow-lift hover:-translate-y-0.5
```

**Background Change:**
```css
hover:bg-neutral-100 transition-colors duration-120
```

---

## Accessibility

### Focus States

All interactive elements have visible focus rings:
```css
focus-visible:outline-none
focus-visible:ring-4
focus-visible:ring-opacity-30
```

Ring color: `rgba(29, 78, 216, 0.28)`

### Contrast Ratios

- Primary text (neutral-900) on white: **14:1** (AAA)
- Headings (neutral-800) on white: **11:1** (AAA)
- Muted text (neutral-600) on white: **4.6:1** (AA)
- Button text on brand gradient: **4.5:1** (AA)

### Reduced Motion

```css
@media (prefers-reduced-motion: no-preference) {
  html {
    scroll-behavior: smooth;
  }
}
```

---

## Dark Mode

Dark mode uses inverted neutrals with maintained brand colors:

```css
.dark {
  background: neutral-900;
  color: neutral-100;
}

.dark .card {
  background: neutral-800;
  border: 1px solid neutral-700;
}

.dark .input {
  background: neutral-800;
  border: neutral-700;
  color: neutral-100;
}
```

**Brand colors remain the same** for consistency and recognition.

---

## Usage Guidelines

### Navigation Active States

Active navigation items use:
- Gradient left border (6px width)
- Light brand background (brand/5)
- Brand text color
- Smooth transition (120ms)

### Iconography

- Icon size: 20px (h-5 w-5) for navigation
- Icon size: 24px (h-6 w-6) for features
- Icon color: Matches text color or uses brand
- Stroke width: 2px

### Spacing Patterns

**Cards:**
- Outer gap: 32px (space-8)
- Inner padding: 24px (space-6)

**Sections:**
- Vertical padding: 80-96px (py-20 sm:py-24)
- Between sections: Use background color change

**Content:**
- Max width for readability: 680px (max-w-2xl for text)
- Dashboard max width: 1400px

---

## Component Examples

### Feature Card

```tsx
<div className="card group">
  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-gradient">
    <Package className="h-6 w-6 text-white" />
  </div>
  <h3 className="text-h4 mb-2 text-neutral-900">
    Kontecst Packages
  </h3>
  <p className="text-neutral-600">
    Collections of Markdown files with metadata and versioning
  </p>
</div>
```

### Badge

```tsx
<span className="badge-success">
  <Check className="h-3 w-3" />
  Active
</span>
```

### Input with Label

```tsx
<div>
  <label className="block text-sm font-medium text-neutral-700 mb-2">
    Email
  </label>
  <input
    type="email"
    className="input"
    placeholder="you@company.com"
  />
  <p className="mt-1 text-small text-neutral-600">
    We'll never share your email
  </p>
</div>
```

---

## Resources

### Tailwind Config

All design tokens are available in `tailwind.config.js`:
- Colors: `theme.extend.colors`
- Typography: `theme.extend.fontSize`
- Shadows: `theme.extend.boxShadow`
- Animations: `theme.extend.keyframes`

### Global Styles

Component classes available in `globals.css`:
- `.btn-primary`, `.btn-secondary`, `.btn-danger`
- `.card`
- `.badge-*` variants
- `.input`, `.textarea`

### Font Import

Inter font imported via Google Fonts:
```html
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

---

## Implementation Checklist

When building new features:

- [ ] Use brand gradient for primary actions
- [ ] Maintain 8px spacing grid
- [ ] Apply proper typography scale
- [ ] Include focus states on interactive elements
- [ ] Add hover effects (lift for buttons, background for links)
- [ ] Use semantic HTML elements
- [ ] Test contrast ratios
- [ ] Verify responsive behavior
- [ ] Test keyboard navigation
- [ ] Check dark mode compatibility

---

## Design Philosophy

**Clarity over cleverness** - Every design decision prioritizes user understanding.

**Trust through transparency** - Visual hierarchy and consistent patterns build user confidence.

**Simplicity at scale** - The system should feel simple whether building a single package or managing an enterprise deployment.

**Accessible by default** - Meeting WCAG AA standards is not optional, it's foundational.
