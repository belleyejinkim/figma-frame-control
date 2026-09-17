// Runs code.js against a fake `figma` global. No Figma needed:
//   node test/logic.test.js

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'code.js'), 'utf8');
const BLANK = '⠀';
const SETTINGS_KEY = 'frame-name-control/settings';

let nextId = 1;

function node(type, name, children, id) {
  const n = { id: id || '1:' + nextId++, type, name, pluginData: {}, relaunch: {}, relaunchWrites: 0 };
  n.getPluginData = key => n.pluginData[key] || '';
  n.setPluginData = (key, value) => { n.pluginData[key] = value; };
  n.getRelaunchData = () => n.relaunch;
  n.setRelaunchData = data => { n.relaunch = data; n.relaunchWrites++; };
  if (children) {
    n.children = children;
    children.forEach(child => { child.parent = n; });
  }
  n.findAllWithCriteria = ({ types }) => {
    const out = [];
    const visit = parent => (parent.children || []).forEach(child => {
      if (types.includes(child.type)) out.push(child);
      visit(child);
    });
    visit(n);
    return out;
  };
  return n;
}

function buildDoc() {
  const child = node('FRAME', 'Child');
  const parentFrame = node('FRAME', 'Parent', [child]);
  const inSection = node('FRAME', 'InSection');
  const section = node('SECTION', 'Section S', [inSection]);
  const inGroup = node('FRAME', 'InGroup');
  const group = node('GROUP', 'Group G', [inGroup]);
  const variant = node('COMPONENT', 'Size=Large');
  const componentSet = node('COMPONENT_SET', 'Button', [variant]);
  const component = node('COMPONENT', 'Icon');
  const insideInstance = node('FRAME', 'Inside Instance', null, 'I1:99;2:1');
  const instance = node('INSTANCE', 'Button Instance', [insideInstance]);
  const a = node('FRAME', 'A');
  const b = node('FRAME', 'B');
  const page1 = node('PAGE', 'Page 1', [a, b, section, group, componentSet, component, instance, parentFrame]);
  const page2 = node('PAGE', 'Page 2', [node('FRAME', 'Z')]);
  const root = node('DOCUMENT', 'Doc', [page1, page2]);
  return {
    root, page1, page2,
    n: { a, b, section, inSection, group, inGroup, componentSet, variant, component, instance, insideInstance, parentFrame, child }
  };
}

// Resolves when the plugin closes, or when the UI receives its first state (unless
// opts.onState handles it). Tests start as returning users unless settings say otherwise.
function run(doc, command, opts = {}) {
  const store = opts.store || {};
  if ('settings' in opts) store[SETTINGS_KEY] = Object.assign({ onboarded: true }, opts.settings);
  else if (!store[SETTINGS_KEY]) store[SETTINGS_KEY] = { onboarded: true };
  const result = { closed: null, shownUI: [], uiMessages: [], opened: [], resized: [], store };
  doc.page1.selection = opts.selection || [];

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('plugin did not finish')), 2000);
    const finish = () => { clearTimeout(timer); resolve(result); };

    const ui = {
      onmessage: null,
      postMessage(msg) {
        result.uiMessages.push(msg);
        if (msg.type !== 'state') return;
        if (opts.onState) setImmediate(() => opts.onState(msg, reply => ui.onmessage(reply), finish));
        else finish();
      },
      resize(width, height) { result.resized.push([width, height]); }
    };

    const figma = {
      command,
      root: doc.root,
      currentPage: doc.page1,
      ui,
      clientStorage: {
        getAsync: key => Promise.resolve(store[key]),
        setAsync: (key, value) => { store[key] = JSON.parse(JSON.stringify(value)); return Promise.resolve(); }
      },
      loadAllPagesAsync: () => Promise.resolve(),
      openExternal(url) { result.opened.push(url); },
      notify() {},
      on() {},
      closePlugin(message) { result.closed = message; finish(); },
      showUI(html, options = {}) {
        result.shownUI.push(options);
        const language = opts.language || 'en-US';
        const reply = options.visible === false ? { type: 'language', language } : { type: 'ready', language };
        setImmediate(() => ui.onmessage && ui.onmessage(reply));
      }
    };

    const context = vm.createContext({ figma, __html__: '<ui>', setTimeout, clearTimeout, Promise });
    vm.runInContext(SRC, context, { filename: 'code.js' });
  });
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('toggle hides top-level frames and keeps the original name', async () => {
  const doc = buildDoc();
  await run(doc, 'toggle');
  assert.strictEqual(doc.n.a.name, BLANK);
  assert.strictEqual(doc.n.a.getPluginData('fnc_original'), 'A');
});

