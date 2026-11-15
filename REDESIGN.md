# Cafe Poker UI/UX redesign handoff

Implemented in the existing React 19 / TypeScript / Tailwind / Vite application. React Router, Zustand, React Hook Form/Zod, Recharts, Sonner and Lucide remain in place; no dependency or framework migration.

## Delivered

- Unified navy/charcoal surfaces, emerald primary actions with dark foregrounds, restrained gold details, Inter typography, 4px spacing rhythm, 10px controls and 16px cards. Research and specifications: [MASTER.md](design-system/cafe-poker/MASTER.md).
- Narrower sidebar with explicit active states, responsive mobile drawer, keyboard focus containment, skip link, Vietnamese breadcrumbs, and native account/role disclosures.
- Dashboard: readable metrics, quieter chart presentation, current tournament, approval controls, recent receipts, and member rankings.
- POS: scrollable category tabs, wider catalog, native named add-product buttons, separate edit controls, desktop sticky checkout, stacked mobile checkout, larger quantity/payment controls, and labelled customer inputs.
- Tournament clock: uncluttered large countdown, mobile-first clock placement, Vietnamese display labels, existing break/stage/participant/prize panels and operator controls, and fullscreen styling.
- Accounts, permissions, points/approval history, member portal, rankings, shifts/closing, reporting, tournament/structure editors, profile and login share the same form, table, surface, typography and dialog styling.
- Native dialogs provide modal focus containment, Escape, background inertness, focus restoration and nested top-layer handling. Input validation messages are connected to fields.

## Preservation

The initial UI redesign preserved all 14 checked store/type/fixture/routing files. Later Tournament Statistics and Tournament Management requests authorize tournament store/type and runtime changes; the render verifier checks the remaining 12 unrelated files against their original fingerprints. Dedicated tests cover statistics and timestamp-based clock controls. The latest follow-up below supersedes earlier language, denominator and registration-display-only behavior.

No APIs were replaced. Inspection found a client-side demo backed by localStorage and fixtures, without a backend API integration. Existing demo authentication, role-switching, fixed dashboard dates and illustrative chart data remain.

## Initial redesign validation (historical)

| Check | Result |
| --- | --- |
| `npm.cmd run build` | PASS: TypeScript project build and Vite production build |
| `npm.cmd run lint` | Exit 0; warnings remain; see lint-results.txt |
| `node scripts/verify-ui.mjs` | PASS: 26 server-render route/scenario checks |
| Preservation fingerprints | PASS: 14 files unchanged |
| Theme contrast calculations | PASS: six principal text/background pairs, all above 4.5:1 |

Server render scenarios cover 15 admin routes, three cashier routes, four player/access-denied views, and four empty-data views. They use isolated in-memory storage and do not read or mutate browser storage. The original package has no test script; the added render verifier runs with existing dependencies.

Measured contrast: main text 15.34:1, secondary 8.12:1, muted text on raised surface 6.80:1, primary button 8.13:1, gold text 8.78:1, secondary receipt text 7.58:1. These are token checks, not a full browser accessibility audit.

## Initial redesign limits (historical; see latest follow-ups below)

- Browser screenshots and interaction tests could not be completed. Browser automation reported its host unavailable; native Chrome inspection then stopped because computer use could not determine the current browser URL with enough confidence to enforce policy. No visual pass is claimed.
- Manually check 375px, 768px, 1024px and 1440px widths, keyboard drawer/menu/dialog flows, nested receipt dialogs, printing, both payment paths, shift closing, approval actions and fullscreen clock controls.
- Existing lint warnings include unused declarations, form-effect dependencies and tournament-clock hook warnings. The timing implementation was deliberately preserved.
- Vite reports the existing large bundle warning (about 1.04 MB minified JS). No code-splitting or dependency changes were introduced.
- This redesign does not make the existing demo authentication or fixture-based reports production-ready.

## Files edited

- `src/App.tsx`
- `src/index.css`
- `tailwind.config.js`
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Breadcrumbs.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/StatsCard.tsx`
- `src/components/ui/Input.tsx`
- `src/components/ui/Select.tsx`
- `src/components/ui/Tabs.tsx`
- `src/components/ui/Badge.tsx`
- `src/components/ui/Modal.tsx`
- `src/features/accounts/AccountFormModal.tsx`
- `src/features/accounts/AccountListPage.tsx`
- `src/features/auth/ChangePasswordModal.tsx`
- `src/features/auth/LoginPage.tsx`
- `src/features/auth/ProfilePage.tsx`
- `src/features/dashboard/AdminDashboard.tsx`
- `src/features/dashboard/PlayerDashboard.tsx`
- `src/features/permissions/RoleMatrixPage.tsx`
- `src/features/player-points/LeaderboardView.tsx`
- `src/features/player-points/PointAdjustmentModal.tsx`
- `src/features/player-points/PointsManagementPage.tsx`
- `src/features/poker-tours/BlindStructureEditor.tsx`
- `src/features/poker-tours/BlindStructurePage.tsx`
- `src/features/poker-tours/TourFormModal.tsx`
- `src/features/poker-tours/TourListPage.tsx`
- `src/features/poker-tours/TournamentClockPage.tsx`
- `src/features/pos/CafePosPage.tsx`
- `src/features/pos/OrderHistoryModal.tsx`
- `src/features/pos/ProductManagementModal.tsx`
- `src/features/reports/RevenueReportPage.tsx`
- `src/features/shifts/ActiveShiftPage.tsx`
- `src/features/shifts/CloseShiftModal.tsx`
- `src/features/shifts/OpenShiftModal.tsx`
- `src/features/shifts/ShiftListPage.tsx`

## Added verification and documentation

- `scripts/verify-ui.mjs`
- `design-system/cafe-poker/MASTER.md`
- `design-system/cafe-poker/preserved-files.json`
- `design-system/cafe-poker/lint-results.txt`
- `REDESIGN.md`

Production output in `dist/` and the TypeScript incremental build cache were regenerated by the executed build. No changes were made outside D:/PokerSystem.


## Follow-up: light/dark switching

Added a sun/moon toggle in the application header, login screen and tournament clock. The selected mode is saved as `poker_cafe_theme`, restored before first paint and synchronized across open tabs. Storage failures leave the current-session toggle usable. Vietnamese labels announce the destination mode.

Light mode uses white cards, pale slate canvas, dark text and darker status accents. Shared components, remaining screens, native dialogs, notifications and charts now use semantic theme colors. Receipt paper and image overlays keep their fixed contrast colors. No business stores, fixtures, types, authentication rules or routes changed.

New files: `src/utils/theme.ts`, `src/components/ui/ThemeToggle.tsx`, `scripts/verify-theme.mjs`. Updated `index.html`, application/theme wiring, Tailwind/CSS tokens, component and feature presentation classes, chart presentation and this documentation. `ProtectedRoute.tsx` and `ReceiptModal.tsx` retain their source unchanged.

Executed: production build/type checks passed; lint exited 0 with existing warnings; 26 route render checks and all 14 preservation fingerprints passed. `node scripts/verify-theme.mjs` passed initialization, persistence, invalid/blocked storage handling, change notification and 48 light/dark text contrast checks. These checks use isolated in-memory fixtures, not browser storage. Browser visual verification remains outstanding.

## Follow-up: screenshot readability fixes

The screenshots exposed a gap in the previous validation: CSS variables alone were correct, but the existing dev server on port 5173 was compiling against an old Tailwind configuration. Direct inspection of its served CSS found `bg-surface` still fixed to rgb(17 24 39), with `bg-field`, `border-line` and `text-muted` missing. This caused dark panels with dark light-mode text, unstyled gray native inputs and default white borders across several pages and dialogs.

Fixed the shared compilation path: `postcss.config.js` now imports and passes the actual Tailwind config object; `vite.config.ts` imports that PostCSS config as a watched dependency. Added `postcss.config.d.ts` for the typed Vite import. Vite reloaded the running server automatically, and live CSS at 5173 now uses the expected theme variables. Changes to either config are tracked by Vite.

Readability refinements:

- Shared form labels are 14px with more spacing; shared fields have solid theme backgrounds.
- Tournament cards allow two title lines, larger descriptions and information values, spaced details on a distinct field surface, and wrapping actions. Three columns begin at xl to avoid narrow cards beside the desktop sidebar.
- Blind structure presets and duration settings use consistent inset surfaces; table content is larger and scrolls horizontally on narrow screens; footer actions can wrap.
- Break rows, selected permission roles and POS category counters use theme-aware status tints rather than deep fixed colors.

Validation executed: `npm.cmd run build` passed; lint exited 0 (63 warnings, zero errors); all 26 route renders and 14 preservation fingerprints passed; theme initialization/persistence checks and 48 text contrast pairs passed.

New `scripts/verify-theme-css.mjs` checks emitted production CSS, optionally live dev CSS, and the Vite configuration dependency graph. Executed `node scripts/verify-theme-css.mjs --dev=http://127.0.0.1:5173`: passed 11 generated utilities and six light-mode overrides in both production and live CSS, plus both watched config dependencies. This specifically detects the failure missed by the earlier token-only tests.

