# 🎨 UI Design System

> **Project:** User System — School Admin Dashboard
> **Purpose:** This document defines the complete visual language for all frontend pages and components.
> Any new page, any Lovable prompt, any frontend developer must follow this system exactly.

---

## 1. Core Philosophy

- **Dark first.** Every screen uses the dark theme. No light mode.
- **Borders over shadows.** Do not use `box-shadow`. Use `border` with `#334155` instead.
- **No extra noise.** Every element must have a reason. No decorative gradients unless it is an action element.
- **Accent = action.** The blue-purple gradient is reserved for buttons, selected states, and active indicators only. Never use it for text or backgrounds.

---

## 2. Color Palette

### Background Layers

| Name | Hex | Usage |
|---|---|---|
| `bg-base` | `#0f172a` | Page background — the outermost layer |
| `bg-card` | `#1e293b` | Card backgrounds, panels, modals |
| `bg-elevated` | `#263347` | Hover states, nested sub-cards inside cards |

### Borders

| Name | Hex | Usage |
|---|---|---|
| `border-default` | `#334155` | All card borders, input borders, dividers |
| `border-accent` | `#6366f1` | Active card highlight, focus ring on inputs |
| `border-success` | `#22c55e` | Success state borders |
| `border-danger` | `#ef4444` | Error state borders |

### Text

| Name | Hex | Usage |
|---|---|---|
| `text-primary` | `#f8fafc` | Main headings, important values |
| `text-secondary` | `#94a3b8` | Subtitles, hints, placeholder text |
| `text-muted` | `#64748b` | Disabled text, timestamps, labels |

### Accent (Gradient)

| Name | Value | Usage |
|---|---|---|
| `accent-start` | `#6366f1` | Gradient from color |
| `accent-end` | `#8b5cf6` | Gradient to color |
| `accent-gradient` | `linear-gradient(135deg, #6366f1, #8b5cf6)` | Buttons, selected pills, active toggle |

### Status Colors

| Name | Hex | Usage |
|---|---|---|
| `success` | `#22c55e` | Success badges, created count |
| `warning` | `#f59e0b` | Warnings, pending states |
| `danger` | `#ef4444` | Errors, delete actions |
| `info` | `#38bdf8` | Info badges, preview highlights |

---

## 3. Typography

| Style | Font | Size | Weight | Color |
|---|---|---|---|---|
| Page Title | Inter | 28px | 700 Bold | `#f8fafc` |
| Section Title | Inter | 16px | 600 SemiBold | `#f8fafc` |
| Card Label | Inter | 13px | 500 Medium | `#94a3b8` — ALL CAPS |
| Body Text | Inter | 14px | 400 Regular | `#f8fafc` |
| Hint / Help Text | Inter | 13px | 400 Regular | `#94a3b8` |
| Small Badge | Inter | 11px | 600 SemiBold | depends on badge |
| Code / UUID | `monospace` | 13px | 400 | `#94a3b8` |

**Rule:** Section labels inside cards must always be ALL CAPS with `letter-spacing: 0.08em`.

Example:
```
GROUPS / STREAMS
SECTIONS
BRANCH
SESSION
```

---

## 4. Spacing System

Use a base-4 spacing scale:

| Token | px | Usage |
|---|---|---|
| `space-1` | 4px | Inline gaps between tiny elements |
| `space-2` | 8px | Icon to label gap |
| `space-3` | 12px | Inside small components |
| `space-4` | 16px | Card inner padding |
| `space-5` | 20px | Between sections inside a card |
| `space-6` | 24px | Between cards |
| `space-8` | 32px | Page top padding |

---

## 5. Border Radius

| Element | Radius |
|---|---|
| Page cards | `12px` |
| Buttons (large) | `10px` |
| Pills / Badges | `999px` (fully round) |
| Input fields | `8px` |
| Sub-cards (nested) | `8px` |
| Toggle switch track | `999px` |

---

## 6. Components

### 6.1 Page Card

The primary container for all content sections.

```
border: 1px solid #334155
background: #1e293b
border-radius: 12px
padding: 20px 24px
```

**Section label inside card:**
```
font-size: 13px
font-weight: 600
letter-spacing: 0.08em
text-transform: uppercase
color: #94a3b8
margin-bottom: 12px
```

---

### 6.2 Checkbox Pill

Used for multi-select options (classes, groups, sections).

**Unselected state:**
```
background: #0f172a
border: 1px solid #334155
border-radius: 999px
padding: 6px 14px
font-size: 14px
color: #94a3b8
cursor: pointer
```

**Selected state:**
```
background: linear-gradient(135deg, #6366f1, #8b5cf6)
border: 1px solid transparent
color: #ffffff
font-weight: 500
```

**Hover (unselected):**
```
border-color: #6366f1
color: #f8fafc
```

---

### 6.3 Radio Pill

Used for single-select options (branch, session).

Same styling as Checkbox Pill. Only one can be active at a time.