test('sections, and frames inside sections and groups, are hidden', async () => {
  const doc = buildDoc();
  await run(doc, 'toggle');
  assert.strictEqual(doc.n.section.name, BLANK);
  assert.strictEqual(doc.n.inSection.name, BLANK);
  assert.strictEqual(doc.n.inGroup.name, BLANK);
});

test('components and component sets are hidden, variants never', async () => {
  const doc = buildDoc();
  await run(doc, 'toggle');
  assert.strictEqual(doc.n.component.name, BLANK);
  assert.strictEqual(doc.n.componentSet.name, BLANK);
  assert.strictEqual(doc.n.variant.name, 'Size=Large');
});

test('instances, nested frames, and other pages keep their names', async () => {
  const doc = buildDoc();
  await run(doc, 'toggle');
  assert.strictEqual(doc.n.instance.name, 'Button Instance');
  assert.strictEqual(doc.n.child.name, 'Child');
  assert.strictEqual(doc.page2.children[0].name, 'Z');
});

test('old target options saved by earlier versions are ignored', async () => {
  const doc = buildDoc();
  await run(doc, 'hide', { settings: { includeInstances: true, includeNested: true, includeSections: false } });
  assert.strictEqual(doc.n.instance.name, 'Button Instance');
  assert.strictEqual(doc.n.child.name, 'Child');
  assert.strictEqual(doc.n.section.name, BLANK);
});

test('a second toggle restores names and clears plugin data', async () => {
  const doc = buildDoc();
  const store = {};
  await run(doc, 'toggle', { store });
  await run(doc, 'toggle', { store });
  assert.strictEqual(doc.n.a.name, 'A');
  assert.strictEqual(doc.n.inSection.name, 'InSection');
  assert.strictEqual(doc.n.a.getPluginData('fnc_hidden'), '');
});

test('document scope reaches other pages, restore-all ignores scope', async () => {
  const doc = buildDoc();
  await run(doc, 'hide', { settings: { scope: 'document' } });
  assert.strictEqual(doc.page2.children[0].name, BLANK);
  await run(doc, 'restore-all', { settings: { scope: 'page' } });
  assert.strictEqual(doc.page2.children[0].name, 'Z');
});

test('a name typed while hidden is kept on restore', async () => {
  const doc = buildDoc();
  await run(doc, 'hide');
  doc.n.a.name = 'Renamed by hand';
  await run(doc, 'show');
  assert.strictEqual(doc.n.a.name, 'Renamed by hand');
  assert.strictEqual(doc.n.a.getPluginData('fnc_hidden'), '');
});

test('hiding twice does not overwrite the original name', async () => {
  const doc = buildDoc();
  await run(doc, 'hide');
  await run(doc, 'hide');
  await run(doc, 'show');
  assert.strictEqual(doc.n.a.name, 'A');
});

test('selection scope touches only the selection', async () => {
  const doc = buildDoc();
  await run(doc, 'hide', { settings: { scope: 'selection' }, selection: [doc.n.b] });
  assert.strictEqual(doc.n.b.name, BLANK);
  assert.strictEqual(doc.n.a.name, 'A');
});

