# Drawer & Modal UI Guidelines
> **Project:** SMS SaaS  
> **Design System:** Flat aesthetic — borders for depth, no box-shadows, primary `#6366f1`  
> **Last updated:** 2026-07-22

---

## Core Principle: Every drawer and modal must look and feel identical in structure.

The content inside changes. The shell never changes.

---

## Drawer (`<Sheet>`) Shell Structure

```
┌─────────────────────────────────────────────┐
│  HEADER  ·  px-6 py-5  ·  border-b          │
│  SheetTitle  — text-[15px] font-semibold     │
│  SheetDescription — text-xs text-muted-foreground │
├─────────────────────────────────────────────┤
│  [STEP BAR — only for multi-step forms]      │
│  px-6 py-3  ·  border-b  ·  bg-muted/20     │
├─────────────────────────────────────────────┤
│  [TAB BAR — only for detail/view drawers]    │
│  px-6  ·  border-b  ·  underline style       │
├─────────────────────────────────────────────┤
│                                             │
│  CONTENT  —  flex-1  overflow-y-auto        │
│  px-6 py-5  ·  space-y-4                   │
│                                             │
├─────────────────────────────────────────────┤
│  FOOTER  ·  px-6 py-4  ·  border-t          │
│  [Cancel/Back]           [Primary Action]   │
└─────────────────────────────────────────────┘
```

---

## 1. Header Rules

Every drawer has ONE header block. It is always:

```tsx
<SheetHeader className="px-6 py-5 border-b shrink-0">
  <SheetTitle className="text-[15px] font-semibold">Title Here</SheetTitle>
  <SheetDescription className="text-xs text-muted-foreground">
    One-line description of what this drawer does.
  </SheetDescription>
</SheetHeader>
```

**Rules:**
- Title: `text-[15px] font-semibold` — never larger, never smaller
- Description: `text-xs text-muted-foreground` — always present, one line max
- Padding: always `px-6 py-5` — no exceptions
- Separator: always `border-b`
- No icons in the header — the title speaks for itself
- No gradients, no colored backgrounds in the header

**Profile/detail drawers** extend the header by adding an avatar block below the title/description, still within the same `px-6 py-5 border-b` container:

```tsx
<SheetHeader className="px-6 py-5 border-b shrink-0">
  <SheetTitle>...</SheetTitle>
  <SheetDescription>...</SheetDescription>
  
  {/* Profile block — only for detail drawers */}
  <div className="flex items-start gap-4 mt-4 pt-4 border-t">
    {/* avatar + name + badges + contact */}
  </div>
</SheetHeader>
```

---

## 2. Avatar

Used only in **detail/view** drawers.

```tsx
<div className="flex items-center justify-center h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
  <span className="text-sm font-semibold text-primary tracking-tight">{initials}</span>
</div>
```

**Rules:**
- Always `h-11 w-11 rounded-lg`
- Always `bg-primary/10 border border-primary/20 text-primary`
- Initials: `text-sm font-semibold tracking-tight`
- Never solid `bg-primary` — too heavy
- Never round (`rounded-full`) — use `rounded-lg`

---

## 3. Status Badges

```tsx
<span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
  <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
  {label}
</span>
```

Standard status colors:
| Status | Background | Text | Dot |
|--------|-----------|------|-----|
| ACTIVE | `bg-green-100 dark:bg-green-950/50` | `text-green-700 dark:text-green-400` | `bg-green-500` |
| INACTIVE | `bg-muted` | `text-muted-foreground` | `bg-muted-foreground/50` |
| SUSPENDED | `bg-red-100 dark:bg-red-950/50` | `text-red-700 dark:text-red-400` | `bg-red-500` |

Category badge (no dot, smaller, not rounded-full):
```tsx
<span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>
  {label}
</span>
```

---

## 4. Step Indicator (Multi-step forms only)

Sits between Header and Content. Never inside Content.

```tsx
<div className="flex items-center px-6 py-3 border-b shrink-0 bg-muted/20">
  {STEPS.map((s, i) => (
    <div key={s.step} className="flex items-center flex-1 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        {/* Circle */}
        <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center
          text-[11px] font-semibold border transition-colors ${stepCircleClass}`}>
          {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : s.step}
        </div>
        <span className={`text-xs truncate ${stepLabelClass}`}>{s.label}</span>
      </div>
      {/* Connector */}
      {i < STEPS.length - 1 && <div className="flex-1 mx-2 h-px bg-border min-w-[12px]" />}
    </div>
  ))}
