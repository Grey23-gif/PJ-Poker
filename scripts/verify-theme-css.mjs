// Check emitted/live CSS, because token-only tests cannot detect a stale Tailwind pipeline.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
import { resolveConfig } from 'vite';

const config = await resolveConfig({}, 'serve');
for (const file of ['postcss.config.js', 'tailwind.config.js']) {
  assert.ok(config.configFileDependencies.some((dependency) => path.basename(dependency) === file), `${file}: Vite must watch theme configuration changes`);
}
console.log('PASS: Vite watches both PostCSS and Tailwind configuration dependencies');

const requiredUtilities = {
  '.bg-surface': ['background-color', '--card'],
  '.bg-field': ['background-color', '--field'],
  '.bg-raised': ['background-color', '--raised'],
  '.bg-navigation': ['background-color', '--navigation'],
  '.text-content': ['color', '--content'],
  '.text-secondary': ['color', '--secondary'],
  '.text-muted': ['color', '--muted'],
  '.text-success': ['color', '--success'],
  '.text-warning': ['color', '--warning'],
  '.border-line': ['border-color', '--line'],
  '.border-line-strong': ['border-color', '--line-strong'],
};

function verifyCss(css, label) {
  const root = postcss.parse(css);
  for (const [selector, [property, variable]] of Object.entries(requiredUtilities)) {
    let found = false;
    root.walkRules((rule) => {
      if (rule.selector !== selector) return;
      rule.walkDecls(property, (declaration) => {
        if (declaration.value.includes(`var(${variable})`)) found = true;
      });
    });
    assert.ok(found, `${label}: ${selector} missing or using a fixed color instead of ${variable}`);
  }
  for (const variable of ['--card', '--field', '--raised', '--line', '--content', '--muted']) {
    let found = false;
    root.walkRules((rule) => {
      if (rule.selector.replaceAll('"', '').replaceAll("'", '') !== ':root[data-theme=light]') return;
      rule.walkDecls(variable, () => { found = true; });
    });
    assert.ok(found, `${label}: light-mode value missing for ${variable}`);
  }
  console.log(`PASS: ${label}: 11 generated theme utilities and six light-mode overrides`);
  const clockRules = new Map();
  root.walkRules((rule) => {
    if (['.tournament-clock', '.tournament-clock.clock-fullscreen'].includes(rule.selector)) {
      rule.walkDecls((declaration) => clockRules.set(`${rule.selector}:${declaration.prop}`, declaration.value));
    }
    if (rule.selector.includes('clock')) rule.walkDecls((declaration) => {
      assert.ok(declaration.prop !== 'zoom' && !/scale\(/.test(declaration.value), `${label}: Clock must use native sizing`);
    });
  });
  assert.ok(clockRules.get('.tournament-clock:container')?.includes('tournament-clock'), `${label}: named clock container missing`);
  for (const context of ['.tournament-clock', '.tournament-clock.clock-fullscreen']) {
    for (const token of ['--clock-level-size', '--clock-blinds-size', '--clock-ante-size', '--clock-timer-size']) {
      assert.ok(clockRules.get(`${context}:${token}`)?.includes('clamp('), `${label}: fluid ${context} ${token} missing`);
    }
  }
  const queries = [];
  root.walkAtRules('container', (rule) => queries.push(rule.params.replaceAll(' ', '').replace(/\(width>=(\d+px)\)/g, '(min-width:$1)').replace(/\(width<=(\d+px)\)/g, '(max-width:$1)')));
  for (const query of ['tournament-clock(min-width:640px)', 'tournament-clock(min-width:980px)', 'workspace(max-width:859px)']) {
    assert.ok(queries.includes(query), `${label}: responsive container query ${query} missing`);
  }
  console.log(`PASS: ${label}: native Clock sizing, separate embedded/TV typography and emitted Clock/POS reflow queries`);
  const defaultDensity = new Map();
  const desktopDensity = new Map();
  let ruleOrder = 0;
  let cardPaddingOrder = -1;
  let zeroPaddingOrder = -1;
  root.walkRules((rule) => {
    ruleOrder++;
    const selectors = rule.selector.split(',').map((selector) => selector.trim());
    if (selectors.includes('.ui-card-content')) cardPaddingOrder = ruleOrder;
    if (selectors.includes('.p-0')) zeroPaddingOrder = ruleOrder;
    if (!selectors.includes(':root')) return;
    let ancestor = rule.parent;
    let desktopOnly = false;
    while (ancestor) {
      if (ancestor.type === 'atrule' && ancestor.name === 'media') {
        const query = ancestor.params.replaceAll(' ', '');
        desktopOnly = query.includes('pointer:fine') && query.includes('hover:hover') && /1024px/.test(query);
      }
      ancestor = ancestor.parent;
    }
    rule.walkDecls((declaration) => (desktopOnly ? desktopDensity : defaultDensity).set(declaration.prop, declaration.value));
  });
  for (const [token, value] of Object.entries({ '--sidebar-width': '232px', '--app-header-height': '60px', '--button-sm-height': '36px', '--button-height': '38px', '--input-height': '38px', '--card-padding': '16px', '--component-gap': '12px' })) {
    assert.equal(desktopDensity.get(token), value, `${label}: compact desktop ${token}`);
  }
  assert.equal(defaultDensity.get('--button-height'), '44px', `${label}: mobile/coarse pointer button target`);
  assert.equal(defaultDensity.get('--input-height'), '44px', `${label}: mobile/coarse pointer input target`);
  assert.equal(clockRules.get('.tournament-clock.clock-fullscreen:--button-height'), '44px', `${label}: TV controls retain large targets`);
  assert.ok(cardPaddingOrder >= 0 && zeroPaddingOrder > cardPaddingOrder, `${label}: caller p-0 must override default CardContent padding`);
  console.log(`PASS: ${label}: desktop density tokens, mobile/touch and TV target sizes, CardContent padding overrides`);
}

const directory = new URL('../dist/assets/', import.meta.url);
const files = (await readdir(directory)).filter((file) => file.endsWith('.css'));
assert.ok(files.length > 0, 'Run npm.cmd run build before checking production CSS');
verifyCss((await Promise.all(files.map((file) => readFile(new URL(file, directory), 'utf8')))).join('\n'), 'production CSS');

const devArgument = process.argv.find((argument) => argument.startsWith('--dev='));
if (devArgument) {
  const url = new URL('/src/index.css?direct', devArgument.slice('--dev='.length));
  const response = await fetch(url);
  assert.ok(response.ok, `Cannot read live dev CSS at ${url}`);
  verifyCss(await response.text(), `live CSS at ${url.origin}`);
}