Browser automation still reports its host unavailable, so no new screenshot or browser interaction pass is claimed. Reload the existing 5173 page to see the corrected assets.


## Follow-up: Tournament Statistics

The user explicitly requested a domain enhancement after the visual redesign. Statistics are now persisted independently of participant chip allocations. Use **Thống kê & lịch sử** on a tournament card or **Chỉnh sửa thống kê** on the clock. Admin and Cashier roles can edit; other roles can inspect statistics/history. Vietnamese labels and the existing light/dark design tokens are retained.

### Definitions and accounting

- `totalStack`: all chips issued into circulation. Eliminating a player or redistributing tracked stacks does not reduce it.
- `entries`: initial entries plus re-entries.
- `uniquePlayers`: distinct people; re-entries and re-buys do not increment it.
- `playersRemaining`: active players. Display is **remaining / total entries**, explicitly labelled in the UI.
- Average Stack is computed from `totalStack / playersRemaining`, never independently editable. With no players remaining the UI shows a dash and the calculation safely returns zero.

| Operation | Total Stack | Entries | Unique Players | Remaining |
| --- | --- | --- | --- | --- |
| Buy-in | +issued chips | +1 | +1 | +1 |
| Re-entry after elimination | +issued chips | +1 | unchanged | +1 |
| Re-buy in an active entry | +issued chips | unchanged | unchanged | unchanged |
| Add-on in an active entry | +issued chips | unchanged | unchanged | unchanged |
| Elimination | unchanged | unchanged | unchanged | -1 |
| Player chip allocation edit | unchanged | unchanged | unchanged | unchanged |

New entries create participant records. Re-entry keeps the old eliminated record and creates a new entry for the same player ID. Re-buy/Add-on credit the active entry. Final standings deduplicate player IDs so re-entries do not generate duplicate achievement rewards. The member portal prefers the current active entry over an old eliminated one.

### Validation and audit

- Store-level role checks enforce Admin/Cashier access for corrections, chip issuance, eliminations and chip allocation edits.
- Inputs must be safe non-negative integers, and issuance must be strictly positive. Unique players cannot exceed entries; remaining cannot exceed unique players or the active-player limit. Known entry/player records and allocated chips set reconciliation lower bounds.
- Issuance checks the actual player identity and active/eliminated entry state. Duplicate initial buy-ins and re-entries for an active player are rejected; re-buys/add-ons require an active entry. Finished/cancelled events cannot issue new chips.
- Manual reconciliation requires a reason. It can explicitly correct an overstated Total Stack downward, without going below tracked chip allocations. Automatic elimination never lowers Total Stack.
- Every successful operation records actor, role, ISO timestamp, reason, before/after statistics, and applicable player/chip details. Failed validation and failed persistence leave both state and history unchanged. Forms detect a changed in-memory history revision to avoid overwriting intervening edits in the same session.
- Participant stack edits commit on blur/Enter rather than writing an audit event on every keystroke.

### Existing data

Older tournaments have no issuance ledger. Migration flags them **cần đối soát**. Entries start from the greater of the old registration count and known participant records. Unique-player estimates deduct known repeated player IDs. Total Stack is initially the maximum of entries × starting chips, recorded initial chips (including eliminated entries), and recorded current chips. Remaining uses known active participant records. These are explicitly labelled estimates until an operator reconciles them. No historical re-buy/add-on data is invented.

Statistics and history are saved alongside the tournament in the existing localStorage model. This remains browser-local demo persistence, without backend synchronization or a server audit service.

### Executed checks

- `npm.cmd run build`: passed TypeScript and production build; existing bundle-size warning remains.
- `npm.cmd run lint`: exit 0, 63 warnings and zero errors; existing clock hook warnings remain.
- `node scripts/verify-tournament-statistics.mjs`: passed nine regression groups covering creation, every issuance category, elimination conservation, entry/unique counts, invalid inputs, duplicate events, explicit corrections, stale edits, Admin/Cashier/Player access, storage failure, persisted reload, legacy migration, zero remaining and unique final rewards.
- The same tests checked running-clock timestamp preservation during statistics edits, pause/resume remaining time, next/previous stage, reset and automatic transition to break.
- `node scripts/verify-ui.mjs`: 26 route/scenario checks and 12 unrelated original fingerprints passed.
- Theme persistence/contrast checks and emitted/live CSS checks passed. Browser screenshot/interaction verification remains unavailable; no visual pass is claimed.

### Files for this enhancement

- `src/types/tournament.ts`
- `src/stores/tournamentStore.ts`
- `src/utils/tournamentStatistics.ts` (new)
- `src/features/poker-tours/TournamentStatisticsModal.tsx` (new)
- `src/features/poker-tours/TournamentClockPage.tsx`
- `src/features/poker-tours/TourListPage.tsx`
- `src/features/poker-tours/TourFormModal.tsx`
- `src/features/dashboard/AdminDashboard.tsx`
- `src/features/dashboard/PlayerDashboard.tsx`
- `scripts/verify-tournament-statistics.mjs` (new)
- `scripts/verify-ui.mjs`
- `design-system/cafe-poker/MASTER.md`
- `design-system/cafe-poker/lint-results.txt`
- `REDESIGN.md`


## Follow-up: English Tournament Clock and registration deadline

Per the user's clarified scope, **only Tournament Clock and its related dialogs** now use English. Other application screens and the default statistics dialog opened from the Vietnamese tournament list remain Vietnamese. Stored tournament/player names and user-authored audit notes are preserved. English clock copy covers labels, operator controls, tooltips, theme toggle, player stacks, statistic fields/history, validation messages, registration settings and reset/end confirmations. English number formatting uses decimal points and comma thousands separators; VND amounts retain their currency.

The clock displays a dedicated line below the current stage, for example **Reg End at Lv 7 — after Break 2**. Admin/Cashier can use **Edit** beside that line to select the deadline separately for each tournament. It is also available in the existing create/edit tournament form as **Kết thúc đăng ký tại level (Reg End)**.

The persisted `registrationEndStageId` points to a LEVEL stage. The deadline is the **start of that level**. To keep registration open throughout a break, choose the immediately following level; option labels identify the preceding break automatically. Registration remains open during the break and shows **Registration Closed** once the selected level starts. Created tournaments do not prematurely show closure. Unconfigured legacy tournaments show **Reg End: Not set**. If the chosen stage is removed, its invalid setting is cleared on save; the form requests reselection before submission when applicable.

This is display/configuration metadata: it does not block Buy-ins/Re-entries or change the timestamp-based countdown. Existing entry accounting and tournament controls are preserved. The registration settings action validates role, stage type/existence and storage success before updating state.

Files added: `src/utils/tournamentRegistration.ts`, `src/utils/tournamentClockLocale.ts`, `src/features/poker-tours/RegistrationEndModal.tsx`, `scripts/verify-clock-registration.mjs`. Updated clock/statistics UI, tournament type/store/form, shared Modal/ConfirmDialog/ThemeToggle locale props, verification expectations and regression tests. Shared controls default to Vietnamese.

Validation: production build/type checks passed; statistics regression suite passed all nine groups; route suite passed all 26 cases and 12 unrelated original fingerprints; production and live CSS checks passed. New clock/registration checks cover valid levels, after-break labels and boundary semantics, Admin/Cashier versus Player access, persistence, failed storage, stage removal, English clock/break/statistics/history/dialog content, store error translations and the Vietnamese shared-dialog default. Dialog content checks use a test-only SSR wrapper because native portal/dialog interaction requires a browser. Browser visual/interaction verification remains outstanding.


## Follow-up: independent Tour and Clock backgrounds

Added two independent, per-tournament configurations in the Tour editor with the exact labels **Ảnh nền giải đấu** and **Ảnh nền đồng hồ**.

- **Tour Background** supplies the cover area on the tournament management card and its editor preview.
- **Clock Background** supplies a separate, full-size layer behind the clock header, countdown, blinds, break schedule, registration status and tournament statistics, including fullscreen TV mode.
- Each field supports a local JPG/PNG/WebP file or an HTTPS image URL, preview, replacement, removal, reset to the theme's default plain surface, and its own dark overlay (0–95%, default 65%). Backgrounds use centered `background-size: cover`; image proportions are preserved and edges may crop.
- The clock uses local dark foreground colors and translucent text-panel scrims when a custom image is visible, so a light application theme or reduced overlay does not turn clock text dark over an image. Cover captions also have their own scrim. Without a custom image the existing light/dark clock appearance remains.

