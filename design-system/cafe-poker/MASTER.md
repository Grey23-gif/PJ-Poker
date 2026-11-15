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
- Screen title 22–26px on fine-pointer desktop, 24px on smaller/touch displays, weight 600.
- Section heading 14–16px, weight 600.
- Tabular numerals for KPIs; existing monospace stack for tournament time and chip values.
- Spacing rhythm: 4, 8, 12, 16, 20, 24, 32px.
- Control radius 10px; card radius 16px; small badge radius 6px.
- Solid surfaces and quiet borders. No decorative glow, pulsing CTA, animated wallpaper, or card scale on hover.
- Transitions: color/border 150–200ms; reduced-motion override throughout.

## Application shell

- Fine-pointer desktop uses a 232px sidebar and 60px sticky header. Smaller/touch displays use a 256px drawer and 64px header. Content is capped at 1600px.
- Sidebar becomes a dismissible drawer below 1024px, with hidden links removed from keyboard navigation, Escape, focus containment, and restoration.
- Current route stays explicit; parent tour/shift list links do not appear selected on detail routes.
- Native disclosure controls for user/role menus, outside-click and Escape dismissal.
- Vietnamese skip link and named breadcrumbs.

## Components

- Main action: solid emerald with dark foreground. Secondary: quiet slate. Gold: outlined/tinted supporting action. Destructive: rose.
- Fine-pointer desktop uses 36px small buttons, 38px standard buttons and fields, and 42px large buttons. Smaller/touch displays and Clock TV controls keep 44px minimum targets, with 48px large buttons.
- Cards share solid surfaces and borders, 16px desktop/20px touch padding, and consistent headers, sections, and footers. Caller padding utilities can override shared defaults.
- Labels connect to generated unique field IDs; errors use aria-invalid and linked alert text.
- Shared modal uses native dialog for focus containment, Escape, background inertness, and nested dialog layering. Content scrolls within the available dynamic viewport after its outer gutters.
- Tables use readable row spacing, quiet headers, hover feedback, and local horizontal scrolling on small screens.
- Status badges use text as well as color, without animated dots or emoji.

## Module applications

- Dashboard uses compact horizontal KPI cards, revenue trend/payment panels, current tour, pending approvals, recent receipts and top players.
- POS uses horizontally scrollable categories, 2–4 product columns and a 320px checkout in the two-column workspace. Catalog and checkout stack below 860px of actual content width. Three product columns begin at 1040px and four at 1480px. Product add and edit actions remain independently named controls.
- Clock: uncluttered dark display, large responsive tabular countdown, existing current/next stage, break, participant, chip, prize and operator panels. Clock comes first on small screens. Timestamp, sound, progression and store logic retained.
- Remaining pages: common surfaces, headings, forms, tables and dialogs across member portal, accounts, role permissions, tours, blind structures, points, rankings, shifts, reports, profile and login.

## Preservation and validation boundaries

Stores, types, fixtures, protected routing and routes are unchanged. A fingerprint manifest records these files for verification. Existing synchronous/localStorage demo behavior is retained.

Build/type checking and lint must be executed; a passing compile does not prove browser interaction or visual correctness. See REDESIGN.md for actual verification and remaining limitations.


## Light/dark appearance update

The application now supports an explicit light/dark toggle, following the user's follow-up request. Default remains dark. A saved `poker_cafe_theme` preference is applied by the inline head script before first paint. `src/utils/theme.ts` synchronizes the controls, native color-scheme and changes from other tabs; blocked storage does not prevent switching for the current session.

`ThemeToggle` is available in the application header, login page and tournament clock header. Vietnamese accessible labels describe the destination mode. The Toaster follows the selected theme.

Neutral colors now use RGB semantic roles through Tailwind (`canvas`, `navigation`, `surface`, `field`, `raised`, `content`, `secondary`, `muted`, `line`). Status foregrounds (`success`, `warning`, `danger`, `info`, `accent`, `gold`) become darker in light mode. Solid colored buttons retain appropriate fixed foregrounds. Receipt paper remains white with dark print text; scrims and product-image edit overlays retain their intended dark backgrounds.

