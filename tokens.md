# CSS tokens and visual style

This is the frontend visual reference for **Вместе**. It describes the
established styles and the conventions to use when adding or changing UI.
Prefer existing tokens and component CSS Modules over introducing new global
selectors or one-off values.

## Sources of truth

- `src/styles/tokens.css` is the source of truth for light and dark color
  tokens and shared spacing, radius, focus, and shadow scales.
- `src/App.css` contains the reset, legacy global rules, and intentionally
  shared component styles. Feature-specific rules should live in neighboring
  CSS Modules.
- `src/app/AppResponsive.module.css` contains the shell and a residual set of
  app-wide responsive overrides; new component-specific responsive styles
  should live beside their component.
- `src/app/AppShell.module.css` owns the shell's tablet and desktop sidebar
  layout.
- Neighboring CSS Modules in `app/`, `components/`, and `features/` own
  component-specific styles. Keep new rules scoped to their component unless a
  style is intentionally shared.
- `src/main.jsx` sets `body[data-theme]` from persisted user settings.

The global styles are still being migrated. A token listed as an existing CSS
custom property is directly usable; suggested scales below are conventions
based on repeated values, not additional variables already defined in code.

## Existing color tokens

Defined in `src/styles/tokens.css` on `:root`:

| CSS variable          | Light     | Purpose                                  |
| --------------------- | --------- | ---------------------------------------- |
| `--vk-blue`           | `#0077FF` | Primary action, links, selected controls |
| `--vk-blue-hover`     | `#0066DD` | Hover/pressed blue action                |
| `--vk-blue-light`     | `#E5F1FF` | Soft primary surface, selected chips     |
| `--vk-bg`             | `#EDEEF0` | App/page background                      |
| `--vk-card`           | `#FFFFFF` | Main card and header surfaces            |
| `--vk-text`           | `#000000` | Primary text                             |
| `--vk-text-secondary` | `#818C99` | Secondary text, hints, metadata          |
| `--vk-divider`        | `#E5E7EB` | Separators and subtle borders            |
| `--vk-green`          | `#4BB34B` | Success/positive state                   |
| `--vk-red`            | `#E64646` | Destructive/error state                  |

Dark theme overrides these variables on `body[data-theme="dark"]` in
`src/styles/tokens.css`:

| CSS variable          | Dark      | Purpose                       |
| --------------------- | --------- | ----------------------------- |
| `--vk-bg`             | `#15171C` | App/page background           |
| `--vk-card`           | `#1E2128` | Main raised surface           |
| `--vk-text`           | `#E8EAED` | Primary text                  |
| `--vk-text-secondary` | `#8B95A5` | Secondary text                |
| `--vk-divider`        | `#2B3038` | Separators and subtle borders |
| `--vk-blue-light`     | `#1C2A3D` | Soft selected/primary surface |

`--vk-blue`, `--vk-blue-hover`, `--vk-green`, and `--vk-red` retain their root
values in dark mode. Some established component styles use additional dark
neutrals such as `#262A33` (input/secondary surface) and `#343A45`
(stronger border); reuse these only when the same surface role applies.

## Semantic and layout tokens

Use semantic aliases for new code. They resolve to the established palette, so
they do not introduce a visual redesign. The `--vk-*` names remain supported
for existing styles during migration.

| Token group         | Variables                                                               |
| ------------------- | ----------------------------------------------------------------------- |
| Surfaces            | `--surface-page`, `--surface-raised`, `--surface-input`                 |
| Text                | `--text-primary`, `--text-secondary`                                    |
| Borders             | `--border-default`, `--border-subtle`                                   |
| Actions             | `--action-primary`, `--action-primary-hover`, `--action-primary-soft`   |
| Status              | `--status-success`, `--status-danger`                                   |
| Focus and elevation | `--focus-ring`, `--shadow-card`                                         |
| Spacing             | `--space-1` through `--space-6` (`4`, `8`, `12`, `16`, `24`, `32` px)   |
| Radius              | `--radius-control`, `--radius-card`, `--radius-dialog`, `--radius-pill` |

