// Regression coverage for the tournament selector, shared runtime and Buy-in.
// No browser data is read or written; SSR checks do not replace visual QA.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { readFile } from 'node:fs/promises';

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
const audioParam = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
globalThis.window = { AudioContext: class {
  state = 'running'; currentTime = 0; destination = {};
  createOscillator() { return { frequency: audioParam, connect() {}, start() {}, stop() {} }; }
  createGain() { return { gain: audioParam, connect() {} }; }
} };
const originalNow = Date.now;
let now = 1000000;
Date.now = () => now;
const options = { server: { middlewareMode: true, ws: false, hmr: false }, appType: 'custom', logLevel: 'error' };
const server = await createServer(options);
let reload;
try {
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/authStore.ts');
  const { useTournamentStore } = await server.ssrLoadModule('/src/stores/tournamentStore.ts');
  const { remainingSeconds, isBuyInClosed, advanceRuntime } = await server.ssrLoadModule('/src/utils/tournamentRuntime.ts');
  const { registrationSummary, registrationEndDisplay } = await server.ssrLoadModule('/src/utils/tournamentRegistration.ts');
  const auth = () => useAuthStore.getState();
  const admin = auth().users.find((user) => user.role === 'ADMIN');
  const cashier = auth().users.find((user) => user.role === 'CASHIER');
  const players = auth().users.filter((user) => user.role === 'PLAYER');
  useAuthStore.setState({ currentUser: admin });
  const state = () => useTournamentStore.getState();
  useTournamentStore.setState({ tournaments: [], activeTourId: null });
  const template = {
    name: 'Kiểm tra giải', startingChips: 10000, maxPlayers: 10, createdBy: admin.fullName,
    participants: players.slice(0, 2).map((user) => ({ playerId: user.id, playerName: user.fullName })),
    structure: { preBreakDurationMinutes: 2, postBreakDurationMinutes: 1, initialSmallBlind: 100, initialBigBlind: 200, stages: [
      { id: 'l1', stageType: 'LEVEL', name: 'Vòng 1', durationMinutes: 2, smallBlind: 100, bigBlind: 200 },
      { id: 'br1', stageType: 'BREAK', name: 'Break 1', durationMinutes: 1 },
      { id: 'l2', stageType: 'LEVEL', name: 'Vòng 2', durationMinutes: 2, smallBlind: 200, bigBlind: 400 },
      { id: 'br2', stageType: 'BREAK', name: 'Break 2', durationMinutes: 1 },
      { id: 'l3', stageType: 'LEVEL', name: 'Vòng 3', durationMinutes: 10, smallBlind: 300, bigBlind: 600 },
    ] },
  };
  const a = state().createTournament({ ...template, name: 'Giải A', buyInCloseBreakId: 'br1', clockBackground: { source: 'url', url: 'https://example.com/a.webp', overlay: 65 } });
  now += 1;
  const b = state().createTournament({ ...template, name: 'Giải B', buyInCloseBreakId: 'br2', clockBackground: { source: 'url', url: 'https://example.com/b.webp', overlay: 80 } });
  const tour = (id) => state().tournaments.find((item) => item.id === id);
  state().startTournament(a.id);
  state().startTournament(b.id);
  const runningA = tour(a.id);
  assert.equal(registrationEndDisplay(runningA), 'Reg End: Start of Level 2');
  assert.equal(registrationEndDisplay(tour(b.id)), 'Reg End: Start of Level 3');
  assert.equal(registrationEndDisplay({ ...runningA, buyInCloseBreakId: undefined, registrationEndStageId: 'l2' }), 'Reg End: Start of Level 2', 'Legacy Level endpoints remain compatible');
  assert.equal(registrationEndDisplay({ ...runningA, buyInCloseBreakId: undefined, registrationEndStageId: undefined }), 'Reg End: Not set');
  assert.ok(registrationSummary(runningA).includes('Break 1'));
  assert.equal(isBuyInClosed(advanceRuntime(runningA, now + 179999).tour), false, 'Buy-in stays open throughout the selected break');
  assert.equal(isBuyInClosed(advanceRuntime(runningA, now + 180000).tour), true, 'Buy-in closes exactly when the selected break ends');
  const completedRuntime = advanceRuntime(runningA, now + 2000000);
  assert.equal(completedRuntime.finished, true);
  assert.equal(completedRuntime.tour.currentStageIndex, 4);
  assert.equal(completedRuntime.tour.totalElapsedSeconds, 960);
  assert.equal(completedRuntime.tour.buyInClosedAt, new Date(now + 180000).toISOString());
  now += 30000;
  state().pauseTournament(b.id);
  assert.equal(tour(b.id).stageRemainingSeconds, 90);
  const beforeSelection = JSON.stringify(state().tournaments);
  for (let i = 0; i < 20; i++) state().setActiveTourId(i % 2 ? b.id : a.id);
  assert.equal(JSON.stringify(state().tournaments), beforeSelection);
  assert.equal(state().activeTourId, b.id);
  assert.equal(storage.get('poker_cafe_selected_tournament'), b.id);
  assert.equal(tour(a.id).clockBackground.url, 'https://example.com/a.webp');
  assert.equal(tour(b.id).clockBackground.url, 'https://example.com/b.webp');
  console.log('PASS: rapid selection changes only the display ID; independent backgrounds, runtime and persisted selection');

  // A continues while the operator watches paused B.
  now += 150000;
  state().syncAllClocks();
  assert.equal(tour(a.id).currentStageIndex, 2);
  assert.equal(remainingSeconds(tour(a.id), now), 120);
  assert.equal(isBuyInClosed(tour(a.id)), true);
  assert.equal(tour(a.id).buyInCloseReason, 'AUTO');
  assert.equal(isBuyInClosed(tour(b.id)), false);
  assert.equal(tour(b.id).stageRemainingSeconds, 90);
  const once = JSON.stringify(state().tournaments);
  state().syncAllClocks(); state().syncAllClocks();
  assert.equal(JSON.stringify(state().tournaments), once, 'Repeated tick at the same timestamp is idempotent');
  state().prevStage(a.id); state().resetCurrentStage(a.id);
  assert.equal(isBuyInClosed(tour(a.id)), true, 'Going back or resetting must not reopen Buy-in');
  const revision = () => tour(a.id).statisticsHistory.at(-1)?.id;
  assert.equal(state().issueChips(a.id, 'RE_BUY', players[0].id, 1000, 'Không được mua lại', revision()).success, false);
  assert.equal(state().correctStatistics(a.id, { ...tour(a.id).statistics, totalStack: 30000 }, 'Đối soát sau đóng', revision()).success, true);
  useAuthStore.setState({ currentUser: cashier });
  assert.equal(state().correctStatistics(a.id, { ...tour(a.id).statistics, totalStack: 31000 }, 'Thu ngân đối soát', revision()).success, true);
  assert.equal(state().closeBuyIn(b.id).success, false);
  assert.equal(state().setBuyInCloseBreak(b.id, 'br1').success, false);
  useAuthStore.setState({ currentUser: admin });
  assert.equal(state().setBuyInCloseBreak(b.id, 'l1').success, false);
  assert.equal(state().closeBuyIn(b.id).success, true);
  assert.equal(tour(b.id).buyInCloseReason, 'MANUAL');
  console.log('PASS: automatic close after the selected break while viewing another tournament; durable manual closure; editable statistics and role checks');

  // Catch up several stages after a throttled tab; consume elapsed overflow.
  state().resumeTournament(b.id);
  now += 160000;
  state().syncAllClocks();
  assert.equal(tour(b.id).currentStageIndex, 2);
  assert.equal(remainingSeconds(tour(b.id), now), 110);
  const savedB = JSON.parse(JSON.stringify(tour(b.id)));
  reload = await createServer(options);
  const restored = (await reload.ssrLoadModule('/src/stores/tournamentStore.ts')).useTournamentStore.getState();
  assert.equal(restored.activeTourId, b.id);
  assert.deepEqual(restored.tournaments.find((item) => item.id === b.id), savedB);
  await reload.close(); reload = undefined;
  console.log('PASS: elapsed overflow, per-tournament pause/resume and fresh-store restoration');

  // The shared scheduler must have exactly one interval, including two mounts
  // and StrictMode-like release/acquire cycles.
  const { acquireTournamentRuntime } = await server.ssrLoadModule('/src/hooks/useTournamentRuntime.ts');
  const originalInterval = globalThis.setInterval;
  const originalClear = globalThis.clearInterval;
  let intervals = 0, cleared = 0;
  let scheduledTick;
  globalThis.setInterval = (callback) => { intervals++; scheduledTick = callback; return 17; };
  globalThis.clearInterval = () => { cleared++; };
  try {
    const automatic = state().createTournament({ ...template, name: 'Scheduler automatic close', buyInCloseBreakId: 'br1' });
    state().startTournament(automatic.id);
    const releaseA = acquireTournamentRuntime(); const releaseB = acquireTournamentRuntime();
    assert.equal(intervals, 1);
    now += 179999; scheduledTick();
    assert.equal(isBuyInClosed(tour(automatic.id)), false, 'Scheduled ticking leaves Buy-in open through the selected Break');
    now += 1; scheduledTick();
    assert.equal(tour(automatic.id).buyInCloseReason, 'AUTO', 'The scheduled callback closes Buy-in at the Break boundary without a button/action call');
    assert.equal(tour(automatic.id).currentStageIndex, 2);
    releaseA(); releaseA(); assert.equal(cleared, 0);
    releaseB(); assert.equal(cleared, 1);
    const releaseC = acquireTournamentRuntime(); assert.equal(intervals, 2);
    releaseC(); assert.equal(cleared, 2);
  } finally { globalThis.setInterval = originalInterval; globalThis.clearInterval = originalClear; }
  console.log('PASS: shared scheduler deduplicates mounts, releases cleanly and tolerates repeated cleanup');

  // Render both visibility states. Statistics stay hidden while Buy-in is
  // open, then become available from that tournament's persisted closure.
  const c = state().createTournament({ ...template, name: 'Giải C' });
  storage.set('poker_cafe_auth_user', JSON.stringify(admin));
  state().setActiveTourId(c.id);
  reload = await createServer(options);
  const { AppRoutes } = await reload.ssrLoadModule('/src/routes/AppRoutes.tsx');
  const markup = renderToString(React.createElement(MemoryRouter, { initialEntries: ['/tours/clock'] }, React.createElement(AppRoutes)));
  for (const label of ['Chọn phiên giải', 'Giải C', 'Thông số giải đấu', 'Buy-in Open', 'Players Remaining / Unique Players', 'Mở đồng hồ giải đấu', 'Giải đấu']) assert.ok(markup.includes(label), label);
  assert.ok(!markup.includes('data-background-kind="clock"'), 'The clock does not open until the operator chooses Mở đồng hồ giải đấu');
  assert.ok(markup.includes(`href="/tours/clock/${c.id}?view=clock"`) && markup.includes('target="_blank"'), 'Clock action opens the selected tournament in a new tab');
  const openClockMarkup = renderToString(React.createElement(MemoryRouter, { initialEntries: [`/tours/clock/${c.id}?view=clock`] }, React.createElement(AppRoutes)));
  assert.ok(openClockMarkup.includes('data-background-kind="clock"') && openClockMarkup.includes('data-statistics-visibility="visible"') && openClockMarkup.includes('Reg End: Not set'), 'The clock shows session statistics and its registration endpoint while Buy-in is open');
  assert.ok(!openClockMarkup.includes('Đóng Buy-in</button>'), 'The clock requires no manual Buy-in closing button');
  const clockStore = (await reload.ssrLoadModule('/src/stores/tournamentSessionStore.ts')).useTournamentSessionStore;
  const initialClockState = clockStore.getInitialState();
  const initialClockTours = initialClockState.tournaments;
  clockStore.getState().startTournament(c.id);
  clockStore.getState().pauseTournament(c.id);
  const renderSelectedClock = () => renderToString(React.createElement(MemoryRouter, { initialEntries: [`/tours/clock/${c.id}?view=clock`] }, React.createElement(AppRoutes)));
  initialClockState.tournaments = clockStore.getState().tournaments; // Supply current state to the SSR snapshot.
  const pausedClock = renderSelectedClock();
  assert.ok(pausedClock.includes('data-clock-paused') && pausedClock.includes('>PAUSE</p>') && pausedClock.includes('pointer-events-none'), 'Pause dims the Clock with a centered nonblocking banner');
  clockStore.getState().resumeTournament(c.id);
  initialClockState.tournaments = clockStore.getState().tournaments;
  assert.ok(!renderSelectedClock().includes('data-clock-paused'), 'Resuming removes the pause overlay');
  initialClockState.tournaments = initialClockTours;
  assert.ok(!openClockMarkup.includes('data-prize-distribution'), 'Open Buy-in hides the prize panel');
  const closedClockMarkup = renderToString(React.createElement(MemoryRouter, { initialEntries: [`/tours/clock/${b.id}?view=clock`] }, React.createElement(AppRoutes)));
  assert.ok(closedClockMarkup.includes('data-statistics-visibility="visible"') && closedClockMarkup.includes(registrationEndDisplay(tour(b.id))), 'The clock shows session statistics after Buy-in closes while retaining its registration endpoint');
  assert.ok(!closedClockMarkup.includes(registrationSummary(tour(b.id))) && !closedClockMarkup.includes('Buy-in Closed') && !closedClockMarkup.includes('Thiết lập') && closedClockMarkup.includes('Next Break'), 'The clock removes the completed Buy-in status and setup action while later break information remains available');
  assert.ok(closedClockMarkup.includes('Total Prize Pool') && closedClockMarkup.includes('TOP 1') && closedClockMarkup.includes('TOP 2') && closedClockMarkup.includes('TOP 3'), 'The clock displays calculated Top prizes');
  assert.ok(!closedClockMarkup.includes('Chỉnh sửa thống kê'), 'The clock does not expose a statistics-edit button');
  const leftPanel = closedClockMarkup.indexOf('class="clock-statistics');
  const centerPanel = closedClockMarkup.indexOf('class="clock-center');
  const rightPanel = closedClockMarkup.indexOf('class="clock-prizes');
  assert.ok(leftPanel < centerPanel && centerPanel < rightPanel, 'Clock panels follow left statistics, center timer, right prizes');
  const statisticsPanel = closedClockMarkup.slice(leftPanel, centerPanel);
  for (const label of ['Players Remaining', 'Re-entries', 'Total Entries', 'Total Stack', 'Average Stack', 'Next Break']) assert.ok(statisticsPanel.includes(label), `Left panel contains ${label}`);
  const center = closedClockMarkup.slice(centerPanel, rightPanel);
  assert.ok(center.indexOf('clock-level-row') < center.indexOf('clock-blinds') && center.indexOf('clock-blinds') < center.indexOf('clock-display'), 'Level and blinds sit above the timer');
  assert.ok(openClockMarkup.indexOf('clock-display') < openClockMarkup.indexOf('clock-next-level'), 'An upcoming level preview sits below the timer');
  assert.ok(!openClockMarkup.includes('data-prize-distribution') && openClockMarkup.includes('Total Entries') && openClockMarkup.includes('Average Stack') && openClockMarkup.includes('data-statistics-values="visible"'), 'Open Buy-in shows real session statistics while hiding prizes');
  assert.ok(openClockMarkup.includes('Starting Stack') && openClockMarkup.includes('Break Schedule') && openClockMarkup.includes('clock-display'), 'Open Buy-in keeps configuration, break information and timer visible');
  console.log('PASS: reference Clock panel order, blinds above timer, compact prize rows and open/closed visibility');
  assert.ok(!markup.includes('TOURNAMENT CLOCK'));
  const form = await readFile(new URL('../src/features/poker-tours/TourFormModal.tsx', import.meta.url), 'utf8');
  assert.ok(!form.includes('datetime-local') && !form.includes('scheduledStartTime'), 'No scheduling form inputs');
  assert.ok(form.includes('Ảnh nền giải đấu') && form.includes('Ảnh nền đồng hồ'));
  assert.ok(form.includes('Tự động đóng Buy-in sau Break'));
  const statisticsModal = await readFile(new URL('../src/features/poker-tours/TournamentStatisticsModal.tsx', import.meta.url), 'utf8');
  for (const label of ['+1 Entry', '+5 Entries', '+10 Entries', 'New Player (+1 Entry, +1 Unique)', 'Re-entry (+1 Entry)', 'Quick Entry Adjustments']) assert.ok(statisticsModal.includes(label), label);
  console.log('PASS: Vietnamese selection overview appears before the clock, with persisted selection, retained background/Buy-in configuration and no scheduling inputs');
} finally {
  Date.now = originalNow;
  await reload?.close(); await server.close();
  delete globalThis.localStorage; delete globalThis.window;
}