test('selecting a frame leaves the frames nested inside it alone', async () => {
  const doc = buildDoc();
  await run(doc, 'hide', { settings: { scope: 'selection' }, selection: [doc.n.parentFrame] });
  assert.strictEqual(doc.n.parentFrame.name, BLANK);
  assert.strictEqual(doc.n.child.name, 'Child');
});

test('selecting a section hides the frames inside it', async () => {
  const doc = buildDoc();
  await run(doc, 'hide', { settings: { scope: 'selection' }, selection: [doc.n.section] });
  assert.strictEqual(doc.n.section.name, BLANK);
  assert.strictEqual(doc.n.inSection.name, BLANK);
});

test('Open opens the window and sends state after ready', async () => {
  const doc = buildDoc();
  const r = await run(doc, 'open', { language: 'ko-KR' });
  const state = r.uiMessages.find(m => m.type === 'state');
  assert.ok(r.shownUI[0].visible !== false);
  assert.strictEqual(state.language, 'ko');
  assert.ok(state.status.total > 0);
  assert.strictEqual('view' in state, false);
  assert.strictEqual(r.store[SETTINGS_KEY].detectedLanguage, 'ko');
});

test('a headless run detects the language once and remembers it', async () => {
  const doc = buildDoc();
  const store = {};
  const first = await run(doc, 'toggle', { store, language: 'ko-KR' });
  assert.strictEqual(first.shownUI.length, 1);
  assert.strictEqual(first.shownUI[0].visible, false);
  assert.match(first.closed, /^숨김 \d+개 · 이 페이지$/);

  const second = await run(doc, 'toggle', { store, language: 'en-US' });
  assert.strictEqual(second.shownUI.length, 0);
  assert.match(second.closed, /^복구 \d+개 · 이 페이지$/);
});

test('English is used for non-Korean environments', async () => {
  const doc = buildDoc();
  const r = await run(doc, 'toggle', { language: 'en-KR' });
  assert.match(r.closed, /^Hid \d+ names · This page$/);
});

test('a language override skips detection', async () => {
  const doc = buildDoc();
  const r = await run(doc, 'toggle', { settings: { language: 'en' }, language: 'ko-KR' });
  assert.strictEqual(r.shownUI.length, 0);
  assert.match(r.closed, /^Hid /);
});

test('the first command opens the window instead of renaming', async () => {
  const doc = buildDoc();
  const r = await run(doc, 'toggle', { settings: { onboarded: false } });
  assert.ok(r.uiMessages.some(m => m.type === 'state'));
  assert.ok(r.shownUI[0].visible !== false);
  assert.strictEqual(doc.n.a.name, 'A');
});

test('hiding names from the window lets later commands run without it', async () => {
  const doc = buildDoc();
  const store = {};
  let states = 0;
  await run(doc, 'toggle', {
    store,
    settings: { onboarded: false },
    onState: (state, send, done) => {
      states++;
      if (states === 1) send({ type: 'run', command: 'toggle' });
      else done();
    }
  });
  assert.strictEqual(doc.n.a.name, BLANK);
  assert.strictEqual(store[SETTINGS_KEY].onboarded, true);

  const next = await run(doc, 'toggle', { store });
  assert.strictEqual(next.shownUI.length, 0);
  assert.strictEqual(doc.n.a.name, 'A');
});

test('closing the window without running keeps it for the next command', async () => {
  const doc = buildDoc();
  const store = {};
  await run(doc, 'hide', {
    store,
    settings: { onboarded: false },
    onState: (state, send) => send({ type: 'close' })
  });
  assert.strictEqual(doc.n.a.name, 'A');
  assert.strictEqual(store[SETTINGS_KEY].onboarded, false);
});

test('the old Settings command still opens the window', async () => {
  const doc = buildDoc();
  const r = await run(doc, 'settings');
  assert.ok(r.uiMessages.some(m => m.type === 'state'));
  assert.strictEqual(doc.n.a.name, 'A');
});

