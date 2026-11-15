// Render checks only: this does not replace browser layout or interaction tests.
// Each scenario runs with isolated in-memory storage, never the user's browser data.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

const manifest = JSON.parse(await readFile(new URL('../design-system/cafe-poker/preserved-files.json', import.meta.url), 'utf8'));
// The follow-up statistics feature explicitly authorizes these domain changes.
// Their behavior is covered by verify-tournament-statistics.mjs instead.
const statisticsFiles = new Set(['src/stores/tournamentStore.ts', 'src/types/tournament.ts', 'src/stores/pointsStore.ts', 'src/types/points.ts']);
for (const [file, expected] of Object.entries(manifest)) {
  if (statisticsFiles.has(file.replaceAll('\\', '/'))) continue;
  const actual = createHash('sha256').update(await readFile(file)).digest('hex');
  assert.equal(actual, expected, `Preserved file changed: ${file}`);
}
console.log(`PASS: ${Object.keys(manifest).length - statisticsFiles.size} unrelated business, type, fixture and routing files unchanged`);

const scenarios = [
  { role: 'ADMIN', routes: [
    ['/', 'Tổng quan hoạt động'], ['/pos', 'Quầy bán hàng'],
    ['/tours', 'Quản lý giải đấu'], ['/tours/clock', 'Chưa có phiên giải'],
    ['/tours/clock/tour-101', 'Chưa có phiên giải'], ['/tours/blind-structures', 'Cấu Trúc'],
    ['/points', 'Duyệt Điểm'], ['/leaderboard', 'Bảng Vinh Danh'],
    ['/accounts', 'Quản Lý Tài Khoản'], ['/permissions', 'Ma Trận Phân Quyền'],
    ['/shifts', 'Ca'], ['/shifts/active', 'Ca'], ['/reports', 'Báo Cáo Doanh Thu'],
    ['/profile', 'Hồ Sơ Cá Nhân'], ['/login', 'Tên đăng nhập'],
  ] },
  { role: 'CASHIER', routes: [['/pos', 'Quầy bán hàng'], ['/points', 'Duyệt Điểm'], ['/shifts/active', 'Ca']] },
  { role: 'PLAYER', routes: [['/', 'Điểm'], ['/player/portal', 'Điểm'], ['/points', 'Điểm'], ['/pos', 'Không Có Quyền Truy Cập']] },
  { role: 'ADMIN', empty: true, routes: [['/', 'Chưa có hóa đơn'], ['/pos', 'Không tìm thấy món'], ['/tours/clock', 'Chưa có phiên giải'], ['/points', 'Điểm']] },
];

let checked = 0;
for (const scenario of scenarios) {
  const storage = new Map();
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
  };
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
  try {
    const { INITIAL_USERS } = await server.ssrLoadModule('/src/mocks/initialData.ts');
    localStorage.setItem('poker_cafe_auth_user', JSON.stringify(INITIAL_USERS.find((user) => user.role === scenario.role)));
    if (scenario.empty) {
      for (const key of ['products', 'orders', 'point_requests', 'point_transactions', 'leaderboard', 'shifts', 'tournaments']) {
        localStorage.setItem(`poker_cafe_${key}`, '[]');
      }
    }
    const { AppRoutes } = await server.ssrLoadModule('/src/routes/AppRoutes.tsx');
    for (const [path, expected] of scenario.routes) {
      const html = renderToString(React.createElement(MemoryRouter, { initialEntries: [path] }, React.createElement(AppRoutes)));
      assert.ok(html.includes(expected), `${scenario.role} ${path}: expected ${expected}`);
      if (path !== '/login') assert.ok(html.includes('main-content'), `${path}: missing shared application shell`);
      if (path === '/pos' && scenario.role !== 'PLAYER') {
        assert.ok(html.includes('pos-workspace'), 'POS responsive workspace missing');
        assert.ok(html.includes('pos-customer'), 'Customer field label missing');
      }
      checked++;
    }
    console.log(`PASS: ${scenario.role}${scenario.empty ? ' empty data' : ''}: ${scenario.routes.length} route renders`);
  } finally {
    await server.close();
  }
}
delete globalThis.localStorage;
console.log(`PASS: ${checked} server render checks. Browser interactions and responsive visuals remain unverified.`);
