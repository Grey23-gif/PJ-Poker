// Isolated migration and session architecture regression; no browser data.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
const options = { server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' };
const servers = [];
const open = async () => { const server = await createServer(options); servers.push(server); return server; };
const realNow = Date.now; let now = 1000000; Date.now = () => now;
try {
  const server = await open();
  const { useAuthStore: auth } = await server.ssrLoadModule('/src/stores/authStore.ts');
  const { useTournamentTemplateStore: templates } = await server.ssrLoadModule('/src/stores/tournamentTemplateStore.ts');
  const { useTournamentSessionStore: sessions } = await server.ssrLoadModule('/src/stores/tournamentSessionStore.ts');
  const { TOURNAMENT_REPOSITORY_KEY: key, readTournamentRepository, backgroundAssetIsUsed } = await server.ssrLoadModule('/src/utils/tournamentRepository.ts');
  const { deriveStatistics, averageStack, adjustStatisticCounts } = await server.ssrLoadModule('/src/utils/tournamentStatistics.ts');
  (await server.ssrLoadModule('/src/utils/audio.ts')).setTournamentSoundEnabled(false);
  const admin = auth.getState().users.find((user) => user.role === 'ADMIN');
  const cashier = auth.getState().users.find((user) => user.role === 'CASHIER');
  const player = auth.getState().users.find((user) => user.role === 'PLAYER');
  auth.setState({ currentUser: admin });
  assert.equal(sessions.getState().sessions.length, 0, 'Fresh installs must not import demo runtime');
  assert.ok(templates.getState().templates.length > 0);
  for (const template of templates.getState().templates) for (const field of ['statistics', 'participants', 'registeredCount', 'status', 'currentStageIndex']) assert.ok(!(field in template));
  const template = templates.getState().createTemplate({ name: 'Session test', description: 'Permanent', startingChips: 20000, maxPlayers: 100,
    createdBy: admin.fullName, buyInCloseBreakId: 'br',
    clockBackground: { source: 'upload', assetId: 'retained-image', fileName: 'clock.png', overlay: 65 },
    tourBackground: { source: 'url', url: 'https://example.com/cover.webp', overlay: 45 },
    structure: { preBreakDurationMinutes: 1, postBreakDurationMinutes: 1, initialSmallBlind: 100, initialBigBlind: 200, stages: [
      { id: 'br0', stageType: 'BREAK', name: 'Break 0', durationMinutes: 1 },
      { id: 'l1', stageType: 'LEVEL', name: 'Level 1', durationMinutes: 1, smallBlind: 100, bigBlind: 200 },
      { id: 'br', stageType: 'BREAK', name: 'Break 1', durationMinutes: 1 },
      { id: 'l2', stageType: 'LEVEL', name: 'Level 2', durationMinutes: 2, smallBlind: 200, bigBlind: 400 },
    ] } });
  const permanent = JSON.stringify(templates.getState().templates);
  const a = sessions.getState().createSession(template.id), b = sessions.getState().createSession(template.id);
  assert.notEqual(a.id, b.id); assert.equal(a.templateId, b.templateId);
  assert.deepEqual(a.statistics, { entries: 0, uniquePlayers: 0, playersRemaining: 0, totalStack: 0 });
  assert.equal(a.currentStageIndex, 1); assert.equal(a.status, 'PAUSED'); assert.equal(a.buyInClosedAt, undefined); assert.deepEqual(a.participants, []);
  const state = () => sessions.getState(); const tour = (id) => state().tournaments.find((item) => item.id === id);
  const revision = (id) => tour(id).statisticsHistory.at(-1)?.id;
  const ok = (result) => assert.equal(result.success, true, result.message);
  let draft = { entries: 0, uniquePlayers: 0, playersRemaining: 0 };
  for (const count of [1, 5, 10]) draft = adjustStatisticCounts(draft, count);
  assert.equal(draft.entries, 16); assert.equal(draft.uniquePlayers, 0); assert.equal(tour(a.id).statistics.entries, 0);
  ok(state().correctStatistics(b.id, deriveStatistics(20000, draft), '', revision(b.id)));
  assert.equal(tour(b.id).statistics.uniquePlayers, 0, 'Saving Entry-only counts never invents Unique Players');
  ok(state().correctStatistics(b.id, deriveStatistics(20000, { entries: 0, uniquePlayers: 0, playersRemaining: 0 }), '', revision(b.id)));
  const example = deriveStatistics(20000, { entries: 30, uniquePlayers: 25, playersRemaining: 15 });
  assert.equal(example.totalStack, 600000); assert.equal(averageStack(example), 40000);
  assert.equal(averageStack(deriveStatistics(20000, { entries: 0, uniquePlayers: 0, playersRemaining: 0 })), 0);
  ok(state().correctStatistics(a.id, example, '', revision(a.id)));
  for (const counts of [{ entries: -1, uniquePlayers: 0, playersRemaining: 0 }, { entries: 2.5, uniquePlayers: 2, playersRemaining: 1 }, { entries: 1, uniquePlayers: 2, playersRemaining: 0 }, { entries: 2, uniquePlayers: 1, playersRemaining: 2 }]) assert.equal(state().correctStatistics(a.id, deriveStatistics(20000, counts), '', revision(a.id)).success, false);
  assert.equal(tour(b.id).statistics.entries, 0);
  state().resumeTournament(a.id); now += 60000; state().syncAllClocks();
  assert.equal(tour(a.id).currentStageIndex, 2); assert.equal(tour(a.id).buyInClosedAt, undefined);
  now += 60000; state().syncAllClocks();
  assert.equal(tour(a.id).currentStageIndex, 3); assert.ok(tour(a.id).buyInClosedAt); assert.equal(tour(b.id).currentStageIndex, 1);
  for (let index = 0; index < 20; index++) state().setActiveTourId(index % 2 ? a.id : b.id);
  assert.equal(tour(a.id).statistics.entries, 30); assert.equal(tour(b.id).statistics.entries, 0);
  storage.set('poker_cafe_auth_user', JSON.stringify(admin));
  const renderServer = await open();
  const { AppRoutes } = await renderServer.ssrLoadModule('/src/routes/AppRoutes.tsx');
  const renderClock = (id) => renderToString(React.createElement(MemoryRouter, { initialEntries: [`/tours/clock/${id}?view=clock`] }, React.createElement(AppRoutes)));
  const openClock = renderClock(b.id);
  assert.ok(openClock.includes('data-statistics-visibility="hidden"'));
  const assertHiddenMetrics = (html) => {
    for (const label of ['Average Stack', 'Total Stack', 'Total Prize Pool', 'TOP 1', 'TOP 2', 'TOP 3', 'Players Remaining', 'Total Entries', 'Unique Players', 'data-prize-distribution']) assert.ok(!html.includes(label), `Open Buy-in hides ${label}`);
  };
  assertHiddenMetrics(openClock);
  for (const label of ['GTD:', 'Starting Stack', 'Blinds', 'Level 1', 'Break Schedule', 'clock-display']) assert.ok(openClock.includes(label), `Open Buy-in retains ${label}`);
  const clock = renderClock(a.id); assert.ok(clock.includes('data-statistics-visibility="visible"')); assert.ok(clock.includes('TOP 1')); assert.ok(!clock.includes('60%') && !clock.includes('PTS/Entry')); assert.ok(clock.includes('Break Schedule'));
  assert.equal(state().issueChips(b.id, 'ADD_ON', player.id, 1000, 'not supported', revision(b.id)).success, false);
  assert.equal(state().issueChips(b.id, 'BUY_IN', player.id, 1000, 'wrong stack', revision(b.id)).success, false);
  assert.equal(JSON.stringify(templates.getState().templates), permanent);
  auth.setState({ currentUser: cashier });
  ok(state().correctStatistics(b.id, example, '', revision(b.id)));
  assert.throws(() => state().createSession(template.id)); assert.equal(state().resetTournamentSession(b.id).success, false);
  auth.setState({ currentUser: player }); assert.equal(state().correctStatistics(b.id, example, '', revision(b.id)).success, false);
  auth.setState({ currentUser: admin });
  const beforeReset = structuredClone(tour(a.id)); const count = state().sessions.length;
  ok(state().resetTournamentSession(a.id));
  assert.equal(state().sessions.length, count + 1); assert.equal(tour(a.id).currentStageIndex, 1); assert.equal(tour(a.id).status, 'PAUSED'); assert.equal(tour(a.id).statistics.entries, 0); assert.equal(tour(a.id).buyInClosedAt, undefined);
  const archive = state().tournaments.find((item) => item.id !== a.id && item.id !== b.id);
  assert.deepEqual(archive.statisticsHistory, beforeReset.statisticsHistory); assert.equal(archive.statistics.entries, 30);
  assert.equal(JSON.stringify(templates.getState().templates), permanent);
  templates.getState().updateTemplate(template.id, { startingChips: 40000 });
  assert.equal(tour(b.id).startingChips, 20000); const c = state().createSession(template.id); assert.equal(c.startingChips, 40000); assert.equal(c.statistics.entries, 0);
  templates.getState().deleteTemplate(template.id); assert.ok(tour(b.id)); assert.ok(backgroundAssetIsUsed('retained-image'));
  const write = localStorage.setItem; const beforeFailure = JSON.stringify(state().sessions);
  localStorage.setItem = () => { throw Error('quota'); };
  assert.equal(state().correctStatistics(b.id, example, '', revision(b.id)).success, false); assert.equal(JSON.stringify(state().sessions), beforeFailure);
  localStorage.setItem = write;
  const reloaded = await open(); const restored = (await reloaded.ssrLoadModule('/src/stores/tournamentSessionStore.ts')).useTournamentSessionStore;
  assert.deepEqual(JSON.parse(JSON.stringify(restored.getState().sessions)), JSON.parse(JSON.stringify(state().sessions)));
  assert.equal(readTournamentRepository().sessions[0].templateId, template.id);
  const handlers = [];
  globalThis.window = { addEventListener: (type, handler) => { if (type === 'storage') handlers.push(handler); }, removeEventListener() {} };
  const tvServer = await open();
  const tvStore = (await tvServer.ssrLoadModule('/src/stores/tournamentSessionStore.ts')).useTournamentSessionStore;
  ok(state().correctStatistics(b.id, { ...example, entries: 31 }, '', revision(b.id)));
  for (const handler of handlers) handler({ key });
  assert.equal(tvStore.getState().tournaments.find((item) => item.id === b.id).statistics.entries, 31, 'Confirmed counts propagate to another tab through storage events');
  const renderLatest = async (id) => {
    const latestServer = await open();
    const { AppRoutes: LatestRoutes } = await latestServer.ssrLoadModule('/src/routes/AppRoutes.tsx');
    return renderToString(React.createElement(MemoryRouter, { initialEntries: [`/tours/clock/${id}?view=clock`] }, React.createElement(LatestRoutes)));
  };
  const levelBeforeClose = tour(b.id).currentStageIndex;
  const populatedOpen = await renderLatest(b.id);
  assertHiddenMetrics(populatedOpen);
  ok(state().closeBuyIn(b.id));
  assert.equal(tour(b.id).currentStageIndex, levelBeforeClose, 'Manual closing reveals prizes without advancing the Level');
  const manuallyClosed = await renderLatest(b.id);
  for (const label of ['data-prize-distribution', 'Total Prize Pool', 'TOP 1', 'TOP 2', 'TOP 3', 'PTS']) assert.ok(manuallyClosed.includes(label), `Manual closure displays ${label}`);
  assert.ok(!manuallyClosed.includes('60%') && !manuallyClosed.includes('PTS/Entry'));
  ok(state().resetTournamentSession(b.id));
  const reopened = await renderLatest(b.id);
  assertHiddenMetrics(reopened);
  assert.ok(reopened.includes('Starting Stack') && reopened.includes('Break Schedule'));
  console.log('PASS: zero defaults, template/runtime isolation, independent sessions, snapshot configuration, permissions, calculations, reset archive, persistence and Buy-in visibility');

  const legacy = { ...beforeReset, id: 'legacy-id', templateId: undefined, entryStackOnly: undefined,
    statisticsHistory: [...beforeReset.statisticsHistory, { id: 'legacy-addon', type: 'ADD_ON', chipsIssued: 1000, reason: 'Old ledger', timestamp: new Date().toISOString(), actor: { id: admin.id, role: 'ADMIN', name: admin.fullName }, before: example, after: example }] };
  storage.delete(key); const original = JSON.stringify([legacy]); storage.set('poker_cafe_tournaments', original);
  const migratedServer = await open(); const migrated = (await migratedServer.ssrLoadModule('/src/stores/tournamentSessionStore.ts')).useTournamentSessionStore;
  assert.equal(storage.get('poker_cafe_tournaments'), original); assert.equal(migrated.getState().sessions[0].id, 'legacy-id');
  assert.equal(migrated.getState().sessions[0].templateId, 'legacy-id'); assert.equal(migrated.getState().sessions[0].statisticsHistory.at(-1).chipsIssued, 1000);
  const migratedTemplates = (await migratedServer.ssrLoadModule('/src/stores/tournamentTemplateStore.ts')).useTournamentTemplateStore;
  assert.ok(!('statistics' in migratedTemplates.getState().templates[0]));
  const migratedAuth = (await migratedServer.ssrLoadModule('/src/stores/authStore.ts')).useAuthStore;
  migratedAuth.setState({ currentUser: admin });
  const clean = migrated.getState().createSession('legacy-id'); assert.equal(clean.statistics.entries, 0); assert.equal(clean.statisticsHistory.length, 0); assert.deepEqual(clean.participants, []);
  storage.delete(key); storage.set('poker_cafe_tournaments', '{broken');
  const broken = await open();
  const brokenStore = (await broken.ssrLoadModule('/src/stores/tournamentSessionStore.ts')).useTournamentSessionStore;
  assert.ok(brokenStore.getState().loadError); assert.equal(brokenStore.getState().sessions.length, 0);
  assert.equal(storage.get('poker_cafe_tournaments'), '{broken'); assert.equal(storage.has(key), false);
  console.log('PASS: non-destructive legacy migration retains IDs, runtime and chip history; malformed records never get replaced by demo data');
} finally { Date.now = realNow; for (const server of servers) await server.close(); delete globalThis.localStorage; delete globalThis.window; }
