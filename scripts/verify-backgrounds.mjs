// Isolated domain/storage-adapter tests. IndexedDB and image decoding use test
// doubles here; real browser upload, rendering and reload checks remain manual.
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';

const storage = new Map();
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, String(value)), removeItem: (key) => storage.delete(key) };
const images = new Map();
let failWrites = false;
let failOpen = false;
let databaseCreated = false;
let closed = 0;
const idb = {
  open() {
    const request = {};
    queueMicrotask(() => {
      if (failOpen) { request.onerror?.(); return; }
      request.result = {
        createObjectStore() {}, close() { closed++; },
        transaction() {
          const transaction = {};
          transaction.objectStore = () => ({
            put(blob, id) {
              queueMicrotask(() => { if (failWrites) transaction.onerror?.(); else { images.set(id, blob); transaction.oncomplete?.(); } });
            },
            get(id) { const read = {}; queueMicrotask(() => { read.result = images.get(id); read.onsuccess?.(); }); return read; },
            delete(id) { queueMicrotask(() => { images.delete(id); transaction.oncomplete?.(); }); },
          });
          return transaction;
        },
      };
      if (!databaseCreated) { request.onupgradeneeded?.(); databaseCreated = true; }
      request.onsuccess?.();
    });
    return request;
  },
};
globalThis.indexedDB = idb;
globalThis.Image = class {
  naturalWidth = 1920; naturalHeight = 1080;
  set src(url) {
    if (!url) return;
    if (url.includes('oversized')) this.naturalWidth = 100000;
    queueMicrotask(() => url.includes('broken') ? this.onerror?.() : this.onload?.());
  }
};
const options = { server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', logLevel: 'error' };
const server = await createServer(options);
let reload;
try {
  const helpers = await server.ssrLoadModule('/src/utils/tournamentBackgrounds.ts');
  const { validateImageUrl, validateImageFile, saveBackgroundFile, readBackgroundFile, deleteBackgroundFile, validateBackground, defaultBackground, loadBackgroundImage } = helpers;
  for (const url of ['http://example.com/a.png', 'data:image/png;base64,AA', 'blob:test', 'javascript:alert(1)', 'https://user:password@example.com/a.png']) assert.throws(() => validateImageUrl(url));
  assert.equal(validateImageUrl(' https://example.com/photo.webp?width=1920 '), 'https://example.com/photo.webp?width=1920');
  for (const overlay of [-1, 96, NaN, Infinity]) assert.throws(() => validateBackground({ source: 'none', overlay }));
  assert.throws(() => validateBackground({ source: 'upload', assetId: 'data:image/png;base64,AA', fileName: 'a.png', overlay: 65 }));
  assert.throws(() => validateBackground({ source: 'unexpected', overlay: 65 }));
  validateBackground(defaultBackground());
  await loadBackgroundImage('https://example.com/valid.png');
  await assert.rejects(loadBackgroundImage('https://example.com/broken.png'));
  await assert.rejects(loadBackgroundImage('https://example.com/oversized.png'));
  const png = new File([new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])], 'tour.png', { type: 'image/png' });
  const jpeg = new File([new Uint8Array([255,216,255,0])], 'tour.jpg', { type: 'image/jpeg' });
  const webp = new File(['RIFF1234WEBP'], 'clock.webp', { type: 'image/webp' });
  for (const file of [png, jpeg, webp]) await validateImageFile(file);
  for (const file of [new Blob(['fake'], { type: 'image/png' }), new Blob(['gif'], { type: 'image/gif' }), new Blob([], { type: 'image/png' }), new Blob([new Uint8Array(9 * 1024 * 1024)], { type: 'image/png' })]) await assert.rejects(validateImageFile(file));
  console.log('PASS: HTTPS URL, image type/signature/size, decoding failure, dimensions and overlay validation');

  const tourAsset = await saveBackgroundFile(png);
  const clockAsset = await saveBackgroundFile(webp);
  assert.notEqual(tourAsset, clockAsset);
  assert.ok(images.get(tourAsset) instanceof Blob);
  assert.equal((await readBackgroundFile(tourAsset)).type, 'image/png');
  assert.equal((await readBackgroundFile(clockAsset)).type, 'image/webp');
  await deleteBackgroundFile(tourAsset);
  assert.equal(await readBackgroundFile(tourAsset), undefined);
  assert.ok(await readBackgroundFile(clockAsset));
  failWrites = true;
  await assert.rejects(saveBackgroundFile(jpeg));
  failWrites = false;
  failOpen = true;
  await assert.rejects(saveBackgroundFile(jpeg));
  failOpen = false;
  delete globalThis.indexedDB;
  await assert.rejects(saveBackgroundFile(jpeg));
  globalThis.indexedDB = idb;
  assert.ok(closed >= 6);
  console.log('PASS: binary asset storage adapter, independent IDs, reads, deletion, missing assets and storage failure');

  const { useAuthStore } = await server.ssrLoadModule('/src/stores/authStore.ts');
  const { useTournamentTemplateStore } = await server.ssrLoadModule('/src/stores/tournamentTemplateStore.ts');
  const { useTournamentSessionStore } = await server.ssrLoadModule('/src/stores/tournamentSessionStore.ts');
  const { backgroundAssetIsUsed } = await server.ssrLoadModule('/src/utils/tournamentRepository.ts');
  const admin = useAuthStore.getState().users.find((user) => user.role === 'ADMIN');
  const player = useAuthStore.getState().users.find((user) => user.role === 'PLAYER');
  useAuthStore.setState({ currentUser: admin });
  const state = () => useTournamentTemplateStore.getState();
  const template = state().templates[0];
  const cover = { source: 'url', url: 'https://example.com/cover.jpg', overlay: 35 };
  const clock = { source: 'upload', assetId: clockAsset, fileName: 'clock.webp', overlay: 75 };
  state().updateTemplate(template.id, { tourBackground: cover, clockBackground: clock });
  const a = useTournamentSessionStore.getState().createSession(template.id);
  const beforeRuntime = JSON.stringify(useTournamentSessionStore.getState().sessions);
  state().updateTemplate(template.id, { clockBackground: defaultBackground() });
  const b = useTournamentSessionStore.getState().createSession(template.id);
  assert.deepEqual(a.tourBackground, cover); assert.deepEqual(a.clockBackground, clock);
  assert.equal(b.clockBackground.source, 'default');
  assert.deepEqual(useTournamentSessionStore.getState().tournaments.find((item) => item.id === a.id).clockBackground, clock);
  const templateBeforeFailure = JSON.stringify(state().templates);
  assert.throws(() => state().updateTemplate(template.id, { clockBackground: { source: 'url', url: 'data:bad', overlay: 65 } }));
  useAuthStore.setState({ currentUser: player });
  assert.throws(() => state().updateTemplate(template.id, { tourBackground: defaultBackground() }));
  assert.equal(JSON.stringify(state().templates), templateBeforeFailure);
  useAuthStore.setState({ currentUser: admin });
  const actualWrite = localStorage.setItem;
  localStorage.setItem = () => { throw Error('quota exceeded'); };
  assert.throws(() => state().updateTemplate(template.id, { tourBackground: defaultBackground() }));
  localStorage.setItem = actualWrite;
  assert.equal(JSON.stringify(state().templates), templateBeforeFailure);
  assert.ok(beforeRuntime.includes(clockAsset));
  assert.ok(!storage.get('poker_cafe_tournament_repository_v2').includes('base64'));
  reload = await createServer(options);
  const restored = (await reload.ssrLoadModule('/src/stores/tournamentSessionStore.ts')).useTournamentSessionStore.getState().tournaments;
  assert.deepEqual(restored.find((item) => item.id === a.id).clockBackground, clock);
  assert.equal(restored.find((item) => item.id === b.id).clockBackground.source, 'default');
  const { TournamentBackground } = await server.ssrLoadModule('/src/components/ui/TournamentBackground.tsx');
  const markup = renderToStaticMarkup(React.createElement(TournamentBackground, { config: clock, url: 'blob:test-image' }));
  assert.ok(markup.includes('background-size:cover')); assert.ok(markup.includes('opacity:0.75'));
  assert.equal(renderToStaticMarkup(React.createElement(TournamentBackground, { config: defaultBackground() })), '');
  state().deleteTemplate(template.id);
  assert.ok(backgroundAssetIsUsed(clockAsset));
  assert.ok(images.has(clockAsset), 'Historical session snapshots retain uploaded backgrounds after template deletion');
  const clockSource = await readFile(new URL('../src/features/poker-tours/TournamentClockPage.tsx', import.meta.url), 'utf8');
  const coverSource = await readFile(new URL('../src/features/poker-tours/TourListPage.tsx', import.meta.url), 'utf8');
  assert.ok(clockSource.includes('useBackgroundImage(currentTour?.clockBackground)'));
  assert.ok(coverSource.includes('config={template.tourBackground}'));
  console.log('PASS: template/session backgrounds remain independent, frozen per session, permission checked and retained after template deletion');
} finally {
  await reload?.close(); await server.close();
  delete globalThis.localStorage; delete globalThis.indexedDB; delete globalThis.Image;
}