### Storage and save behavior

`Tournament.tourBackground` and `Tournament.clockBackground` are separate tagged references (`default`, `none`, `url`, `upload`) with independent overlay values. HTTPS URLs are small string references. Uploaded binary files are held in the `poker_cafe_backgrounds` IndexedDB database; localStorage contains only asset IDs, filenames and settings, never file Base64 or blob URLs.

Selected files are kept as form drafts and temporary object URLs until the user saves the tournament. Cancelling does not write new image blobs. Save writes uploaded blobs first, then commits their tournament references. A failed tournament save cleans up newly staged uploads. Superseded assets are removed after the reference commit, provided neither background in any remaining tournament still uses the asset. Tournament deletion follows the same reference check. Temporary object URLs are revoked on replacement/unmount.

Uploads are limited to 8 MB and checked for MIME type, JPG/PNG/WebP signatures, successful browser image decoding and a 50-megapixel size ceiling. HTTPS URLs disallow credentials and are limited to 4096 characters; the image must load successfully before application. Unavailable URLs, missing local assets and storage failures fall back to the normal theme surface; the editor explains the failure and offers replacement. The URL editor has an explicit Apply action before Save.

Existing tournaments need no migration; absent background fields mean default surfaces. The image hook resolves references from the selected tournament, ignores obsolete asynchronous results and filters results by source key to avoid displaying a different tournament's image. Overlay edits do not reload the image. Existing `TOUR_MANAGE`/Admin editor permissions are preserved and rechecked in store actions; no new clock-operation permissions were granted. Countdown effects, timer fields, clock progression and statistics actions are unchanged.

### Validation executed

- `node scripts/verify-backgrounds.mjs`: passed HTTPS/format/size/overlay validation, image-load failure, binary storage adapter success/failure, independent asset IDs, reference reload, remove/reset isolation, permission checks, timer/statistics preservation, cover sizing/overlay markup and safe reference-aware deletion.
- The IndexedDB and Image APIs in that script are **test doubles**. It verifies the storage adapter and state contracts, not actual browser persistence or image decoding.
- Production TypeScript/Vite build passed; lint exited 0 with 63 existing warnings and zero errors.
- Existing 26 route renders, 12 unrelated original fingerprints, nine tournament-statistics regression groups and clock/registration checks passed. Production/live semantic CSS checks passed.
- Browser automation still reported its access host unavailable. Real local-file selection, cross-origin URL loading, preview/replace/cancel, switching tournaments and fullscreen TV screenshots require browser verification; no visual pass is claimed.

Uploaded assets remain local to this browser profile/origin. They are not synchronized to another computer/TV or browser profile by the existing demo application. Use an HTTPS image URL for an image that must be independently available on another display. Clearing site data removes local uploads.

### Files

New: `src/utils/tournamentBackgrounds.ts`, `src/hooks/useBackgroundImage.ts`, `src/components/ui/TournamentBackground.tsx`, `src/features/poker-tours/BackgroundEditor.tsx`, `src/features/poker-tours/TournamentCover.tsx`, `scripts/verify-backgrounds.mjs`.

Updated: `src/types/tournament.ts`, `src/stores/tournamentStore.ts`, `src/features/poker-tours/TourFormModal.tsx`, `src/features/poker-tours/TourListPage.tsx`, `src/features/poker-tours/TournamentClockPage.tsx`, `src/index.css`, design-system specifications and validation documentation.

## Follow-up: Vietnamese Tournament selection and independent runtime

This follow-up implements the latest Tournament Management requirements and supersedes the earlier English clock and informational-only registration settings.

### Delivered behavior

- Navigation, page title and action links now say **Giải đấu**. The display, operator controls, participant/statistics dialogs and Buy-in settings use Vietnamese. User-authored names and historic audit notes are preserved.
- Removed start-date/time scheduling controls and schedule summaries from the editor, management cards and member portal. No end-time scheduling input remains. Legacy `scheduledStartTime` metadata is optional and retained for old data; new form submissions do not set it. Countdown, level durations, break durations, structure, statistics and both background editors remain.
- Admin selects an existing tournament using **Chọn giải đấu**. The route identifies the selected record; `poker_cafe_selected_tournament` restores the selection when opening the generic display route after refresh. Selection does not create, update or reset tournament records. Changing tournaments unmounts old dialogs and drafts.
- All running tournaments advance independently, including those not currently displayed. A shared, reference-counted scheduler owns one runtime interval per application instance. Timestamp arithmetic carries elapsed time across multiple levels/breaks after delayed tabs or reloads; paused tournaments retain their remaining time. Repeated ticks at the same timestamp do not apply duplicate transitions. Completion is idempotent. Sound mute is respected by both automatic and operator-triggered notifications, and is retained when changing the displayed tournament within the session.
- Admin configures **Tự động đóng Buy-in sau kỳ nghỉ** for each tournament, or uses **Đóng Buy-in** manually. Buy-in remains open during the selected break and closes exactly when it finishes. Closure is persisted per record and does not reopen on previous-stage/reset controls or selection changes. Legacy registration level references remain compatible, including deriving the preceding break when available.
- Closed Buy-in rejects initial Buy-ins, Re-entries and Re-buys. Permitted statistics corrections, player allocations, eliminations and Add-ons remain available to Admin/Cashier; completed/cancelled tournaments still reject chip issuance. Buy-in settings/manual closure are Admin-only. Existing route, editor and operator permissions remain.
- Remaining players now display **remaining / unique players**, excluding repeat entries from the denominator. **Lượt tham gia** retains initial entries plus re-entries. Total Stack conservation, calculated Average Stack, validation and statistics history remain in place.
- Existing independent Tour/Clock backgrounds are reused unchanged: JPG/PNG/WebP uploads or HTTPS URLs, preview/replace/remove/default, separate overlays and centered cover sizing. The selected tournament supplies its own clock background and statistics, including fullscreen mode. Stale image resolutions cannot replace a newer selection.

### Validation

- `npm.cmd run build`: TypeScript and Vite production build passed. Existing large-bundle warning remains (about 1.08 MB minified JS).
- `npm.cmd run lint`: exit 0, 55 warnings, zero errors; details in `design-system/cafe-poker/lint-results.txt`.
- `node scripts/verify-clock-registration.mjs`: passed rapid selection isolation, independent pause/running states and images, persisted selection/fresh-store reload, exact break boundary, elapsed overflow across multiple stages and completion, automatic/manual Buy-in closure, Admin/Cashier checks, corrections after closure, idempotent ticks and shared scheduler cleanup. Server rendering checks Vietnamese display/selector and retained background fields without scheduling inputs.
- `node scripts/verify-tournament-statistics.mjs`: all nine regression groups passed, including conservation, history, failed storage, permissions and clock control preservation.
- `node scripts/verify-ui.mjs`: all 26 route/scenario renders and 12 unrelated original file fingerprints passed.
- `node scripts/verify-backgrounds.mjs`: all validation/storage/reference/render groups passed. IndexedDB/Image remain test doubles in this script.
- Theme initialization/persistence and 48 semantic contrast pairs passed. Production and live port-5173 CSS checks passed for 11 utilities, six overrides and watched config dependencies.

### Limitations

No browser visual or interaction pass is claimed. Responsive/fullscreen TV layout, native file selection, actual IndexedDB image decoding and rapid interactive dropdown changes still need browser QA. Existing browser automation was unavailable in this environment.

This remains a localStorage/IndexedDB demo without a storage backend or synchronization service. Local uploads are limited to the browser profile/origin and disappear with cleared site data; use HTTPS URLs for images available on another TV/computer. Runtime catches up from timestamps when the app next runs; there is no background server process while all pages are closed. The scheduler prevents duplication within one application instance; concurrent editing across multiple tabs/devices is not transactionally coordinated. Permissions retain the existing demo authentication model.

### Files changed in this follow-up

New: `src/utils/tournamentRuntime.ts`, `src/hooks/useTournamentRuntime.ts`.