Color aliases are re-bound for dark mode on `body[data-theme="dark"]`; use the
semantic aliases instead of copying theme-specific hex values into new rules.
Spacing, radii, and effects are conventions for gradual adoption and do not
require a mass migration of existing components.

### CSS usage

```css
.action {
  background: var(--action-primary);
  color: #fff;
}

.card {
  background: var(--surface-raised);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-card);
}
```

For component styles, keep the selectors local and use `:global()` only for
intentional application-level state, for example:

```css
:global(body[data-theme="dark"]) .card {
  border-color: var(--vk-divider);
}
```

## Visual conventions

These are a practical scale for consistency, not a requirement to redesign
existing screens. Match a nearby established component when in doubt.

| Area                     | Preferred values and use                                            |
| ------------------------ | ------------------------------------------------------------------- |
| Font stack               | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| Display/title            | 22–26 px, weight 700–800; use sparingly                             |
| Section heading          | 15–18 px, weight 600–700                                            |
| Body/control             | 14–15 px, weight 400–600                                            |
| Metadata/hint            | 11–13 px, secondary text color                                      |
| Small labels             | 10–12 px; preserve readable contrast                                |
| Spacing                  | 4, 8, 12, 16, 20, 24 px; use 8/12/16 most often                     |
| Compact control radius   | 8–10 px                                                             |
| Chips and small controls | 12–15 px                                                            |
| Cards and panels         | 14–16 px                                                            |
| Dialogs/sheets           | 20–24 px                                                            |
| Pill/badge               | `999px` or half-height                                              |
| Focus ring               | Blue border plus a subtle translucent blue outer ring               |
| Transitions              | Short, typically `0.2s`; avoid animation that delays actions        |

Keep a clear hierarchy: primary text for names and actions, secondary text for
dates/addresses/help, and muted borders for structure. Blue communicates
selection and primary actions; green is positive/confirming; red is destructive
or error; amber is reserved mainly for ratings. Do not use color alone to
communicate an error or selected state.

## Responsive layout

- **Below 768 px:** mobile layout, compact padding, and bottom navigation.
  Respect safe-area insets for fixed navigation and sheets.
- **768 px and up:** tablet/desktop layout with the shell sidebar; component
  content may use wider layouts where its own module defines them.
- **1200 px and up:** the shell and selected components can expand further;
  avoid assuming all screens are constrained to a mobile preview frame.
- The principal mobile/desktop switch is `max-width: 767px` versus
  `min-width: 768px`. Keep those breakpoints consistent; add another only when
  the component actually needs an intermediate layout.
- Check both light/dark themes and at least one narrow viewport after changing
  component layout.

## Component styling workflow

1. Put styles used by one React component in a neighboring `Component.module.css`.
2. Use `styles.someName` in JSX; combine multiple module classes explicitly.
3. Keep truly shared layout/reset rules in `App.css`; keep shell responsive
   overrides in `AppResponsive.module.css`/`AppShell.module.css` and
   component-specific responsive rules beside their component.
4. Use semantic variables for new colors and existing `--vk-*` variables when
   touching legacy rules. If a repeated value has no semantic token, confirm
   its purpose before adding one.
5. Dark styles belong beside their component styles and should use
   `body[data-theme="dark"]` as the theme hook.
6. Avoid styling by broad element selectors in a module and avoid `!important`
   unless required to override a documented legacy global rule.
7. Validate with `npm run lint -- --quiet`, `npm test`, and `npm run build`;
   visually smoke-test desktop/mobile and light/dark when the UI changes.

## Known migration caveat

`App.css` still contains legacy global rules and hard-coded palette values.
New components should prefer semantic variables and local modules; migrate old
rules incrementally when their owning component is changed. The detailed
architecture history remains in `ARCHITECTURE_PROGRESS.md`; see
[`progress.md`](./progress.md) for the current project summary and outstanding
work.
