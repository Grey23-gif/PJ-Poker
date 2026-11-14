# Cafe Poker — UI design system

This is the implementation source of truth for the existing React application.

## Research and scope

Generated with the installed `ui-ux-pro-max` CLI on 14 November 2026:

- `poker club operations dashboard dark --design-system`: gaming marketing results were unsuitable and rejected.
- `enterprise SaaS analytics dashboard --design-system`: verified the **Data-Dense Dashboard** style, grid-based metrics, charts, tables, conservative accents, and avoidance of ornate decoration.
- `responsive forms dashboard --stack react`: preserve controlled inputs and submission handlers.
- `keyboard focus modal --domain ux`: visible focus and unobscured controls.

The generated marketing/Enterprise Gateway page pattern does not fit this authenticated application. The user's explicit dark navy/emerald direction overrides the generated light blue palette. Existing Inter typography is retained for Vietnamese text, consistency, and no added dependency. No marketing sections or new business features are introduced.

## Tokens

| Role | Value | Application |
| --- | --- | --- |
| Canvas | `#0b111b` | Page background |
| Sidebar/header | `#0c141f` | Application navigation |
| Card | `#121c29` | Data cards and dialogs |
| Raised/hover | `#192635` | Secondary controls and hover |
| Border | `#2b3c4e` | Card and control boundaries |
| Foreground | `#edf3f8` | Main text |
| Secondary | `#a5b4c5` | Descriptions and labels |
| Primary | `#34d399` | Main action and current navigation |
| On primary | `#06291e` | Dark text on emerald fill |
| Gold | `#d8b56c` | Tournament and achievement details |
| Destructive | `#fb7185` | Destructive action indicators |

CSS variables live in `src/index.css`; existing semantic Tailwind colors are maintained in `tailwind.config.js`. White receipt surfaces retain dark text independently of the dark application theme. Charts retain green/gold series identities.

## Typography and space

- Inter, system-ui, sans-serif; existing font loading remains in index.html.
- Body 14px desktop / 16px mobile. Supporting labels 12px minimum.
- Screen title 24–30px, weight 600, restrained letter spacing.
- Section heading 14–16px, weight 600.
- Tabular numerals for KPIs; existing monospace stack for tournament time and chip values.
- Spacing rhythm: 4, 8, 12, 16, 20, 24, 32px.
- Control radius 10px; card radius 16px; small badge radius 6px.
- Solid surfaces and quiet borders. No decorative glow, pulsing CTA, animated wallpaper, or card scale on hover.
- Transitions: color/border 150–200ms; reduced-motion override throughout.

## Application shell

- 256px desktop sidebar, 80px sticky header, content capped at 1600px.
- Sidebar becomes a dismissible drawer below 1024px, with hidden links removed from keyboard navigation, Escape, focus containment, and restoration.
- Current route stays explicit; parent tour/shift list links do not appear selected on detail routes.
- Native disclosure controls for user/role menus, outside-click and Escape dismissal.
- Vietnamese skip link and named breadcrumbs.

## Components

- Main action: solid emerald with dark foreground. Secondary: quiet slate. Gold: outlined/tinted supporting action. Destructive: rose.
- Standard buttons and shared fields target at least 44px height.
- Cards share solid surfaces and borders, with consistent headers, sections, and footers.
- Labels connect to generated unique field IDs; errors use aria-invalid and linked alert text.
- Shared modal uses native dialog for focus containment, Escape, background inertness, and nested dialog layering. Content scrolls within 90dvh.
- Tables use readable row spacing, quiet headers, hover feedback, and local horizontal scrolling on small screens.
- Status badges use text as well as color, without animated dots or emoji.

## Module applications

- Dashboard: plain editorial heading, spacious three-column KPI grid, revenue trend/payment panels, current tour, pending approvals, recent receipts, and top players. Data calculations retained.
- POS: horizontally scrollable categories above catalog, 2–4 column product grid, 370px sticky checkout; catalog and checkout stack below 768px. Product add action is a named native button, separate from editing. Stock display and checkout rules retained.
- Clock: uncluttered dark display, large responsive tabular countdown, existing current/next stage, break, participant, chip, prize and operator panels. Clock comes first on small screens. Timestamp, sound, progression and store logic retained.
- Remaining pages: common surfaces, headings, forms, tables and dialogs across member portal, accounts, role permissions, tours, blind structures, points, rankings, shifts, reports, profile and login.

## Preservation and validation boundaries

Stores, types, fixtures, protected routing and routes are unchanged. A fingerprint manifest records these files for verification. Existing synchronous/localStorage demo behavior is retained.

Build/type checking and lint must be executed; a passing compile does not prove browser interaction or visual correctness. See REDESIGN.md for actual verification and remaining limitations.
