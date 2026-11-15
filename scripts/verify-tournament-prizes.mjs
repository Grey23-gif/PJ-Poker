import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
const options = { server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'silent' };
const server = await createServer(options);
let reload;
try {
  const { getTournamentPrizePayouts: calculate, validatePrizeConfiguration: validate } = await server.ssrLoadModule('/src/utils/tournamentPrizes.ts');
  const three = { guaranteedPoints: 65, entriesThreshold: 30, additionalPointsPerEntry: 2, positions: [60, 30, 10].map((percentage) => ({ percentage })) };
  const five = { ...three, positions: [50, 25, 15, 5, 5].map((percentage) => ({ percentage })) };
  for (const [entries, pool] of [[0, 65], [10, 65], [30, 65], [31, 67], [32, 69], [40, 85], [50, 105]]) assert.equal(calculate(entries, three).totalPrizePoints, pool, `Pool at ${entries} Entries`);
  assert.deepEqual(calculate(50, three).payouts.map((item) => item.points), [63, 31.5, 10.5]);
  assert.deepEqual(calculate(50, five).payouts.map((item) => item.points), [52.5, 26.25, 15.75, 5.25, 5.25]);
  for (const [field, values] of Object.entries({ guaranteedPoints: [-1, NaN, Infinity, 0.001], entriesThreshold: [-1, 0.5, NaN], additionalPointsPerEntry: [-1, Infinity, 0.001] })) {
    for (const value of values) assert.ok(Object.keys(validate({ ...three, [field]: value })).length);
  }
  for (const percentages of [[60, 30], [60, 30, 11], [-1, 101], [100.01, -0.01], [33.333, 33.333, 33.334], [], Array(21).fill(100 / 21)]) assert.throws(() => calculate(50, { ...three, positions: percentages.map((percentage) => ({ percentage })) }));
  assert.deepEqual(validate({ ...three, guaranteedPoints: 0, entriesThreshold: 0, additionalPointsPerEntry: 0, positions: [{ percentage: 100 }, { percentage: 0 }] }), {});
  for (const entries of [0, 1, 30, 31, 50, 99999]) {
    for (const config of [three, five, { ...three, guaranteedPoints: 0.01, additionalPointsPerEntry: 0.03, positions: [33.33, 33.33, 33.34].map((percentage) => ({ percentage })) }]) {
      const result = calculate(entries, config);
      assert.equal(result.payouts.reduce((sum, payout) => sum + Math.round(payout.points * 100), 0), Math.round(result.totalPrizePoints * 100), 'Allocated hundredths must conserve the exact pool');
    }
  }
  const tie = calculate(0, { ...three, guaranteedPoints: 0.01, positions: [50, 50].map((percentage) => ({ percentage })) });
  assert.deepEqual(tie.payouts.map((payout) => payout.points), [0.01, 0]);
  assert.equal(calculate(50).totalPrizePoints, 100, 'Legacy configuration remains 2 PTS/Entry');
  console.log('PASS: GTD threshold +1 boundary, all examples, 3/5 positions, decimal validation, exact percentage sum and deterministic cent allocation');

  const { TournamentPrizePanel } = await server.ssrLoadModule('/src/features/poker-tours/TournamentPrizePanel.tsx');
  const { PrizeDistributionEditor } = await server.ssrLoadModule('/src/features/poker-tours/PrizeDistributionEditor.tsx');
  for (const configuration of [three, five]) {
    assert.equal(renderToStaticMarkup(React.createElement(TournamentPrizePanel, { entries: 50, configuration, visible: false })), '');
    const html = renderToStaticMarkup(React.createElement(TournamentPrizePanel, { entries: 50, configuration, visible: true }));
    for (let rank = 1; rank <= configuration.positions.length; rank++) assert.ok(html.includes(`TOP ${rank}`));
    assert.ok(!html.includes(`TOP ${configuration.positions.length + 1}`) && !html.includes('%') && !html.includes('PTS/Entry'));
    assert.ok(html.includes('105,00 PTS'));
    const masked = renderToStaticMarkup(React.createElement(TournamentPrizePanel, { entries: 50, configuration, visible: true, masked: true }));
    assert.ok(masked.includes('Total Prize Pool') && masked.includes(`TOP ${configuration.positions.length}`));
    assert.ok(!masked.includes('PTS') && !masked.includes('105,00') && masked.includes('--'), 'Open Buy-in masks every prize amount and its unit');

    const preview = renderToStaticMarkup(React.createElement(PrizeDistributionEditor, { value: configuration, onChange() {} }));
    assert.ok(preview.includes('Guaranteed Prize (GTD)') && preview.includes('105,00 PTS') && preview.includes('Thêm vị trí TOP'));
  }
  console.log('PASS: prize panel respects its visibility prop and renders all configured ranks, and editor previews 3/5 distributions');

  const { useAuthStore: auth } = await server.ssrLoadModule('/src/stores/authStore.ts');
  const { useTournamentTemplateStore: templates } = await server.ssrLoadModule('/src/stores/tournamentTemplateStore.ts');
  const { useTournamentSessionStore: sessions } = await server.ssrLoadModule('/src/stores/tournamentSessionStore.ts');
  const admin = auth.getState().users.find((user) => user.role === 'ADMIN');
  auth.setState({ currentUser: admin });
  const base = templates.getState().templates[0];
  const template = templates.getState().createTemplate({ ...base, name: 'GTD snapshots', prizeConfiguration: three });
  const a = sessions.getState().createSession(template.id);
  const state = () => sessions.getState(); const tour = (id) => state().tournaments.find((item) => item.id === id);
  const revision = (id) => tour(id).statisticsHistory.at(-1)?.id;
  const ok = (result) => assert.equal(result.success, true, result.message);
  ok(state().correctStatistics(a.id, { entries: 50, uniquePlayers: 5, playersRemaining: 2, totalStack: 0 }, '', revision(a.id)));
  assert.equal(calculate(tour(a.id).statistics.entries, tour(a.id).prizeConfiguration).totalPrizePoints, 105);
  const before = JSON.stringify(tour(a.id));
  templates.getState().updateTemplate(template.id, { prizeConfiguration: { ...five, guaranteedPoints: 100 } });
  assert.equal(JSON.stringify(tour(a.id)), before);
  const b = state().createSession(template.id);
  assert.equal(b.prizeConfiguration.positions.length, 5); assert.equal(calculate(50, b.prizeConfiguration).totalPrizePoints, 140);
  ok(state().correctStatistics(b.id, { entries: 50, uniquePlayers: 5, playersRemaining: 2, totalStack: 0 }, '', revision(b.id)));
  ok(state().closeBuyIn(b.id));
  assert.equal(tour(a.id).prizeConfiguration.positions.length, 3);
  const validTemplates = JSON.stringify(templates.getState().templates);
  assert.throws(() => templates.getState().updateTemplate(template.id, { prizeConfiguration: { ...three, positions: [{ percentage: 99 }] } }));
  assert.equal(JSON.stringify(templates.getState().templates), validTemplates);
  const write = localStorage.setItem;
  localStorage.setItem = () => { throw Error('quota'); };
  assert.throws(() => templates.getState().updateTemplate(template.id, { prizeConfiguration: three }));
  assert.equal(JSON.stringify(templates.getState().templates), validTemplates); localStorage.setItem = write;
  const cashier = auth.getState().users.find((user) => user.role === 'CASHIER');
  const realPermission = auth.getState().hasPermission;
  auth.setState({ currentUser: cashier, hasPermission: () => true });
  assert.throws(() => templates.getState().updateTemplate(template.id, { prizeConfiguration: three }), /Admin/);
  auth.setState({ currentUser: admin, hasPermission: realPermission });
  ok(state().resetTournamentSession(a.id));
  assert.deepEqual(tour(a.id).prizeConfiguration, three);
  const archived = state().tournaments.find((item) => item.id !== a.id && item.id !== b.id);
  assert.deepEqual(archived.prizeConfiguration, three); assert.equal(archived.statistics.entries, 50);
  templates.getState().deleteTemplate(template.id);
  storage.set('poker_cafe_auth_user', JSON.stringify(admin));
  reload = await createServer(options);
  const restored = (await reload.ssrLoadModule('/src/stores/tournamentSessionStore.ts')).useTournamentSessionStore;
  assert.deepEqual(restored.getState().tournaments.find((item) => item.id === b.id).prizeConfiguration, b.prizeConfiguration);
  assert.deepEqual(restored.getState().tournaments.find((item) => item.id === archived.id).prizeConfiguration, three);
  const { AppRoutes } = await reload.ssrLoadModule('/src/routes/AppRoutes.tsx');
  const renderClock = (id) => renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [`/tours/clock/${id}?view=clock`] }, React.createElement(AppRoutes)));
  const fiveClock = renderClock(b.id);
  assert.ok(fiveClock.includes('TOP 5') && fiveClock.includes('140,00 PTS') && !fiveClock.includes('TOP 6'));
  const openClock = renderClock(a.id);
  assert.ok(!openClock.includes('Total Prize Pool') && openClock.includes('Players Remaining') && openClock.includes('data-statistics-values="visible"') && !openClock.includes('data-prize-distribution'));
  const persistedSession = JSON.parse(storage.get('poker_cafe_tournament_repository_v2')).sessions.find((session) => session.id === b.id);
  assert.ok(!('prizeConfiguration' in persistedSession)); assert.deepEqual(persistedSession.templateSnapshot.prizeConfiguration, b.prizeConfiguration);
  console.log('PASS: per-template persistence, permissions, invalid/failed saves, snapshot isolation, dynamic Entries, reset archives, template deletion and historical reload');
} finally { await reload?.close(); await server.close(); delete globalThis.localStorage; }
