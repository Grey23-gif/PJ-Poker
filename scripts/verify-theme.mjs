// Check first-paint initialization and theme changes without touching browser storage.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createServer } from 'vite';

function rootElement() {
  const classes = new Set(['dark']);
  return {
    dataset: {}, style: {},
    classList: {
      toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
      contains: (name) => classes.has(name),
    },
  };
}

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(bootstrap, 'Missing first-paint initialization');
for (const saved of [null, 'dark', 'light', 'invalid']) {
  const root = rootElement();
  vm.runInNewContext(bootstrap, { document: { documentElement: root }, localStorage: { getItem: () => saved } });
  const expected = saved === 'light' ? 'light' : 'dark';
  assert.equal(root.dataset.theme, expected);
  assert.equal(root.classList.contains('dark'), expected === 'dark');
  assert.equal(root.style.colorScheme, expected);
}
const blockedRoot = rootElement();
vm.runInNewContext(bootstrap, {
  document: { documentElement: blockedRoot },
  localStorage: { getItem: () => { throw new Error('Storage blocked'); } },
});
assert.equal(blockedRoot.dataset.theme, 'dark');

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const root = rootElement();
  const storage = new Map();
  globalThis.document = { documentElement: root };
  globalThis.window = new EventTarget();
  globalThis.localStorage = { setItem: (key, value) => storage.set(key, value) };
  let notifications = 0;
  window.addEventListener('poker-theme-change', () => notifications++);
  const { setTheme, THEME_STORAGE_KEY } = await server.ssrLoadModule('/src/utils/theme.ts');
  for (const theme of ['light', 'dark', 'light']) {
    setTheme(theme);
    assert.equal(root.dataset.theme, theme);
    assert.equal(root.style.colorScheme, theme);
    assert.equal(root.classList.contains('dark'), theme === 'dark');
    assert.equal(storage.get(THEME_STORAGE_KEY), theme);
  }
  globalThis.localStorage.setItem = () => { throw new Error('Storage blocked'); };
  assert.doesNotThrow(() => setTheme('dark'));
  assert.equal(root.dataset.theme, 'dark');
  assert.equal(notifications, 4);
  console.log('PASS: theme initialization, saved preference, light/dark changes, notifications and blocked-storage fallback');
} finally {
  await server.close();
  delete globalThis.document;
  delete globalThis.window;
  delete globalThis.localStorage;
}

// Check the actual RGB theme tokens, not a copied palette.
const css = await readFile(new URL('../src/index.css', import.meta.url), 'utf8');
const rootTokens = css.match(/:root \{([\s\S]*?)\n  \}/)[1];
const lightTokens = css.match(/:root\[data-theme='light'\] \{([\s\S]*?)\n  \}/)[1];
const luminance = (rgb) => rgb.map((value) => value / 255).map((v) => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
for (const [name, tokens] of [['dark', rootTokens], ['light', lightTokens]]) {
  const palette = Object.fromEntries([...tokens.matchAll(/--([a-z-]+): (\d+) (\d+) (\d+);/g)].map((match) => [match[1], match.slice(2).map(Number)]));
  for (const surface of ['canvas', 'card', 'raised']) {
    for (const foreground of ['content', 'secondary', 'muted', 'success', 'warning', 'danger', 'info', 'accent']) {
      const values = [luminance(palette[surface]), luminance(palette[foreground])].sort((a, b) => a - b);
      const ratio = (values[1] + .05) / (values[0] + .05);
      assert.ok(ratio >= 4.5, `${name}: ${foreground} on ${surface}: ${ratio.toFixed(2)}:1`);
    }
  }
}
console.log('PASS: 48 semantic text/surface contrast pairs across light and dark themes');