Updated: `src/App.tsx`, `src/types/tournament.ts`, `src/stores/tournamentStore.ts`, `src/utils/tournamentRegistration.ts`, `src/utils/audio.ts`, `src/components/layout/Sidebar.tsx`, `src/components/layout/Breadcrumbs.tsx`, `src/components/layout/Header.tsx`, `src/features/poker-tours/TourFormModal.tsx`, `src/features/poker-tours/TourListPage.tsx`, `src/features/poker-tours/BlindStructureEditor.tsx`, `src/features/poker-tours/TournamentClockPage.tsx`, `src/features/poker-tours/RegistrationEndModal.tsx`, `src/features/poker-tours/TournamentStatisticsModal.tsx`, `src/features/dashboard/AdminDashboard.tsx`, `src/features/dashboard/PlayerDashboard.tsx`, `scripts/verify-clock-registration.mjs`, `scripts/verify-tournament-statistics.mjs`, `scripts/verify-ui.mjs`, `design-system/cafe-poker/MASTER.md`, `design-system/cafe-poker/lint-results.txt`, `REDESIGN.md`. Production `dist/` output and TypeScript build cache were regenerated.

## Follow-up: Tournament selection overview

The **Giải đấu** route now opens with an overview instead of immediately rendering the fullscreen-style clock. Admin first selects a tournament, then sees its cover, current stage, remaining time, Buy-in state, registration-close setting, player/chip statistics and expandable blind/break structure. **Mở đồng hồ giải đấu** enters the live display for that same tournament; **Quay lại thông số / chọn giải** returns to the overview. This is screen navigation only, so no state, countdown or selected background is reset. The overview has a labelled native select, responsive metric grid, accessible structure table and a statistics/history action for the existing roles.

New: `src/features/poker-tours/TournamentOverview.tsx`. Updated: `src/features/poker-tours/TournamentClockPage.tsx`, `scripts/verify-clock-registration.mjs`, `REDESIGN.md`.

## Follow-up: Clock in a separate tab

**Mở đồng hồ giải đấu** now opens `/tours/clock/:id?view=clock` in a new browser tab with `target="_blank"` and `rel="noopener noreferrer"`. The original management tab remains on the overview. The tab URL identifies the tournament directly, so the live clock loads the correct independent timer, statistics, Buy-in state and Clock Background. Returning from the clock URL goes to its overview in that same tab. The regression test verifies both the new-tab link and live-display URL.

## Follow-up: Reset phiên giải và thống kê theo Buy-in

- Admin có nút **Reset tất cả thông số** trên phần thông số của từng giải. Hộp xác nhận nêu rõ tên giải và phạm vi tác động. Reset xóa người chơi, Entries, người chơi duy nhất, còn lại, chip tính toán, lịch sử thống kê và xếp hạng của **phiên hiện tại**; đồng hồ về Level đầu, trạng thái tạm dừng và Buy-in mở. Tên/mô tả, Starting Stack, cấu trúc blind/break, cấu hình tự đóng Buy-in và hai ảnh nền vẫn giữ nguyên. Cashier/Player bị chặn cả ở giao diện lẫn store action.
- Tổng chip của phiên được tính cố định bằng **Entries × Starting Stack**; chip trung bình là tổng chip chia người còn lại (0 nếu không còn người). Mẫu chỉnh sửa chỉ cho Admin/Cashier sửa Entries, người chơi duy nhất và người còn lại; Starting Stack, tổng chip và trung bình là trường chỉ đọc, cập nhật ngay khi nhập. Kiểm tra số nguyên không âm, Entries ≥ người chơi duy nhất và còn lại ≤ người chơi duy nhất. Hiển thị còn lại là **còn lại / người chơi duy nhất**, không dùng Entries làm mẫu số.
- Lịch sử và phân bổ chip Re-buy/Add-on cũ vẫn được giữ, không bị xóa hay ghi đè ngầm bởi công thức phiên. Khi mở phiên thống kê của giải có các giao dịch này, giao diện cảnh báo rằng tổng chip tóm tắt đang dùng công thức mới.
- Trên tab đồng hồ, trước khi Buy-in đóng chỉ hiển thị timer, level/blind/ante, thông tin break kế tiếp, trạng thái/mốc Buy-in và điều khiển. Entries, người chơi duy nhất, còn lại, tổng chip và trung bình bị ẩn. Các chỉ số này hiện ngay khi Break đã cấu hình kết thúc hoặc Admin đóng Buy-in thủ công. Quy tắc theo từng giải nên việc đổi giải/tab không ảnh hưởng giải khác.

Kiểm tra đã chạy: `npm.cmd run build` pass. `node scripts/verify-tournament-statistics.mjs` pass 10 nhóm, bao gồm công thức, validation, lịch sử Re-buy/Add-on, quyền Admin/Cashier, reset phiên và giữ nguyên cấu hình. `node scripts/verify-clock-registration.mjs` pass, gồm server-render trạng thái ẩn/hiện chỉ số Buy-in mở/đóng cùng các kiểm tra chọn giải/runtime có sẵn. Chưa có browser QA trực tiếp; vẫn cần kiểm tra tương tác hộp xác nhận, responsive và fullscreen thực tế.

Tệp cập nhật: `src/stores/tournamentStore.ts`, `src/types/tournament.ts`, `src/utils/tournamentStatistics.ts`, `src/features/poker-tours/TournamentOverview.tsx`, `src/features/poker-tours/TournamentStatisticsModal.tsx`, `src/features/poker-tours/TournamentClockPage.tsx`, `scripts/verify-tournament-statistics.mjs`, `scripts/verify-clock-registration.mjs`, `design-system/cafe-poker/MASTER.md`, `REDESIGN.md`.

## Follow-up: English poker metrics and quick entries

- Tournament Clock, Tournament overview/cards and Tournament Statistics now use the requested English poker metric vocabulary: **Players Remaining**, **Unique Players**, **Total Entries**, **Total Stack**, **Average Stack**, **Starting Stack**, **Blinds**, **Next Level**, **Next Break**, prize labels and **Buy-in Open / Buy-in Closed**. Application navigation and unrelated management copy remain Vietnamese.
- Before Buy-in closes, all session metrics remain hidden on the Clock. After close they appear automatically as before. When the selected closing Break has finished, its Buy-in milestone is no longer rendered; **Buy-in Closed** stays visible and a later **Next Break** remains visible if present.
- The statistics correction form has unsaved quick controls: **+1 Entry**, **+5 Entries**, **+10 Entries**, **New Player (+1 Entry, +1 Unique)** and **Re-entry (+1 Entry)**. These alter only the local draft; Starting Stack stays read-only, Total Stack/Average Stack recalculate immediately, and normal validation/audit/permission checks apply only on Save.

## Follow-up: Optional statistics note

Statistics corrections no longer require a reason or note. The correction form omits that field; saving a blank note records the audit label **Cập nhật thống kê** automatically, preserving the existing audit trail. Chip issuance still requires a reason because it records a separate chip operation.

## Follow-up: Prize points and Clock action cleanup

The Clock no longer shows a **Chỉnh sửa thống kê** action; statistics remain editable from the tournament-management overview for authorized roles. Its prize panel now derives a points pool directly from Entries: **2 PTS per entry**, distributed to **Top 1 / Top 2 / Top 3** at **60% / 30% / 10%**. It replaces the fixed fixture prize amounts and updates whenever saved Entries change. Example: 50 Entries = 100 PTS total, with 60 / 30 / 10 PTS payouts.

New `src/utils/tournamentPrizes.ts` provides the pure calculation. Updated `TournamentClockPage.tsx`, the statistics and clock verification scripts, design specification and this handoff. Build and the 12-group statistics suite pass; clock regression confirms the calculated Top 3 display and absence of the edit action. Browser visual QA remains outstanding.

Validation: production build passed; statistics regression now has 11 passing groups including quick draft adjustment semantics; clock/registration regression passed, including open/closed metric visibility and hiding a completed closing-break milestone while retaining later break information. Browser interaction/responsive/fullscreen QA remains outstanding.

## Follow-up: Reg End on Clock and Level terminology

- The Clock no longer renders the **Thiết lập** registration button or a **Buy-in Closed** badge. The stage area now shows one read-only, tournament-specific endpoint: **Reg End: Start of Level N**. It resolves the Level immediately after the configured automatic closing Break, while legacy `registrationEndStageId` records remain supported; an unconfigured tournament shows **Reg End: Not set**. Manual closing and automatic closing behavior are unchanged.
- Generated stage labels, blind structure controls, reset messaging and tournament fallback labels now use **Level** instead of **Vòng**. Existing user-authored stage names are left untouched.
- The Clock regression verifies both open and closed statistics visibility with the `Reg End` endpoint, confirms that no Clock setup/Buy-in-Closed UI remains, and retains the later **Next Break** check.