| Role | Dark | Light |
| --- | --- | --- |
| Canvas | #0b111b | #f4f7fa |
| Card | #121c29 | #ffffff |
| Navigation | #0c141f | #ffffff |
| Foreground | #edf3f8 | #0f172a |
| Secondary | #cbd5e1 | #334155 |
| Muted | #a5b4c5 | #475569 |
| Raised | #192635 | #e8eff5 |
| Border | #2b3c4e | #d1dbe5 |
| Success text | #6ee7b7 | #047857 |
| Gold text | #d8b56c | #85601a |

Chart axes, grids, series and tooltip colors use CSS variables. `scripts/verify-theme.mjs` checks actual theme tokens for 48 text/surface combinations and exercises saved/invalid/blocked storage initialization and switching. Browser layout and interaction verification remains pending.

## Readability regression guard

Vite imports the shared PostCSS config, which imports Tailwind's theme config. These are tracked configuration dependencies so changes rebuild the running CSS pipeline. Validate actual generated CSS with `node scripts/verify-theme-css.mjs --dev=http://127.0.0.1:5173` after building. Token contrast checks alone do not prove that a running server emitted the corresponding utility classes.

Form labels use 14px; inputs have solid themed surfaces. Tournament detail values and descriptions use 14px with separate inset surfaces. Break rows and selected permission/category states use semantic status tints in both themes. Long card titles may wrap to two lines; card actions wrap; three-column tournament grids start at 1280px. Blind structure tables scroll locally on narrow screens.


## Tournament Statistics enhancement

The user's follow-up explicitly authorizes the new statistics accounting; the earlier UI-only scope no longer applies to those requested domain changes. Keep existing timestamp-based clock controls intact.

A dedicated shared statistics dialog is available from tournament cards and the clock. Use existing Modal/Input/Select/Button primitives and semantic theme colors. Present four metric cards, an automatic average summary, correction or issuance fields, a required reason and a scrollable audit history. The correction form permits only Entries, unique players and remaining players; show Starting Stack, Total Stack and Average Stack as read-only calculated values. The remaining-player denominator is unique players, never entries. Do not permit direct editing of Starting Stack, Total Stack or Average Stack.

Admin/Cashier controls are checked again in store actions. Validation has linked inline field errors and a focusable error summary. Legacy estimates carry a visible reconciliation notice until explicitly corrected. Use a dash when Average Stack is undefined because remaining is zero. Chip input edits commit on blur or Enter so history represents deliberate edits rather than individual keystrokes.

History shows operation, actor, role, time, reason and before/after changes. Buy-in and Re-entry increase entries; only Buy-in introduces a new unique player; Re-buy/Add-on remain in the audit/participant allocation history. For the current session summary, Total Stack is `Entries × Starting Stack` and Average Stack is Total Stack divided by remaining players (zero when nobody remains). Keep light/dark contrast consistent and wrap large numeric values within cards.


## Tournament display, selection and Buy-in closing (current requirements)

The navigation/page title is Giải đấu. Display and related dialogs use Vietnamese (`lang=vi`), Vietnamese number formatting and structural labels Vòng N / Kỳ nghỉ N. Preserve user-authored tournament/player names and audit notes. Admin gets a visibly labelled native Chọn giải đấu select, keyboard focus styles and a textual live Buy-in status. Other roles retain existing route/operator permissions. Selection is persisted separately from tournament records; switching dismisses old dialogs/drafts without changing runtime.

Open the route on a selection overview, not directly on the clock. Show the selected cover, current stage, remaining time, Buy-in state, registration setting, four core statistics and a collapsible structure table before the primary Mở đồng hồ giải đấu action. Use responsive cards for metrics and a horizontally scrollable semantic table where needed. Returning from the clock returns to this overview without resetting the runtime.