---

### 6.4 Toggle Switch

Used for "This class has groups" / "This class has sections".

**Track OFF:**
```
background: #334155
width: 40px
height: 22px
border-radius: 999px
```

**Track ON:**
```
background: linear-gradient(135deg, #6366f1, #8b5cf6)
```

**Thumb:**
```
background: #ffffff
width: 16px
height: 16px
border-radius: 50%
```

---

### 6.5 Primary Button (Generate / Submit)

```
background: linear-gradient(135deg, #6366f1, #8b5cf6)
border: none
border-radius: 10px
padding: 14px 24px
font-size: 15px
font-weight: 600
color: #ffffff
width: 100%
cursor: pointer
```

**Disabled state:**
```
background: #1e293b
border: 1px solid #334155
color: #64748b
cursor: not-allowed
```

**Success state** (after action completes):
```
background: #16a34a  (green)
content: "✅ X classrooms created successfully!"
```

---

### 6.6 Danger Button (Delete / Remove)

```
background: transparent
border: 1px solid #ef4444
border-radius: 8px
color: #ef4444
padding: 8px 16px
```

**Hover:**
```
background: #ef444420
```

---

### 6.7 Badge / Count Indicator

Small status label shown on sub-cards (e.g. "4 batches").

**Default (neutral):**
```
background: #334155
border-radius: 999px
padding: 3px 10px
font-size: 11px
font-weight: 600
color: #94a3b8
```

**Success (created count):**
```
background: #16a34a20
border: 1px solid #22c55e
color: #22c55e
```

**Info (preview count):**
```
background: #0369a120
border: 1px solid #38bdf8
color: #38bdf8
```

**Optional label:**
```
background: #334155
color: #64748b
font-size: 11px
```

---

### 6.8 Preview Panel

The live-updating preview box at the bottom of forms.

```
background: #1e293b
border: 1px solid #38bdf8   ← blue tint to distinguish from regular cards
border-radius: 12px
padding: 20px 24px
```

Preview item pills (each classroom label):
```
background: #0f172a
border: 1px solid #334155
border-radius: 999px
padding: 4px 12px
font-size: 13px
color: #94a3b8
```

---

### 6.9 Input Field

```
background: #0f172a
border: 1px solid #334155
border-radius: 8px
padding: 10px 14px
font-size: 14px
color: #f8fafc
width: 100%
```

**Focus state:**
```
border-color: #6366f1
outline: none
```

**Placeholder:**
```
color: #64748b
```

---

### 6.10 Sub-card (Nested Card)

Used inside "Configure Each Class" for per-class settings.

```
background: #263347
border: 1px solid #334155
border-radius: 8px
padding: 16px
margin-bottom: 12px
```

**Sub-card header row:**
```
display: flex
justify-content: space-between
align-items: center
margin-bottom: 16px
```

---

### 6.11 Divider

```
border: none
border-top: 1px solid #334155
margin: 20px 0
```

---

## 7. Page Layout Rules

- **Max content width:** `800px`, centered on page
- **Page padding:** `32px` top, `24px` left/right
- **Gap between cards:** `16px`
- **Sidebar** (if present): `220px` wide, background `#0f172a`, border-right `1px solid #334155`
- **Sidebar nav item active:** accent gradient background, `border-radius: 8px`

---

## 8. Interactive States Summary

| State | Visual Change |
|---|---|
| Hover on pill | Border → `#6366f1`, text → `#f8fafc` |
| Selected pill | Gradient background, white text |
| Focus on input | Border → `#6366f1` |
| Hover on button | Brightness `1.1` |
| Disabled button | Dark background, gray text, `cursor: not-allowed` |
| Toggle ON | Gradient track |
| Toggle OFF | `#334155` track |
| Card with active border | Border → `#6366f1` |

---

## 9. Lovable Prompt Template

When generating any new page with Lovable, always start with this base:

```
Design: Dark theme.
- Background: #0f172a (very dark navy)
- Cards: #1e293b background, 1px solid #334155 border
- Nested elements: #263347 background
- Borders everywhere: #334155 — NO shadows
- Accent: linear-gradient(135deg, #6366f1, #8b5cf6) — used only for buttons and selected states
- Text primary: #f8fafc
- Text secondary: #94a3b8
- Text muted: #64748b
- Success: #22c55e
- Danger: #ef4444
- Font: Inter
- Border radius: 12px for cards, 999px for pills/badges, 8px for inputs
- Max content width: 800px centered
- No box-shadow anywhere — use border instead
```

Paste this block at the start of every Lovable prompt, then describe the specific page.

---

## 10. File Reference

| File | Purpose |
|---|---|
| This document | Design system — colors, components, rules |
| `academics/batches/batch-system-deep-dive.md` | Batch concept and patterns |
| `academics/batches/bulk-generate-classrooms.md` | Bulk generator feature and API |
| `users/phase-0.4-admissions-rbac.md` | RBAC, staff, student admissions |