Validation: TypeScript/production build passed; lint exited 0 with existing warnings; clock/registration and all 12 statistics regression groups passed. Browser visual/fullscreen QA remains outstanding. Updated files: `src/utils/tournamentRegistration.ts`, `src/features/poker-tours/TournamentClockPage.tsx`, `src/features/poker-tours/TournamentOverview.tsx`, `src/features/poker-tours/TourListPage.tsx`, `src/features/poker-tours/BlindStructureEditor.tsx`, `src/features/poker-tours/BlindStructurePage.tsx`, `src/features/dashboard/AdminDashboard.tsx`, `scripts/verify-clock-registration.mjs`, the design specification and this handoff.

## Follow-up: Separate Tournament Templates and Sessions

### Behavior

- **Mẫu giải đấu** holds only permanent configuration. The editor has no participant picker and never seeds demo statistics. Admin uses **Tạo phiên mới** on a template to create a separately identified session with zero counts, no participants/history, first playable Level paused and Buy-in open. One template can produce any number of sessions.
- **Các phiên giải & lịch sử** lists each session separately with its creation time, ID and state. Session switching and separate-tab Clock URLs use the session ID. Each session has an explicit `templateId` and a snapshot of the selected template. Starting Stack, structure, backgrounds, closing milestone and prize configuration are therefore stable for existing sessions even after a template is edited or removed. Edits apply to future sessions.
- Admin/Cashier retain draft statistics editing and quick +1/+5/+10 Entry actions. Only Save commits the correction/audit. Total Stack remains Total Entries × snapshot Starting Stack; Average Stack safely returns 0 for zero remaining. Remaining displays remaining / unique players. New sessions reject Re-buy/Add-on independent issuance and require exactly one Starting Stack per Buy-in/Re-entry. Migrated sessions keep their prior issuance records/compatibility behavior.
- Admin-confirmed reset saves a separate archived runtime copy before clearing the selected session, resets to the first playable Level paused, and reopens Buy-in. Templates and other sessions are untouched. Template deletion preserves sessions and referenced uploaded backgrounds.
- Tournament Break labels now use English Poker terminology. Clock headings are simply **Total Prize Pool**, **Top 1**, **Top 2**, **Top 3**; the actual 2 PTS/Entry and 60/30/10 arithmetic is unchanged. The Clock continues to hide session metrics before Buy-in closes and reveal them after automatic/manual closure.

### Storage and migration

Two separate Zustand stores/types share a versioned persistence envelope, `poker_cafe_tournament_repository_v2`, so template/session lists are committed atomically in one localStorage write. Persisted sessions contain runtime fields plus a configuration snapshot; the `tournaments` property is a composed read model for Clock/dashboard compatibility. The former `tournamentStore.ts` is only an import bridge to the session store.

On first load, every record already saved under `poker_cafe_tournaments` becomes one template and one linked session; the original ID is retained for the session and template relationship. Participant allocations, runtime, timestamps, statistics/audit and ranks remain available. The legacy key is retained byte-for-byte as a backup and is no longer written by the application. Migration writes the new envelope only after reading/validating the legacy records. Invalid JSON/record shapes or failed persistence leave original storage untouched and show a management error instead of repopulating demo runtime. Fresh installs use fixture configuration only and start with no sessions. Creating another session from any migrated template always starts empty.

Storage events refresh confirmed session statistics in another same-origin Clock tab. This remains localStorage/IndexedDB demo persistence without backend synchronization or cross-tab transactions; simultaneous writes can still race. Local uploads stay browser/origin-specific. Asset cleanup conservatively retains historical session references. Browser interaction, actual IndexedDB decoding, responsive layout and fullscreen QA have not been executed for this refactor.

### Files

New: `src/types/tournamentTemplate.ts`, `src/types/tournamentSession.ts`, `src/stores/tournamentTemplateStore.ts`, `src/stores/tournamentSessionStore.ts`, `src/utils/tournamentRepository.ts`, `scripts/verify-tournament-sessions.mjs`.

Updated: `src/types/tournament.ts`, `src/stores/tournamentStore.ts`, `src/utils/tournamentRuntime.ts`, `src/utils/tournamentStatistics.ts`, `src/utils/tournamentRegistration.ts`, `src/features/poker-tours/TourListPage.tsx`, `TourFormModal.tsx`, `TournamentOverview.tsx`, `TournamentClockPage.tsx`, `TournamentStatisticsModal.tsx`, `BlindStructureEditor.tsx`, `BlindStructurePage.tsx`, `RegistrationEndModal.tsx`, `src/features/dashboard/AdminDashboard.tsx`, existing statistics/clock/background/UI verification scripts, design specification and this handoff. Production output and TypeScript build cache are regenerated by the build.

### Executed validation

- `npm.cmd run build`: TypeScript project checks and production build passed. Existing large-bundle warning remains (about 1.09 MB minified JS).
- `npm.cmd run lint`: exit 0, 50 existing warnings; no new store/repository warnings.
- `node scripts/verify-tournament-sessions.mjs`: passed fresh-install/template-only defaults, reusable templates, empty paused sessions, first playable Level, independent clocks/selections, draft/save semantics, validation and 600,000/40,000 calculation example, zero remaining, role checks, archived reset, frozen configuration, retained uploads, failed persistence, reload, simulated cross-tab storage events, legacy migration and malformed-data preservation.
- `node scripts/verify-tournament-statistics.mjs`: all 12 groups passed; legacy issuance is now an explicit fixture rather than a creation default.
- `node scripts/verify-clock-registration.mjs`: passed independent runtime, automatic/manual closure, selection, scheduler cleanup, saved reload, English Break/Reg End and statistics visibility checks.
- `node scripts/verify-backgrounds.mjs`: passed validation/storage adapter tests and template/session snapshot/reference checks. IndexedDB/Image remain test doubles.
- `node scripts/verify-ui.mjs`: all 26 route scenarios and 12 unrelated preservation fingerprints passed. No browser visual/interaction pass is claimed.

## Follow-up: Prize visibility and larger Level

Clock prize distribution is now rendered only when `isBuyInClosed(currentTour)` is true. Open Buy-in sessions omit the whole prize column, headings and PTS placeholders; the center panel expands into the available space. Starting Stack, current Level/Blinds, timer and Break Schedule remain visible. The elapsed-time footer moves below Starting Stack while the prize column is absent. Automatic/manual closing reveals prizes; reopening through session reset removes them. Prize calculations are unchanged.

Current Level text increases from 18/24/30px to 26/35/44px across responsive breakpoints (about 44–47%). It remains centered above the countdown with consistent line height and tabular digits. Blinds scale at 20/30/36px to keep the requested timer → Level → Blinds hierarchy.

Changed: `src/features/poker-tours/TournamentClockPage.tsx`, `scripts/verify-tournament-sessions.mjs`, `design-system/cafe-poker/MASTER.md`, `REDESIGN.md`. Regression passed for zero/nonzero Entries with open Buy-in, automatic closure, manual closure without a Level change, reopening through reset, and retained core clock labels. TypeScript/production build passed; lint exited 0 with 50 existing warnings and no Clock warnings. The existing large-bundle warning remains. Browser responsive/fullscreen visual QA remains outstanding.

## Follow-up: Buy-in Open uses masked metric values

Per the latest request, the Clock keeps the same three-panel layout before and after closure. While Buy-in is open, all prize/statistics labels remain visible with `--` instead of numbers: Starting Stack, Average Stack, Total Stack, Total Entries, Unique Players and prize payouts. Players Remaining displays `-- / --`; the Players & Chips counter also displays `--`. PTS/BB suffixes are omitted for masked values. Countdown, current Level, Blinds and Break timing remain operational. Closing Buy-in reveals real values immediately; reopening through reset masks them again. No stored statistics or prize calculations change.

Updated Clock, session regression checks, design specification and this handoff. TypeScript/production build and regression checks passed; lint exited 0 with the existing 50 warnings. Browser visual QA remains outstanding.

## Follow-up: Automatic Buy-in closure without a Clock button

Removed the Clock's manual **Đóng Buy-in** button. The existing shared timestamp scheduler closes Buy-in automatically when the session's configured closing Break finishes; the masked statistics/prize values reveal automatically through the existing Buy-in predicate. The template editor explains that no Clock action is required. An overview with no closing milestone explains how to choose **Tự động đóng Buy-in sau Break** in the template and create a session with that configuration; no arbitrary closing Break is assigned to existing sessions.

Updated `TournamentClockPage.tsx`, `TournamentOverview.tsx`, `TourFormModal.tsx`, `scripts/verify-clock-registration.mjs` and this handoff. The scheduler regression now invokes the captured interval callback immediately before/at the Break-end boundary and verifies persisted `AUTO` closure without calling the manual-close action. Regression, TypeScript/production build and lint passed (50 existing lint warnings). Browser interaction QA remains outstanding.

## Follow-up: Guaranteed Prize Pool and dynamic TOP positions

### Configuration and calculations