Admin chooses a BREAK stage for automatic Buy-in closure. Show Đóng Buy-in sau Kỳ nghỉ N beneath the current stage and an Admin-only edit action. Keep registration open throughout that break; close at its end, latch the closure and retain it when stepping back/resetting. Admin can also close manually. Block new Buy-ins/Re-entries/Re-buys after closure, while preserving permitted statistics corrections and Add-ons. Each tournament stores its own configuration and status. Legacy level references remain compatible. Remaining players display remaining / unique players; Entries includes re-entries separately. Never offer start/end scheduling inputs; retain level/break durations and countdown controls.

Use one shared runtime scheduler per application instance, independent of the selected display. Timestamp catch-up must carry elapsed overflow across levels/breaks, preserve paused tournaments and avoid duplicate automatic transitions. Background resolution must discard stale results when changing the selected tournament. Keep the existing semantic surfaces, readable scrims, 44px controls and responsive wrapping.

On the live clock, leave the countdown, current/next level, blinds, break details, Buy-in state and closing milestone visible at all times. Hide Entries, unique players, remaining/unique, Total Stack and Average Stack until that tournament's Buy-in is closed; reveal them immediately after automatic or manual closure. The overview and authorized statistics editor remain available for configuration and correction.

Use English for poker metrics in the clock, tournament overview/cards and statistics modal: `Players Remaining`, `Unique Players`, `Total Entries`, `Total Stack`, `Average Stack`, `Starting Stack`, `Blinds`, `Next Level`, `Next Break`, `Total Prize Pool`, `1st Place Prize`, `Next Prize`, `Paid Places`, `Buy-in Open`, and `Buy-in Closed`. Keep application navigation and non-poker management copy in Vietnamese. Once the configured closing break has completed, hide the closing-milestone text but retain Buy-in Closed and any later Next Break information.

In the statistics editor, provide draft-only quick controls for +1, +5 and +10 Entries, plus New Player (+1 Entry, +1 Unique Player) and Re-entry (+1 Entry). They must never persist automatically or silently alter Players Remaining. Recalculate read-only Total Stack/Average Stack immediately and retain validation as the save gate.

The live Clock is a display/operator surface and must not contain a statistics-edit action. Keep statistics editing on the Tournament overview. Its prize panel uses a transparent, dynamic points split: each Total Entry contributes 2 PTS, Total Prize Pool is Entries × 2 PTS, and Top 1/2/3 receive 60%/30%/10% respectively. Present the pool and all three payouts together with explicit percentage labels; do not retain fixture VND prize amounts there.

The overview has an Admin-only destructive `Reset tất cả thông số` action with a named confirmation. It clears only the current session's participants, entries/statistics/audit, ranks and runtime: first stage, paused, and Buy-in open. Preserve the permanent tournament configuration, including structure, close-after-break setting and both backgrounds.

## Clock registration endpoint and Level terminology

The live Clock is intentionally a display/operator view: do not render a registration-settings button or a Buy-in Open/Closed badge in its header or stage area. Instead render one non-interactive, per-tournament label in the stage context: `Reg End: Start of Level N`. Resolve it from the configured close-after-break setting (the first Level following the selected Break) and support legacy `registrationEndStageId` records. If neither is valid, show `Reg End: Not set`. Keep the Admin-only manual close action and all automatic closure behavior intact; statistics visibility still follows the persisted closed state.

Use `Level` rather than `Vòng` for all generated blind-stage labels, clock controls, structure-editor copy and reset messaging. Preserve user-authored stage names, including legacy names, rather than rewriting stored data.

## Tournament Templates and Sessions (latest requirements)

The management page separates **Mẫu giải đấu** (configuration only) from **Các phiên giải & lịch sử** (runtime). Use existing semantic surfaces, cover previews, labelled fields, wrapping 44px actions and responsive grids. Admin creates a new session from a template; editing a template cannot create players or change existing sessions. A new session starts with zero counts, an empty audit, Buy-in open and the first playable Level paused. Each session keeps `templateId` plus a configuration snapshot, so template edits affect future sessions and historical/active clocks remain stable. Template types/store and session types/store are separate; existing dashboard/member code consumes a composed session read model through the compatibility export.

