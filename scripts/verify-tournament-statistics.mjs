// Isolated domain tests. Does not read or write the user's browser storage.
import assert from 'node:assert/strict';
import { createServer } from 'vite';

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
const audioParam = { setValueAtTime() {}, exponentialRampToValueAtTime() {} };
globalThis.window = { AudioContext: class {
  state = 'running'; currentTime = 0; destination = {};
  createOscillator() { return { frequency: audioParam, connect() {}, start() {}, stop() {} }; }
  createGain() { return { gain: audioParam, connect() {} }; }
} };
const realNow = Date.now;
let now = 1000000;
Date.now = () => now;
const server = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
let reloadServer;
let groups = 0;
const pass = (name) => { groups++; console.log(`PASS: ${name}`); };
try {
  const { useTournamentStore } = await server.ssrLoadModule('/src/stores/tournamentStore.ts');
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/authStore.ts');
  const { adjustStatisticCounts, averageStack, getTournamentStatistics, validateStatistics } = await server.ssrLoadModule('/src/utils/tournamentStatistics.ts');
  const { getTournamentPrizePayouts } = await server.ssrLoadModule('/src/utils/tournamentPrizes.ts');
  const users = useAuthStore.getState().users;
  const admin = users.find((user) => user.role === 'ADMIN');
  const cashier = users.find((user) => user.role === 'CASHIER');
  const [a, b, c] = users.filter((user) => user.role === 'PLAYER');
  useAuthStore.setState({ currentUser: admin });
  useTournamentStore.setState({ tournaments: [], activeTourId: null });
  const data = {
    name: 'Statistics regression', startingChips: 10000, maxPlayers: 10,
    scheduledStartTime: '2026-11-14T10:00:00Z', createdBy: admin.fullName,
    participants: [a, b].map((user) => ({ playerId: user.id, playerName: user.fullName })),
    structure: { preBreakDurationMinutes: 2, postBreakDurationMinutes: 1, initialSmallBlind: 100, initialBigBlind: 200, stages: [
      { id: 'l1', stageType: 'LEVEL', name: 'Level 1', durationMinutes: 2, smallBlind: 100, bigBlind: 200 },
      { id: 'br', stageType: 'BREAK', name: 'Break', durationMinutes: 1 },
      { id: 'l2', stageType: 'LEVEL', name: 'Level 2', durationMinutes: 1, smallBlind: 200, bigBlind: 400 },
    ] },
  };
  assert.throws(() => useTournamentStore.getState().createTournament({ ...data, startingChips: 1.5 }));
  assert.throws(() => useTournamentStore.getState().createTournament({ ...data, maxPlayers: 0 }));
  assert.throws(() => useTournamentStore.getState().createTournament({ ...data, registrationEndStageId: 'br' }));
  assert.throws(() => useTournamentStore.getState().createTournament({ ...data, registrationEndStageId: 'missing' }));

  let created = useTournamentStore.getState().createTournament({ ...data, registrationEndStageId: 'l2' });
  assert.equal(created.statistics.entries, 0, 'Compatibility creation must ignore demo participants');
  // Explicit legacy ledger fixture. New sessions are tested separately.
  const initialStats = { totalStack: 20000, entries: 2, uniquePlayers: 2, playersRemaining: 2 };
  created = { ...created, entryStackOnly: false, registeredCount: 2, statistics: initialStats,
    participants: data.participants.map((player, index) => ({ ...player, id: 'legacy-' + index, initialChips: 10000, currentChips: 10000, isEliminated: false })),
    statisticsHistory: [{ id: 'legacy-created', timestamp: new Date().toISOString(), actor: { id: admin.id, name: admin.fullName, role: 'ADMIN' }, type: 'CREATED', reason: 'Legacy fixture', before: { totalStack: 0, entries: 0, uniquePlayers: 0, playersRemaining: 0 }, after: initialStats }] };
  useTournamentStore.setState({ tournaments: [created] });
  assert.equal(created.registrationEndStageId, 'l2');
  const id = created.id;
  const state = () => useTournamentStore.getState();
  const tour = () => state().tournaments.find((item) => item.id === id);
  const statistics = () => getTournamentStatistics(tour());
  const revision = () => tour().statisticsHistory.at(-1)?.id;
  const success = (result) => assert.equal(result.success, true, result.message);
  const rejectWithoutChange = (action) => {
    const previous = JSON.stringify(state().tournaments);
    assert.equal(action().success, false);
    assert.equal(JSON.stringify(state().tournaments), previous);
  };
  assert.deepEqual(statistics(), { totalStack: 20000, entries: 2, uniquePlayers: 2, playersRemaining: 2 });
  assert.equal(averageStack(statistics()), 10000);
  assert.equal(tour().statisticsHistory[0].before.totalStack, 0);
  assert.equal(tour().statisticsHistory[0].after.totalStack, 20000);
  pass('validated creation, initial chip circulation and initial history');

  assert.deepEqual(adjustStatisticCounts({ entries: 2, uniquePlayers: 2, playersRemaining: 2 }, 5), { entries: 7, uniquePlayers: 2, playersRemaining: 2 });
  assert.deepEqual(adjustStatisticCounts({ entries: 2, uniquePlayers: 2, playersRemaining: 2 }, 1, 1), { entries: 3, uniquePlayers: 3, playersRemaining: 2 });
  assert.deepEqual(adjustStatisticCounts({ entries: 0, uniquePlayers: 0, playersRemaining: 0 }, -1), { entries: 0, uniquePlayers: 0, playersRemaining: 0 });
  pass('quick draft adjustments change Entries only unless the New Player action also increases Unique Players');

  assert.deepEqual(getTournamentPrizePayouts(1), { totalPrizePoints: 2, payouts: [{ place: 1, percentage: 60, points: 1.2 }, { place: 2, percentage: 30, points: 0.6 }, { place: 3, percentage: 10, points: 0.2 }] });
  assert.deepEqual(getTournamentPrizePayouts(50), { totalPrizePoints: 100, payouts: [{ place: 1, percentage: 60, points: 60 }, { place: 2, percentage: 30, points: 30 }, { place: 3, percentage: 10, points: 10 }] });
  assert.deepEqual(getTournamentPrizePayouts(-1), { totalPrizePoints: 0, payouts: [{ place: 1, percentage: 60, points: 0 }, { place: 2, percentage: 30, points: 0 }, { place: 3, percentage: 10, points: 0 }] });
  pass('prize pool uses two points per entry and pays Top 1/2/3 at 60/30/10');

  const activeA = () => tour().participants.find((p) => p.playerId === a.id && !p.isEliminated);
  const activeB = () => tour().participants.find((p) => p.playerId === b.id && !p.isEliminated);
  success(state().issueChips(id, 'RE_BUY', a.id, 5000, 'Re-buy test', revision()));
  success(state().issueChips(id, 'ADD_ON', a.id, 2000, 'Add-on test', revision()));
  assert.deepEqual(statistics(), { totalStack: 20000, entries: 2, uniquePlayers: 2, playersRemaining: 2 });
  const firstA = activeA().id;
  success(state().eliminateParticipant(id, firstA));
  assert.equal(statistics().totalStack, 20000);
  assert.equal(statistics().playersRemaining, 1);
  assert.equal(averageStack(statistics()), 20000);
  rejectWithoutChange(() => state().eliminateParticipant(id, firstA));
  success(state().issueChips(id, 'RE_ENTRY', a.id, 10000, 'Re-entry test', revision()));
  assert.notEqual(activeA().id, firstA);
  assert.deepEqual(statistics(), { totalStack: 30000, entries: 3, uniquePlayers: 2, playersRemaining: 2 });
  success(state().issueChips(id, 'BUY_IN', c.id, 10000, 'Buy-in test', revision()));
  assert.deepEqual(statistics(), { totalStack: 40000, entries: 4, uniquePlayers: 3, playersRemaining: 3 });
  assert.equal(averageStack(statistics()), 40000 / 3);
  pass('Buy-in and Re-entry determine entries, unique players and calculated session stack; Re-buy/Add-on history remains intact');

  rejectWithoutChange(() => state().issueChips(id, 'BUY_IN', a.id, 10000, 'duplicate', revision()));
  rejectWithoutChange(() => state().issueChips(id, 'RE_ENTRY', a.id, 10000, 'active player', revision()));
  rejectWithoutChange(() => state().issueChips(id, 'RE_BUY', 'missing-player', 10000, 'unknown', revision()));
  rejectWithoutChange(() => state().issueChips(id, 'INVALID', a.id, 10000, 'invalid type', revision()));
  for (const chips of [-1, 0, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER]) {
    rejectWithoutChange(() => state().issueChips(id, 'RE_BUY', a.id, chips, 'invalid chips', revision()));
  }
  rejectWithoutChange(() => state().issueChips(id, 'RE_BUY', a.id, 10000, ' ', revision()));
  rejectWithoutChange(() => state().issueChips(id, 'RE_BUY', a.id, 10000, 'x'.repeat(501), revision()));
  rejectWithoutChange(() => state().updateChips(id, firstA, 10));
  for (const chips of [-1, 0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) rejectWithoutChange(() => state().updateChips(id, activeB().id, chips));
  success(state().updateChips(id, activeB().id, 15000));
  assert.equal(statistics().totalStack, 40000);
  assert.equal(tour().statisticsHistory.at(-1).type, 'PLAYER_STACK');
  assert.equal(tour().statisticsHistory.at(-1).previousPlayerStack, 10000);
  assert.equal(tour().statisticsHistory.at(-1).nextPlayerStack, 15000);
  pass('invalid inputs and duplicate operations cannot mutate state or history; allocation does not issue chips');

  for (const key of ['totalStack', 'entries', 'uniquePlayers', 'playersRemaining']) {
    for (const invalid of [-1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      assert.ok(Object.keys(validateStatistics({ ...statistics(), [key]: invalid })).length);
    }
  }
  rejectWithoutChange(() => state().correctStatistics(id, { ...statistics(), uniquePlayers: 5 }, 'bad counts', revision()));
  rejectWithoutChange(() => state().correctStatistics(id, { ...statistics(), playersRemaining: 4 }, 'bad remaining', revision()));
  const staleRevision = revision();
  success(state().correctStatistics(id, { ...statistics(), entries: 5, totalStack: 1 }, 'Audit correction', revision()));
  assert.equal(statistics().totalStack, 50000);
  rejectWithoutChange(() => state().correctStatistics(id, { ...statistics(), entries: 6 }, 'stale overwrite', staleRevision));
  success(state().correctStatistics(id, { ...statistics(), entries: 4, totalStack: 45000 }, '', revision()));
  assert.equal(tour().statisticsHistory.at(-1).before.totalStack, 50000);
  assert.equal(tour().statisticsHistory.at(-1).after.totalStack, 40000);
  assert.equal(tour().statisticsHistory.at(-1).reason, 'Cập nhật thống kê');
  assert.equal(tour().statisticsNeedsReview, false);
  pass('manual count reconciliation is validated, version checked and derives stack from configured starting chips');

  useAuthStore.setState({ currentUser: a });
  rejectWithoutChange(() => state().correctStatistics(id, statistics(), 'not allowed', revision()));
  rejectWithoutChange(() => state().issueChips(id, 'RE_BUY', a.id, 100, 'not allowed', revision()));
  rejectWithoutChange(() => state().eliminateParticipant(id, activeB().id));
  rejectWithoutChange(() => state().updateChips(id, activeB().id, 12000));
  useAuthStore.setState({ currentUser: null });
  rejectWithoutChange(() => state().correctStatistics(id, statistics(), 'not signed in', revision()));
  useAuthStore.setState({ currentUser: cashier });
  success(state().correctStatistics(id, { ...statistics(), totalStack: 46000 }, 'Cashier correction', revision()));
  success(state().issueChips(id, 'ADD_ON', a.id, 1000, 'Cashier add-on', revision()));
  assert.equal(tour().statisticsHistory.at(-1).actor.id, cashier.id);
  const realSetItem = globalThis.localStorage.setItem;
  globalThis.localStorage.setItem = () => { throw new Error('quota exceeded'); };
  rejectWithoutChange(() => state().correctStatistics(id, statistics(), 'cannot persist', revision()));
  globalThis.localStorage.setItem = realSetItem;
  pass('Admin/Cashier authorization and atomic failure when storage is unavailable');

  useAuthStore.setState({ currentUser: admin });
  state().startTournament(id);
  const clockKeys = ['status', 'currentStageIndex', 'stageRemainingSeconds', 'timerStartedAt', 'startedAt', 'pausedAt'];
  const clock = () => Object.fromEntries(clockKeys.map((key) => [key, tour()[key]]));
  const runningClock = clock();
  now += 12500;
  success(state().correctStatistics(id, { ...statistics(), totalStack: 48000 }, 'During running clock', revision()));
  assert.deepEqual(clock(), runningClock);
  success(state().issueChips(id, 'RE_BUY', a.id, 1000, 'During running clock', revision()));
  assert.deepEqual(clock(), runningClock);
  assert.equal(tour().totalElapsedSeconds, 12, 'Runtime synchronization accrues elapsed time without resetting the timer');
  state().pauseTournament(id);
  assert.equal(tour().stageRemainingSeconds, 108);
  assert.equal(tour().timerStartedAt, undefined);
  state().resumeTournament(id);
  assert.equal(tour().timerStartedAt, now);
  state().nextStage(id);
  assert.equal(tour().currentStageIndex, 1);
  assert.equal(tour().stageRemainingSeconds, 60);
  state().prevStage(id);
  assert.equal(tour().stageRemainingSeconds, 120);
  state().resetCurrentStage(id);
  now += 120000;
  state().syncClockTick(id);
  assert.equal(tour().currentStageIndex, 1);
  pass('running statistics edits preserve clock timestamps; pause/resume, next/previous, reset and automatic break still work');

  const totalBeforeEliminations = statistics().totalStack;
  for (const participant of tour().participants.filter((p) => !p.isEliminated)) success(state().eliminateParticipant(id, participant.id));
  assert.equal(statistics().playersRemaining, 0);
  assert.equal(statistics().totalStack, totalBeforeEliminations);
  assert.equal(averageStack(statistics()), 0);
  const points = (await server.ssrLoadModule('/src/stores/pointsStore.ts')).usePointsStore;
  const pointCount = points.getState().requests.length;
  state().endTournament(id);
  assert.equal(new Set(tour().finalRanks.map((rank) => rank.playerId)).size, tour().finalRanks.length);
  assert.equal(points.getState().requests.length - pointCount, 0, 'Finalizing freezes results without automatically assigning/crediting Top Tour rewards');
  rejectWithoutChange(() => state().issueChips(id, 'RE_BUY', a.id, 100, 'closed', revision()));
  assert.deepEqual(JSON.parse(storage.get('poker_cafe_tournament_repository_v2')).sessions.find((item) => item.id === id).statisticsHistory, tour().statisticsHistory);
  for (const change of tour().statisticsHistory) {
    assert.ok(change.timestamp && change.actor.id && change.reason);
    assert.ok(change.before && change.after);
  }
  pass('zero remaining preserves chips; final rewards deduplicate re-entries; complete audit persists');

  reloadServer = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
  const persistedStore = (await reloadServer.ssrLoadModule('/src/stores/tournamentStore.ts')).useTournamentStore;
  assert.deepEqual(persistedStore.getState().tournaments[0].statistics, statistics());
  assert.equal(persistedStore.getState().tournaments[0].registrationEndStageId, 'l2');
  assert.deepEqual(persistedStore.getState().tournaments[0].statisticsHistory, tour().statisticsHistory);
  await reloadServer.close();
  pass('statistics and audit history survive a fresh store reload');

  useAuthStore.setState({ currentUser: admin });
  const resetTour = state().createTournament({ ...data, name: 'Reset regression', participants: [data.participants[0]] });
  const resetId = resetTour.id;
  state().startTournament(resetId);
  success(state().closeBuyIn(resetId));
  assert.equal(state().tournaments.find((item) => item.id === resetId).buyInClosedAt !== undefined, true);
  useAuthStore.setState({ currentUser: a });
  rejectWithoutChange(() => state().resetTournamentSession(resetId));
  useAuthStore.setState({ currentUser: admin });
  success(state().resetTournamentSession(resetId));
  const resetState = state().tournaments.find((item) => item.id === resetId);
  assert.deepEqual(resetState.statistics, { totalStack: 0, entries: 0, uniquePlayers: 0, playersRemaining: 0 });
  assert.deepEqual(resetState.participants, []);
  assert.equal(resetState.statisticsHistory.length, 0);
  assert.equal(resetState.currentStageIndex, 0);
  assert.equal(resetState.stageRemainingSeconds, resetState.structure.stages[0].durationMinutes * 60);
  assert.equal(resetState.status, 'PAUSED');
  assert.equal(resetState.buyInClosedAt, undefined);
  assert.equal(resetState.startingChips, data.startingChips);
  assert.deepEqual(resetState.structure, resetTour.structure);
  pass('Admin session reset clears runtime statistics, restores paused first level and open Buy-in without changing tour configuration');

  const legacy = { ...created, statistics: undefined, statisticsHistory: undefined, statisticsNeedsReview: undefined, registeredCount: 5,
    participants: created.participants.map((p, i) => ({ ...p, isEliminated: i === 0, currentChips: i === 0 ? 0 : 10000 })) };
  storage.set('poker_cafe_tournaments', JSON.stringify([legacy]));
  storage.delete('poker_cafe_tournament_repository_v2');
  reloadServer = await createServer({ server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' });
  const reloaded = (await reloadServer.ssrLoadModule('/src/stores/tournamentStore.ts')).useTournamentStore;
  const migrated = reloaded.getState().tournaments[0];
  assert.equal(migrated.statisticsNeedsReview, true);
  assert.equal(migrated.statistics.totalStack, 50000);
  assert.equal(migrated.statistics.playersRemaining, 1);
  success(reloaded.getState().eliminateParticipant(id, migrated.participants[1].id));
  assert.equal(reloaded.getState().tournaments[0].statistics.totalStack, 50000);
  assert.equal(reloaded.getState().tournaments[0].statistics.playersRemaining, 0);
  pass('legacy registration estimates require review and are frozen before elimination');
  console.log(`PASS: ${groups} tournament-statistics regression groups`);
} finally {
  Date.now = realNow;
  await reloadServer?.close();
  await server.close();
  delete globalThis.localStorage;
  delete globalThis.window;
}