The Tournament Template editor now has an Admin-only **Prize Distribution** section with **Guaranteed Prize (GTD), PTS**, **Entries Threshold**, **Additional PTS per Entry**, and 1–20 ordered TOP percentage rows. Adding/removing rows renumbers ranks automatically. PTS values and percentages accept up to two decimal places; Threshold is a non-negative safe integer. Percentages must each be within 0–100 and sum to exactly 100.00%. The form shows linked field errors and a total-percentage error, disables invalid saves and revalidates in the template store. A preview-only Entries field recalculates read-only pool and payout amounts without writing any session.

The pool is `GTD + max(0, Entries − Threshold) × Additional PTS`. GTD remains constant through the threshold, with the first additional Entry included immediately. For 65 GTD / threshold 30 / additional 2, verified results are 10→65, 30→65, 31→67, 32→69, 40→85 and 50→105 PTS. A 60/30/10 distribution of 105 is 63.00 / 31.50 / 10.50 PTS; 50/25/15/5/5 is 52.50 / 26.25 / 15.75 / 5.25 / 5.25 PTS.

### Rounding and snapshots

All PTS calculations use integer hundredths (0.01 PTS) and BigInt intermediates. Each exact percentage allocation is floored, then leftover hundredths go to the largest fractional remainders; ties go to the earlier TOP. Thus displayed payouts conserve the exact pool in hundredths, including small/decimal pools. Amounts display two decimal places. Calculations reject pools beyond the safe integer hundredths range before statistics are saved.

`prizeConfiguration` is permanent template configuration, included in the existing session `templateSnapshot`. A session's saved Entries drives calculation; calculated amounts are never editable. Editing/deleting a template or resetting a session does not rewrite existing snapshot/history prize configuration. New sessions copy an explicit configuration; records without it retain the previous 2 PTS per Entry and 60/30/10 behavior. No destructive migration or storage-key change is needed. Existing legacy fixture prize fields remain preserved. New Admin forms default to the editable 65 / 30 / 2 example.

### Clock and scope

The latest request supersedes placeholder rules: before actual Buy-in closure, the Clock completely omits all prize headings/amounts and runtime statistics. Starting Stack, Level, Blinds, countdown and Break information remain visible. After closure, all configured TOP positions appear with names and calculated amounts only. The payout list uses a two-column mobile grid and bounded desktop scrolling for larger distributions. Automatic closure, session selection, backgrounds, timers and fullscreen controls are unchanged.

This implements configured prize calculations and presentation; the existing separate achievement-point approval workflow on tournament completion is unchanged. Browser visual/interaction/fullscreen QA is still outstanding; server rendering checks cannot establish real layout/scroll/focus behavior. Persistence remains browser-local with existing cross-tab transaction limitations.

### Files and checks

New: `src/types/tournamentPrizes.ts`, `src/features/poker-tours/PrizeDistributionEditor.tsx`, `src/features/poker-tours/TournamentPrizePanel.tsx`, `scripts/verify-tournament-prizes.mjs`.

Updated: `src/types/tournament.ts`, `src/types/tournamentTemplate.ts`, `src/utils/tournamentPrizes.ts`, `src/utils/tournamentRepository.ts`, `src/stores/tournamentTemplateStore.ts`, `src/stores/tournamentSessionStore.ts`, `src/features/poker-tours/TourFormModal.tsx`, `src/features/poker-tours/TournamentClockPage.tsx`, `scripts/verify-tournament-sessions.mjs`, `scripts/verify-clock-registration.mjs`, design specification and this handoff. Build regenerates production output and the TypeScript cache.

Verification passed: GTD threshold examples including Threshold+1; 3/5 payouts; exact percentage/decimal validation and rounding conservation; form/panel SSR; full Clock 5-position rendering and OPEN/CLOSED visibility; permissions, rejected/failed saves, dynamic Entries, snapshot isolation, reset archives, template deletion and reload. Existing 12 statistics groups, clock/runtime checks, background adapter checks and 26 route renders/12 preservation fingerprints passed. TypeScript/production build passed with the existing bundle-size warning. Final lint exited 0 with 50 existing warnings and no warnings in the new prize modules.

## Follow-up: Top Tour rewards and permanent FINISHED results

### Workflow

**Quản lý & Duyệt Điểm** now includes **Top Tour** and **Cộng điểm Top Tour**. The table includes request code/full ID details, Tour/session ID and date, member ID/name, TOP rank, two-decimal PTS, requester/time, status, reviewer/time/reason and actions. Text search matches Tour, session, member and request IDs; separate session and status filters are provided. Pending counts update from the shared points store.

Admin/Cashier select a FINISHED session and an available TOP from its final payout snapshot, search existing active member accounts and select an ID. Reward PTS is read-only. Submission creates PENDING only and captures session ID, template ID, rank, member ID, calculated amount and the complete final statistics/prize snapshot. PENDING/APPROVED assignments reserve a session/rank; REJECTED releases it. Admin alone can approve/reject in the store as well as UI. Review audit fields use the actual signed-in Admin, not caller-supplied names. Approval checks the frozen session snapshot and amount, records a request-linked unique transaction, updates points/tier/ranking and membership projections once. Repeated approval/rejection cannot overwrite a completed decision. Rejection requires a nonblank reason and never credits points.

### Finalization

Manual **Kết thúc giải** now opens a confirmation with Entries, Unique Players, Players Remaining, Total Prize Pool and every TOP amount, plus a permanent-lock warning. A signature detects changed statistics/audit/participants while confirmation is open and requires review again. Successful completion writes status **FINISHED** with final statistics, Average Stack, prize configuration, pool/payouts, finalization actor/time and final ranks/history. Fixed automatic 1500/900/... reward requests were removed; operators assign rewards through Top Tour instead. Finalization itself does not credit points.

FINISHED is checked in statistics corrections, chip issuance/Buy-in/Re-entry, eliminations, chip edits, full/runtime reset, start/resume and stage controls. Quick adjustment/edit forms disappear into a read-only inspector; reset is disabled. Other sessions and permanent templates remain independent. Clock/statistics/prize presentation reads frozen values. Timestamp-based automatic exhaustion of the structure still works and freezes results under the SYSTEM actor. It does not generate reward assignments. Old COMPLETED sessions are normalized to locked FINISHED results using their saved configuration and an explicit migration actor; legacy records remain in original storage.

### Persistence, compatibility and limits

The points ledger is now a single versioned localStorage envelope, `poker_cafe_points_ledger_v2`, containing requests, transactions, leaderboard and member-stat projections. A successful approval publishes all four in one `setItem`; persistence failure leaves both points state and auth member projections unchanged. Member statistics are projected back into authStore in memory and restored from the ledger on reload. The old three points keys are read as initial data if no envelope exists, retained unchanged, and superseded only after a successful operation writes the new envelope. Existing IDs/history/approved balances remain intact. UUID request/transaction IDs replace timestamp-only IDs.

Existing manual/event/penalty requests retain the pending approval process. New Tour awards must use Top Tour instead of unrestricted manual amounts. Old Tour request history is preserved; pending Tour requests without frozen snapshots cannot be approved automatically and must be rejected/recreated from a FINISHED session. Already approved history is not recalculated or re-credited. Existing dashboard quick reviews use the same guarded actions and display errors.

This is still a frontend demo with browser-local storage and demo authentication, not a backend transaction service. One-envelope publication prevents partial writes in one browser operation, and actions reread current stored data, but simultaneous cross-tab/device writers are not transactionally coordinated. A production backend needs atomic approval/balance/transaction updates, request-credit idempotency keys and a uniqueness constraint for active `(sessionId, rank)` assignments. Browser dialog/search/keyboard/responsive/fullscreen interaction QA remains outstanding; automated coverage below uses isolated stores and server rendering.

### Files

New: `src/utils/tournamentFinalization.ts`, `src/features/poker-tours/FinalizeTournamentModal.tsx`, `src/features/player-points/TopTourPanel.tsx`, `src/features/player-points/TopTourRequestModal.tsx`, `scripts/verify-top-tour.mjs`.

Updated: `src/types/tournament.ts`, `src/types/points.ts`, `src/stores/tournamentSessionStore.ts`, `src/stores/pointsStore.ts`, `src/utils/tournamentStatistics.ts`, `src/utils/tournamentRuntime.ts`, `src/components/ui/Badge.tsx`, `src/features/poker-tours/TournamentClockPage.tsx`, `TournamentOverview.tsx`, `TournamentStatisticsModal.tsx`, `TournamentPrizePanel.tsx`, `TourListPage.tsx`, `src/features/player-points/PointsManagementPage.tsx`, `PointAdjustmentModal.tsx`, `src/features/dashboard/AdminDashboard.tsx`, `scripts/verify-tournament-statistics.mjs`, `scripts/verify-ui.mjs`, design specification and this handoff. The render verifier excludes the newly authorized points store/type changes and still verifies 10 unrelated original fingerprints.