test('the window cannot reset onboarding or open arbitrary links', async () => {
  const doc = buildDoc();
  const store = {};
  const r = await run(doc, 'open', {
    store,
    onState: (state, send, done) => {
      send({ type: 'settings', settings: Object.assign({}, state.settings, { onboarded: false, scope: 'document' }) });
      send({ type: 'open', link: 'feedback' });
      send({ type: 'open', link: 'https://example.com' });
      send({ type: 'resize', height: 5000 });
      setImmediate(done);
    }
  });
  assert.strictEqual(store[SETTINGS_KEY].onboarded, true);
  assert.strictEqual(store[SETTINGS_KEY].scope, 'document');
  assert.deepStrictEqual(r.opened, ['https://docs.google.com/forms/d/e/1FAIpQLSeSW8T6jTH7-0Vgd6DsBZE14iGYCRsVAxkcF2ton4zTk7KvVA/viewform']);
  assert.deepStrictEqual(r.resized, [[380, 680]]);
});

test('running a command adds the right panel button once per file', async () => {
  const doc = buildDoc();
  const store = {};
  await run(doc, 'toggle', { store });
  // The object comes from the plugin's own vm context, so compare values, not prototypes.
  assert.deepStrictEqual(JSON.parse(JSON.stringify(doc.root.relaunch)), { toggle: '' });
  await run(doc, 'toggle', { store });
  assert.strictEqual(doc.root.relaunchWrites, 1);
});

test('every frame on the page gets the button, including nested frames', async () => {
  const doc = buildDoc();
  const store = {};
  await run(doc, 'toggle', { store });
  for (const key of ['a', 'section', 'inSection', 'inGroup', 'parentFrame', 'child', 'component', 'componentSet', 'variant']) {
    assert.ok('toggle' in doc.n[key].relaunch, key + ' should carry the button');
  }
  for (const key of ['instance', 'insideInstance', 'group']) {
    assert.strictEqual(doc.n[key].relaunchWrites, 0, key + ' should not carry the button');
  }
  assert.strictEqual(doc.n.child.name, 'Child', 'nested frames still keep their names');
  assert.strictEqual(doc.page2.children[0].relaunchWrites, 0, 'other pages wait until the plugin runs there');

  await run(doc, 'toggle', { store });
  assert.strictEqual(doc.n.a.relaunchWrites, 1);
  assert.ok('toggle' in doc.n.a.relaunch, 'restoring names keeps the button');
});

test('all-pages scope adds the button on every page', async () => {
  const doc = buildDoc();
  await run(doc, 'hide', { settings: { scope: 'document' } });
  assert.ok('toggle' in doc.page2.children[0].relaunch);
});

test('a button someone removed from a layer is not added back', async () => {
  const doc = buildDoc();
  const store = {};
  await run(doc, 'toggle', { store });
  doc.n.a.relaunch = {};          // the "−" next to the button in the right panel
  doc.root.relaunch = {};
  await run(doc, 'toggle', { store });
  assert.strictEqual(doc.n.a.relaunchWrites, 1);
  assert.strictEqual('toggle' in doc.n.a.relaunch, false);
  assert.strictEqual(doc.root.relaunchWrites, 1);
});

test('opening the window without running a command adds no button', async () => {
  const doc = buildDoc();
  await run(doc, 'open');
  assert.strictEqual(doc.root.relaunchWrites, 0);
});

test('a file that cannot store the button still runs the command', async () => {
  const doc = buildDoc();
  doc.root.setRelaunchData = () => { throw new Error('view-only'); };
  const r = await run(doc, 'hide');
  assert.strictEqual(doc.n.a.name, BLANK);
  assert.match(r.closed, /^Hid /);
});

(async () => {
  let failed = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log('  ok   ' + name);
    } catch (err) {
      failed++;
      console.log('  FAIL ' + name + '\n       ' + err.message);
    }
  }
  console.log('\n' + (tests.length - failed) + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