Session statistics use the configured snapshot Starting Stack, with read-only Total Stack and Average Stack. Draft quick controls never persist without Save. New sessions forbid independent Re-buy/Add-on chip issuance; migrated sessions retain their legacy allocation/history and compatibility behavior. Admin-confirmed reset archives the previous session runtime before clearing the selected session; the template stays intact. Removing a template preserves all its sessions and referenced uploads.

Use English Break terminology throughout tournament screens: Break N, Break Schedule, On Break, Break Remaining, Break Duration and Next Break. Keep Vietnamese management navigation. The Clock prize headings are simply Total Prize Pool, Top 1, Top 2 and Top 3; retain the existing 2 points per Entry and 60/30/10 calculations without displaying formulas/percentages there. The previous sections' Clock prize headings and Vietnamese Break labels are superseded.


## Clock prize visibility and Level hierarchy

Keep the Clock prize/statistics layout stable in both Buy-in states. While Buy-in is open, show all metric labels with `--` values, including Starting Stack, Average Stack, Total Stack, Total Entries, Unique Players and all prize amounts; Players Remaining shows `-- / --`. Omit PTS/BB suffixes on masked amounts. Reveal actual values immediately when Buy-in closes and mask them again on reopening. Timer, Level, Blinds and Break Schedule keep their operational values. Current Level typography scales at 26/35/44px (roughly 45% above the previous 18/24/30px), centered above the timer; Blinds remain smaller and the countdown dominant.

## GTD and configurable Prize Distribution (latest)

The Template editor provides an Admin-only Prize Distribution fieldset using shared labelled inputs and linked inline validation. Configure Guaranteed Prize (GTD), Entries Threshold and Additional PTS per Entry; GTD stays fixed through the threshold and increases immediately on the next Entry. Allow 1–20 ordered TOP positions, automatic sequential ranks, editable percentages (0–100%, maximum 2 decimal places) and Add/Remove actions. Require an exact total of 100.00%, with a visible total/error. Show a local, unsaved Entries preview and read-only calculated pool/payout cards. Existing non-Admin managers can inspect but cannot change prize configuration.

Store fixed `prizeConfiguration` in the template and its session snapshot. Template edits affect future sessions only. Missing legacy configuration retains 0 GTD, threshold 0, 2 PTS/additional Entry and 60/30/10 payouts. New Admin-created forms start at 65 GTD / 30 Entries / 2 additional PTS, all editable before saving. Use 0.01 PTS units with integer arithmetic: floor each exact percentage allocation, distribute remaining units to the largest fractional remainders, and break ties in favor of the earlier TOP. Display all PTS amounts to two decimal places; the allocated units always total the pool.

The latest Clock requirement supersedes the masked-placeholder behavior: omit the entire prize and runtime-statistics sections until actual Buy-in closure, while retaining Starting Stack and operational clock information. After closing, dynamically render all configured TOP names and amounts without formulas/percentages. Use a compact two-column mobile payout grid and a bounded scrollable desktop list for longer distributions; the countdown and Level remain the focus.

## Top Tour and FINISHED session rules (latest)

Membership points management contains a **Top Tour** tab for Admin/Cashier, a pending badge and **Cộng điểm Top Tour** action. Use shared density tokens, semantic surfaces and locally scrolling tables. A row represents one batch covering every finalized TOP. Columns expose request ID, Tour/session/date, Player count, TOP count, total decimal PTS, requester/date, status, reviewer/date/reason and actions. Only Admin sees approval/rejection controls and reviews all assignments before deciding. Rejection requires a reason.

The first dialog field selects an eligible FINISHED Session using its stable ID. Generate a Player combobox for each frozen payout. Search names, phone numbers and member IDs immediately, including partial, case-insensitive and Vietnamese accent-insensitive matches. Arrow keys skip disabled Players, Enter selects, Escape closes the list and Tab moves normally. Typed text clears the selected ID. Keep result lists in the dialog's scrolling flow and actions in the fixed footer. A nested confirmation shows all assigned names, phones and frozen PTS before creating one PENDING request.