### Verification

`verify-top-tour.mjs` passed frozen 3/5-position results, stale confirmation rejection, failed-finalization atomicity, automatic FINISHED, all final statistics/runtime locks, template isolation, pending balance neutrality, exact decimal rewards, snapshot/member/session IDs, duplicate pending/approved prevention, Admin/Cashier/Player access, failed request/approval/rejection persistence, exactly-once transactions, rejection/replacement, ranking/member projections, legacy history migration, preserved manual approval, reload and replay prevention. Table SSR confirms Admin/Cashier action differences; route rendering confirms Top Tour and frozen Clock behavior. Existing statistics, sessions, registration/runtime, prizes, background and UI regression checks passed, including 26 route renders and 10 preservation fingerprints. Final TypeScript/production build passed with the existing bundle-size warning (about 1.12 MB minified JS). Lint exited 0 with 49 existing warnings and none in the new Top Tour/finalization/points-store modules. No browser interaction or visual pass is claimed.

## Follow-up: Visible Top Tour navigation

Added a dedicated **Top Tour** entry under **ĐIỂM THƯỞNG HỘI VIÊN** in the sidebar for Admin/Cashier. It opens `/points?tab=top-tour` directly with the request/history table and **Cộng điểm Top Tour** action, while retaining the existing tab. Points tabs now follow URL query parameters, preserving selection across refresh/back navigation; sidebar active styling distinguishes Top Tour from the general points link. Updated `Sidebar.tsx`, `PointsManagementPage.tsx`, `scripts/verify-top-tour.mjs` and this handoff. Build and the Top Tour regression passed; the live dev server at port 5173 serves both updated navigation and tab modules. No browser screenshot pass is claimed.


## Follow-up: Responsive dashboard and Tournament Clock

Replaced the Clock's fixed, transformed canvas and removed `ClockViewport.tsx` and the **Vừa màn hình** toggle. Embedded and fullscreen displays now use native Grid/Flex layout, named container queries and separate fluid typography tokens. No CSS zoom or canvas scaling is used. The shared scheduler and timer/state/store implementations are unchanged.

Embedded Clock typography uses approximately 24–30px titles, 30–36px Level, 32–52px Blinds, 24–32px Ante and 80–160px countdowns, with smaller values reserved for narrow containers. Fullscreen uses 32–42px titles, 40–52px Level, 60–80px Blinds, 32–44px Ante and 120–180px countdowns. These ranges respect browser text sizing.

Clock reflow is based on its actual content width, including the space consumed by dashboard navigation. Below 640px, the timer leads a single column. From 640px, statistics and prizes sit beside each other below the timer. From 980px, the three panels sit in one row. Embedded statistics use compact groups. Fullscreen statistics use a vertical list. TOP rows remain dynamic and keyboard-scrollable, with separate embedded/fullscreen scroll limits. Break timing remains visible and additional duration/Level details expand through a native disclosure. Fullscreen keeps the operator bar reachable and allows content scrolling when a short viewport, long content or 200% zoom requires it.

The compact header wraps long tournament names and displays permanent GTD and Starting Stack configuration. Runtime statistics, actual Total Prize Pool and TOP payouts remain hidden until Buy-in closes. The GTD header is configuration metadata and can be visible while Buy-in is open. Session switching, finalization confirmation on the overview, FINISHED locks and background references remain intact.

Dashboard improvements include a 64px header, smaller content gutters, horizontal KPI layouts, 12px table row padding, shrinkable fields, wrapping filters/actions and keyboard-focusable table scroll regions. Template/session cards use available space through an automatic grid. POS stacks checkout below the catalog when its content width falls below 860px. Chart columns wait until larger desktop widths. Dialogs use the available dynamic viewport height, compact padding and wrapping footer actions. Session searches were added to the overview and Top Tour request form, preserving the selected session while filtering. Existing member search, approval permissions and business calculations are reused.

### Modified files

- Shared presentation in `src/index.css`, `src/components/layout/AppLayout.tsx`, `Header.tsx`, `Breadcrumbs.tsx`, and `src/components/ui/Input.tsx`, `Select.tsx`, `Card.tsx`, `StatsCard.tsx`, `Modal.tsx`, `Tabs.tsx`.
- Tournament presentation in `src/features/poker-tours/TournamentClockPage.tsx`, `TournamentOverview.tsx`, `TourListPage.tsx` and `BlindStructureEditor.tsx`. Removed `ClockViewport.tsx`.
- Feature presentation in `src/features/dashboard/AdminDashboard.tsx`, `src/features/pos/CafePosPage.tsx`, `src/features/accounts/AccountListPage.tsx`, `src/features/permissions/RoleMatrixPage.tsx`, `src/features/shifts/ShiftListPage.tsx`, `ActiveShiftPage.tsx`, `src/features/reports/RevenueReportPage.tsx`, and `src/features/player-points/PointsManagementPage.tsx`, `LeaderboardView.tsx`, `TopTourPanel.tsx`, `TopTourRequestModal.tsx`.
- Verification updates in `scripts/verify-top-tour.mjs`, `scripts/verify-tournament-sessions.mjs` and `scripts/verify-theme-css.mjs`. Updated this handoff, `design-system/cafe-poker/MASTER.md` and the lint report. Production output and TypeScript build cache were regenerated.

### Validation and remaining checks

Production TypeScript/Vite build passed. The configured linter is Oxlint, invoked by `npm.cmd run lint`, and exits successfully with 49 existing warnings. The repository has no ESLint command or dependency. Existing checks passed for Clock/runtime, session migration and isolation, 12 statistics groups, dynamic prizes, Top Tour/finalization, backgrounds, 26 route renders with 10 unrelated preservation fingerprints, theme persistence and 48 semantic contrast pairs. Emitted-CSS checks also validate native Clock sizing, separate embedded/TV fluid tokens and compiled Clock/POS container queries. Background adapter checks use Image/IndexedDB test doubles.

Browser automation reported its access host unavailable. Actual screenshots, layout measurements and interaction checks remain manual at 375px, 768px, 1024px, 1366×768, 1440×900 and 1920×1080, in light/dark themes at 100% zoom and with 200% zoom reflow. No browser visual pass or screenshot artifact is claimed. The existing roughly 1.12 MB minified JavaScript bundle warning remains.

## Follow-up: Global desktop density

Centralized application sizing in CSS tokens and applied them to the sidebar, header, breadcrumbs, page titles, shared buttons, inputs/selects, form labels, Card sections, Tabs, Badges, native menus, Modal sections and toast presentation. Fine-pointer desktop density applies from 1024px. Smaller viewports and touch/coarse pointers retain 44px controls. Clock fullscreen explicitly restores 44px controls and keeps its existing larger TV typography.

| Configured dimension | Previous | Compact desktop |
| --- | --- | --- |
| Sidebar | 256px | 232px |
| Application header | 64px | 60px |
| Small / standard button | 44 / 44px | 36 / 38px |
| Shared input / select | 44px | 38px |
| Main section gap | 24px | 20px |
| Component / form gap | 16px | 12px |
| Shared card padding | 20px | 16px |
| Table cell vertical padding | 12px | 6px |
| Page title | 24px, up to 32px on login | 22–26px |

The comparison records CSS configuration. Whole-page density and before/after screenshots remain unmeasured. Body text stays at 14px on desktop and supporting text remains readable at 12–13px. Shared Card padding uses component-layer defaults so caller utilities such as `p-0` continue to work. The root font size, browser zoom and application transforms are not used for density changes.

Applied spacing tokens to Dashboard and member portal, Cafe POS, Tournament templates/sessions, Blind Structure, Membership Points, Top Tour, rankings, staff shifts, accounts, permissions, reports, login and profile, including their affected forms/dialogs. Login branding and profile avatars are smaller, ranking podiums have shorter minimum heights, and the member card can grow with content. Tournament covers are capped at 192px to avoid oversized overview banners. POS uses shorter 3:2 product images and three product columns from 1040px of content width. The embedded Clock follows compact shared controls while TV mode retains its large control targets.

Changed shared files include `src/index.css`, `src/App.tsx`, `src/components/layout/AppLayout.tsx`, `Sidebar.tsx`, `Header.tsx`, `Breadcrumbs.tsx` and `src/components/ui/Button.tsx`, `Input.tsx`, `Select.tsx`, `Card.tsx`, `Modal.tsx`, `ConfirmDialog.tsx`, `Tabs.tsx`, `Badge.tsx`. Feature edits are presentation classes in the pages and forms listed above, plus `TournamentClockPage.tsx` and `TournamentCover.tsx`. Updated `scripts/verify-theme-css.mjs`, the design specification and lint report. Production output and TypeScript build cache were regenerated. No store, type, calculation, permission, timer or persistence implementation was edited in this follow-up.