</div>
```

Step circle states:
- **Active:** `bg-primary border-primary text-primary-foreground`
- **Completed:** `bg-primary/15 border-primary/30 text-primary` + `<CheckCircle2>` icon
- **Upcoming:** `bg-transparent border-border text-muted-foreground`

---

## 5. Tabs (Detail/view drawers only)

**Always use underline style.** Never use pill/segmented tabs inside drawers.

```tsx
<TabsList className="px-6 border-b rounded-none h-10 bg-transparent justify-start gap-0 shrink-0">
  <TabsTrigger
    value="profile"
    className="h-10 px-4 text-sm rounded-none border-b-2 border-transparent bg-transparent
      text-muted-foreground
      data-[state=active]:border-primary
      data-[state=active]:text-foreground
      data-[state=active]:font-medium"
  >
    Profile
  </TabsTrigger>
</TabsList>
```

---

## 6. Content Area

```tsx
<div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
  {/* content */}
</div>
```

**Section info/hint boxes:**
```tsx
<p className="text-xs text-muted-foreground rounded-lg bg-muted/40 px-3 py-2 border">
  Hint text here.
</p>
```

**Section cards (grouped fields in detail view):**
```tsx
<div className="rounded-lg border bg-card overflow-hidden">
  <div className="flex items-center gap-2 px-4 py-2.5 border-b bg-muted/30">
    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</span>
  </div>
  <div className="px-4 py-3">{children}</div>
</div>
```

**Selectable row items (roles, options):**
```tsx
<div
  className={`flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
    isSelected
      ? 'border-primary/50 bg-primary/5 dark:bg-primary/10'
      : 'border-border hover:bg-muted/30'
  }`}
  onClick={...}
>
  {/* custom checkbox + label */}
</div>
```

**Custom checkbox:**
```tsx
<div className={`mt-0.5 w-4 h-4 shrink-0 rounded border-2 flex items-center justify-center ${
  isSelected ? 'bg-primary border-primary' : 'border-border bg-background'
}`}>
  {isSelected && <CheckIcon />}
</div>
```

---

## 7. Footer

```tsx
<div className="border-t px-6 py-4 flex items-center justify-between shrink-0">
  <Button variant="ghost" onClick={onCancel}>
    Cancel  {/* or "Back" for multi-step */}
  </Button>
  <Button onClick={onSubmit} disabled={isPending}>
    {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
    Primary Action Label
  </Button>
</div>
```

**Rules:**
- Always `border-t px-6 py-4`
- Cancel/Back: always `variant="ghost"`, left side
- Primary action: always right side, shows spinner when pending
- No more than 2 buttons in a drawer footer

---

## Modal (`<Dialog>`) Shell Structure

```tsx
<DialogContent className="sm:max-w-md">
  <div className="flex flex-col gap-5 py-2">
    {/* Icon (optional, centered) */}
    {/* Title + description */}
    {/* Content */}
    {/* Actions */}
  </div>
</DialogContent>
```

**Rules:**
- Max width: `sm:max-w-md` for small, `sm:max-w-lg` for large
- Destructive confirmations: always use `<AlertDialog>`, not `<Dialog>`
- No custom headers in dialogs — use the built-in `DialogHeader`

---

## Width Standards

| Type | Width |
|------|-------|
| Form drawer (invite, create) | `sm:max-w-lg` |
| Detail/view drawer | `sm:max-w-xl` |
| Info dialog | `sm:max-w-md` |
| Large dialog | `sm:max-w-lg` |

---

## Anti-patterns — Never do these

| ❌ Don't | ✅ Do instead |
|---------|------------|
| Gradient/colored header backgrounds | Plain `bg-card` / `bg-background` |
| `box-shadow` anywhere | Use `border` for depth |
| Solid `bg-primary` avatar | `bg-primary/10 border-primary/20 text-primary` |
| Pill/segmented tab switcher inside drawer | Underline tabs |
| Icon decorations in drawer header | Text-only header |
| `rounded-full` avatar | `rounded-lg` avatar |
| Different padding between drawers | Always `px-6 py-5` header, `px-6 py-5` content, `px-6 py-4` footer |