Store validation requires all finalized ranks, distinct active Player IDs, valid frozen decimal amounts and no pending/approved conflicts. Approval publishes all transactions, balances, rankings, approval fields and the Session archive marker in one points-ledger write. Session archive fields project from that record at startup and on storage changes. Keep lifecycle status FINISHED and expose archived records through read-only Tournament History. Pending/rejected batches leave the Session unarchived. Old per-rank records and their snapshots remain in history. Existing approved per-rank rewards require reconciliation before introducing a full batch for that Session.

The browser-local ledger provides single-write publication and repeat-approval checks within this demo. Concurrent writers across tabs/devices require backend transactions and uniqueness constraints for database-level guarantees. Native dialog/combobox browser interaction verification remains pending while the browser host is unavailable.

Manual finalization has a named confirmation showing Total Entries, Unique Players, Players Remaining, Total Prize Pool and all TOP amounts, warning of permanent locks. Reject confirmation if statistics changed while the dialog was open. FINISHED disables editing/quick adjustments/reset and locks all runtime/statistics/participant mutations in the store. The Clock and statistics inspector use frozen values. Automatic clock exhaustion also freezes results. Finalization no longer auto-generates fixed achievement reward requests: assignments occur through Top Tour and normal Admin approval.

## Independent tournament backgrounds

Use separate Tour Background and Clock Background fields in the Vietnamese Tour editor, labelled Ảnh nền giải đấu and Ảnh nền đồng hồ. Reuse the existing field/button/error patterns. Each field has its own aspect-video preview, local upload, explicit HTTPS URL Apply action, replace/remove/default actions and labelled overlay slider. Default is the existing theme surface (no custom image), with 65% overlay when an image is used. Sliders allow 0–95%; recommend at least 65%.

The Tour image appears as a cover on management cards. The Clock image fills the clock container, including fullscreen TV, independently of the cover. Both are decorative centered cover backgrounds, never stretched. Keep text in front using deliberate layers. Custom clock images activate a local dark foreground palette and minimum text-panel scrims; cover captions have a scrim. The rest of the application and portaled dialogs continue to follow the selected app theme.

Use IndexedDB Blobs and small JSON references instead of file Base64 in localStorage. Temporary file previews must release object URLs; cancelled form drafts must not persist blobs. Failed image loads fall back to normal theme surfaces and show recovery guidance in the editor. Keep background changes out of countdown state and retain existing editor permissions.

## Responsive Clock and operational dashboard

The Clock uses native layout with an inline-size container named `tournament-clock`. Use the `--clock-*-size` tokens for typography. Embedded metrics are compact and fullscreen tokens increase Level, Blinds, Ante and countdown sizes. Keep the header compact and wrap long titles. Show GTD and Starting Stack as fixed configuration. Apply Buy-in visibility to runtime metrics and the calculated payout panel.

Use one column below 640px of Clock content width, a timer above two supporting panels from 640px, and three panels from 980px. Fullscreen uses the dynamic viewport and keeps the operator bar outside the main scrolling region. Dynamic TOP rows have keyboard-accessible internal scrolling. Allow content to grow or scroll under high zoom. Avoid fixed design canvases and application scaling transforms.

Dashboard density is defined by the shared sizing tokens in `src/index.css`. Compact desktop values apply from 1024px with hover and a fine pointer. Use 20px page/section spacing, 12px component gaps, 16px card padding and 13px labels. Body text remains 14px and helper text 12px. Keep mobile/touch controls and TV controls at 44px. Let table wrappers scroll horizontally and receive keyboard focus. Fields and grid children must shrink within their parent. Preserve semantic themes and the local dark palette for Clock backgrounds. Screenshot and browser-interaction validation at the documented viewport matrix remains pending.