Validation passed TypeScript/production build, configured Oxlint with 49 existing warnings, 26 route renders with 10 unrelated preservation fingerprints, Clock/runtime, session migration/isolation, 12 statistics groups, dynamic prizes, Top Tour/finalization, background adapter checks, theme persistence and 48 semantic contrast pairs. Emitted-CSS verification covers compact desktop token values, mobile/touch and TV target sizes, responsive Clock/POS rules, semantic colors and shared Card padding override order. The project uses Oxlint through its lint script and has no ESLint dependency or command.

The browser access host remains unavailable. Manual QA is still required at 375px, 768px, 1024px, 1366×768, 1440×900 and 1920×1080 at 100% zoom, with 200% zoom reflow and both themes. No before/after browser screenshots or visual pass is claimed. The existing large-bundle warning remains at about 1.12 MB minified JavaScript.

## Follow-up: Top Tour batches and session archiving

Top Tour now assigns every frozen prize position in one batch. Cashier/Admin selects a finished, unarchived Session, assigns a distinct active Player to each TOP, reviews the complete name/phone/PTS confirmation and submits **Gửi yêu cầu Admin duyệt**. The dialog's action footer stays outside its scrolling body. Switching Sessions clears assignments; editing one row preserves other rows. Payouts come from `finalResults.payouts`, retaining the existing 0.01 PTS allocation policy and frozen template configuration.

Each Player field is an editable combobox with immediate partial name/phone/member-ID search. Unicode normalization removes Vietnamese accents and maps đ to d. Matching ignores case. Arrow Up/Down skip unavailable Players, Enter selects, Escape closes results, Tab moves focus, and a clear button removes a selection. Free text clears the stable selected member ID and cannot be submitted. Result lists remain within the dialog flow, allowing its native scroll region to reveal all matches. Shared Modal gained an optional non-scrolling footer and reference-counted body scroll locking for nested confirmations.

The existing point-request ledger stores a batch as one TOUR_REWARD request with `topAssignments`, the complete final result snapshot, Session/Template IDs, requester and timestamps. Pending batches count once in existing badges and approval queues. Admin approval displays all rows, then revalidates roles, the final snapshot, exact decimal rewards, every member and all duplicate/conflict checks. All individual transactions, updated balances/rankings, approval metadata and `archivedAt` publish through a single write to `poker_cafe_points_ledger_v2`. No point balance changes during submission. Rejection records the reason/reviewer and leaves balances and the Session available for corrected resubmission.

Session `archivedAt`, `rewardBatchId` and reward-processing state project from the canonical approved ledger entry. The Tournament lifecycle stays FINISHED. Archive projection restores on reload and updates other tabs through storage events. Original tournament repository records and template snapshots remain available; later repository saves may include the projected runtime metadata. Current Session lists and reward selectors exclude archives. **Lịch sử giải đấu** under tournament management shows archived/reset-history records, searches name/Session ID/date, and exposes start/finish times, final statistics/pool, rewarded TOPs, Player names/phones, requester, reviewer and archive timestamps. Archived overviews remain read-only and store-level FINISHED/archive guards reject runtime/statistics/reset mutations. Templates remain reusable.

Older per-rank requests are preserved, labelled **Thưởng lẻ cũ**, and retain their original review history and transactions. Pending old requests can be rejected before creating a complete replacement batch. Sessions with already approved per-rank rewards are excluded from new batches to avoid duplicate credits and require operator reconciliation before transitioning to the batch workflow. No existing credits, requests or sessions are silently deleted or re-awarded. Member-facing request projections show only that member's assignment; full reward history remains in the Admin/Cashier interfaces.

### Files

- Added `src/components/ui/PlayerCombobox.tsx`, `src/utils/playerSearch.ts`, `src/utils/tournamentRewards.ts`, `src/features/player-points/TopTourAssignmentRows.tsx`, `TopTourAssignments.tsx`, `src/features/poker-tours/TournamentHistory.tsx` and `scripts/verify-top-tour-batches.mjs`.
- Updated `src/stores/pointsStore.ts`, `tournamentSessionStore.ts`, `src/types/points.ts`, `tournament.ts`, `src/utils/tournamentFinalization.ts`, `formatters.ts`, and `src/components/ui/Modal.tsx`.
- Updated `TopTourRequestModal.tsx`, `TopTourPanel.tsx`, `PointsManagementPage.tsx`, `TourListPage.tsx`, `TournamentOverview.tsx`, `TournamentClockPage.tsx` and `AdminDashboard.tsx`. Updated the design specification, lint report and this handoff. Production output and TypeScript build cache were regenerated.

### Verification and limits

The batch suite verifies 3/5 dynamic TOP rows and read-only frozen amounts, accent/name/phone/ID searches, keyboard option traversal, stable IDs, invalid free-text and duplicate rejection, role checks, unchanged pending balances, rejection/resubmission, storage failure, later-Player overflow, tampered reward precision, one-write publication, exactly-once credits, archive immutability, fresh-store restoration, cross-tab archive/point projections, current/history filtering and template reuse. Dialog SSR uses a test-only Modal wrapper. Keyboard index/search logic is unit tested; native Enter/Escape/Tab, mouse/touch selection, focus restoration and scrolling still require browser interaction QA.

TypeScript/production build and configured Oxlint passed with 49 existing warnings. Existing Top Tour/finalization, 26 route renders with 10 unrelated fingerprints, Sessions, Clock/runtime, 12 statistics groups, prizes, backgrounds, theme persistence/48 contrast pairs and emitted-CSS checks passed. The project lint command uses Oxlint and has no ESLint command. The existing bundle warning is about 1.14 MB minified JavaScript.

This is frontend-only localStorage persistence. Single-write ledger publication and idempotency checks do not provide database transactions or protection against concurrent cross-tab/cross-device writers. A backend must enforce transaction boundaries and unique Session/TOP/member credit constraints. Browser automation again reported its host unavailable, so no real-browser or screenshot pass is claimed.

## Follow-up: Keep TOP prizes visible on the Clock

Per the latest request, the Clock keeps Total Prize Pool and all configured TOP payouts visible while Buy-in is open as well as closed. The three-column layout remains stable. Player runtime metrics retain their existing Buy-in visibility rule; prize calculations and frozen final results are unchanged. Clock and prize regression expectations cover this behavior. TypeScript/build and lint passed; browser visual QA remains outstanding.

## Follow-up: Pause overlay and masked open prizes

Paused Clock sessions show a centered PAUSE banner over a dark scrim. The overlay does not intercept pointer events; the operator bar stays above it so Resume remains usable. Resuming removes the banner. Before Buy-in closes, Total Prize Pool and every configured TOP remain visible with `--` amounts and no PTS suffix. Closing Buy-in reveals the calculated amounts automatically. The fixed GTD header, calculations and frozen results remain unchanged. TypeScript/build, lint and Clock/prize regressions passed, including pause/resume rendering and 3/5-rank masked output. Browser visual verification remains outstanding.

## Follow-up: Balanced Clock columns

Desktop Clock uses equal-width side columns around the central timer, with symmetric header columns so the Tour title and countdown share the screen centerline. Increased vertical timer spacing from 16px to 24px. Mobile/tablet stacking, pause overlay and masked prizes remain. TypeScript/build, compiled CSS and Clock regression checks passed; browser visual QA remains outstanding.

## Follow-up: Persistent left Clock metrics

The left Clock panel always displays Players Remaining, Re-entries, Total Entries, Total Stack and Average Stack labels. Open Buy-in masks values with `--` (remaining: `-- / --`) and omits the average BB suffix; closed Buy-in reveals actual values. Break Schedule remains visible. The removed Break details and Players & Chips controls remain absent. TypeScript/build and Clock/prize regressions passed.

## Follow-up: Mask session statistics only

The latest clarification masks only the left session statistics before Buy-in closes. Prize Pool and TOP payouts show calculated PTS at all times; Break, Level, Blinds, Ante, Starting Stack and countdown retain their real values. This supersedes the earlier masked-prize behavior.

## Follow-up: Left statistics visible, prizes gated by Buy-in

Latest clarification supersedes the previous masking rules: left runtime statistics always show actual values. The entire right prize panel is hidden while Buy-in is open and appears automatically when Buy-in closes. The symmetric grid retains the countdown centerline. TypeScript/build and Clock/prize regression suites passed.
