/*
 * Frame Name Control
 *
 * The plugin API has no switch for the frame name labels drawn on the canvas.
 * Instead, each frame is renamed to U+2800 (Braille Pattern Blank), which
 * renders as nothing, and the original name is kept in the node's plugin data.
 * Plugin data is saved with the file, so names come back even after the plugin
 * or the file has been closed.
 */

var BLANK = '\u2800';
var KEY_ORIGINAL = 'fnc_original';
var KEY_HIDDEN = 'fnc_hidden';
var KEY_BUTTON = 'fnc_button';
var SETTINGS_KEY = 'frame-name-control/settings';

// Opened with figma.openExternal, so the plugin itself needs no network access.
var LINKS = {
  feedback: 'https://docs.google.com/forms/d/e/1FAIpQLSeSW8T6jTH7-0Vgd6DsBZE14iGYCRsVAxkcF2ton4zTk7KvVA/viewform',
  github: 'https://github.com/belleyejinkim/figma-frame-control',
  linkedin: 'https://www.linkedin.com/in/belleyejinkim/'
};

var DEFAULTS = {
  scope: 'page',            // 'page' | 'document' | 'selection'
  language: 'auto',         // 'auto' | 'en' | 'ko'
  detectedLanguage: '',     // last language reported by a UI iframe
  onboarded: false          // names have been changed from the plugin window at least once
};

// Only the plugin changes these. The UI's copy can be stale.
var PLUGIN_OWNED = { detectedLanguage: true, onboarded: true };

/* -------------------------------------------------------------------- i18n */

var MESSAGES = {
  en: {
    scope: { page: 'This page', document: 'All pages', selection: 'Selection' },
    empty: {
      page: 'No frames on this page',
      document: 'No frames in this file',
      selection: 'No frames in the selection'
    },
    alreadyHidden: 'Frame names are already hidden',
    nothingHidden: 'No hidden frame names',
    hid: function (n) { return 'Hid ' + n + (n === 1 ? ' name' : ' names'); },
    restored: function (n) { return 'Restored ' + n + (n === 1 ? ' name' : ' names'); },
    error: 'Error: '
  },
  ko: {
    scope: { page: '이 페이지', document: '모든 페이지', selection: '선택 영역' },
    empty: {
      page: '이 페이지에 대상 프레임이 없습니다',
      document: '파일에 대상 프레임이 없습니다',
      selection: '선택 영역에 대상 프레임이 없습니다'
    },
    alreadyHidden: '이미 모두 숨겨져 있습니다',
    nothingHidden: '숨겨진 이름이 없습니다',
    hid: function (n) { return '숨김 ' + n + '개'; },
    restored: function (n) { return '복구 ' + n + '개'; },
    error: '오류: '
  }
};

function normalizeLanguage(tag) {
  return /^ko\b/i.test(tag || '') ? 'ko' : 'en';
}

function languageOf(s) {
  if (s.language === 'en' || s.language === 'ko') return s.language;
  return s.detectedLanguage || '';
}

function messagesFor(s) {
  return MESSAGES[languageOf(s)] || MESSAGES.en;
}

// The plugin sandbox has no navigator. Headless commands open a hidden iframe
// once to read navigator.language, and the answer is remembered afterwards.
function detectLanguage() {
  return new Promise(function (resolve) {
    var settled = false;
    function settle(language) {
      if (settled) return;
      settled = true;
      resolve(language);
    }

    figma.showUI(
      '<script>parent.postMessage({pluginMessage:{type:"language",language:navigator.language}},"*")<\/script>',
      { visible: false }
    );
    figma.ui.onmessage = function (msg) {
      if (msg && msg.type === 'language') settle(normalizeLanguage(msg.language));
    };
    setTimeout(function () { settle('en'); }, 500);
  });
}

function ensureLanguage(s) {
  var language = languageOf(s);
  if (language) return Promise.resolve(language);
  return detectLanguage().then(function (detected) {
    s.detectedLanguage = detected;
    return saveSettings(s).then(function () { return detected; });
  });
}

/* ---------------------------------------------------------------- settings */

function loadSettings() {
  return figma.clientStorage.getAsync(SETTINGS_KEY).then(function (saved) {
    var out = {};
    for (var k in DEFAULTS) out[k] = DEFAULTS[k];
    if (saved) for (var j in saved) if (j in DEFAULTS) out[j] = saved[j];
    return out;
  });
}

function saveSettings(settings) {
  return figma.clientStorage.setAsync(SETTINGS_KEY, settings);
}

/* ----------------------------------------------------------------- targets */

// Figma shows frame names on the canvas only for top-level frames, which sit directly on
// the canvas. Frames placed in a section still show theirs. Frames inside other frames or
// groups, sections, components, and instances don't get renamed.
function isTarget(node) {
  if (node.type !== 'FRAME' || !node.parent) return false;
  return node.parent.type === 'PAGE' || node.parent.type === 'SECTION';
}

function walk(container, out) {
  var kids = container.children;
  for (var i = 0; i < kids.length; i++) {
    var node = kids[i];
    if (isTarget(node)) out.push(node);
    else if (node.type === 'SECTION') walk(node, out);
  }
}

function pagesFor(s, forceDocument) {
  if (forceDocument || s.scope === 'document') {
    return figma.loadAllPagesAsync().then(function () { return figma.root.children; });
  }
  return Promise.resolve([figma.currentPage]);
}

function collectTargets(s, forceDocument) {
  var out = [];
  var seen = {};
  function add(node) {
    if (seen[node.id]) return;
    seen[node.id] = true;
    out.push(node);
  }

  if (!forceDocument && s.scope === 'selection') {
    var sel = figma.currentPage.selection;
    for (var i = 0; i < sel.length; i++) {
      var node = sel[i];
      if (isTarget(node) || isHidden(node)) add(node);
      if (node.type === 'SECTION') {
        var inside = [];
        walk(node, inside);
        for (var j = 0; j < inside.length; j++) add(inside[j]);
      }
    }
    return Promise.resolve(out);
  }

  return pagesFor(s, forceDocument).then(function (pages) {
    for (var p = 0; p < pages.length; p++) {
      var found = [];
      walk(pages[p], found);
      for (var f = 0; f < found.length; f++) add(found[f]);
      // Earlier versions also hid sections, components, and frames in groups. Keep finding
      // names hidden that way so they can still be restored.
      var hidden = pages[p].findAllWithCriteria({ pluginData: { keys: [KEY_HIDDEN] } });
      for (var h = 0; h < hidden.length; h++) if (isHidden(hidden[h])) add(hidden[h]);
    }
    return out;
  });
}

/* ------------------------------------------------------------- hide / show */

function isBlankName(name) {
  return name.replace(/[\u2800\u3164\u200b\u00a0\s]/g, '') === '';
}

function isHidden(node) {
  return node.getPluginData(KEY_HIDDEN) === '1';
}

function hideNode(node) {
  if (isHidden(node)) return false;
  if (isBlankName(node.name)) return false; // saving a blank name would lose the real one
  node.setPluginData(KEY_ORIGINAL, node.name);
  node.setPluginData(KEY_HIDDEN, '1');
  node.name = BLANK;
  return true;
}

function showNode(node) {
  if (!isHidden(node)) return false;
  var original = node.getPluginData(KEY_ORIGINAL);
  // If someone typed a new name while it was hidden, keep that name.
  if (original && isBlankName(node.name)) node.name = original;
  node.setPluginData(KEY_HIDDEN, '');
  node.setPluginData(KEY_ORIGINAL, '');
  return true;
}

function countHidden(targets) {
  var n = 0;
  for (var i = 0; i < targets.length; i++) if (isHidden(targets[i])) n++;
  return n;
}

/* ---------------------------------------------------------------- commands */

// Puts a "Hide/Show Frame Name" button under Tools in the right panel. Figma shows it when
// nothing is selected (data on the document) and when every selected layer carries the data
// itself, so it also goes on each frame the plugin renames.
function addButtons(targets) {
  ensureRelaunchButton(figma.root);
  for (var i = 0; i < targets.length; i++) {
    if (isTarget(targets[i])) ensureRelaunchButton(targets[i]);
  }
}

// An earlier version put the button on every frame, section, and component. Take it off
// the layers that aren't renamed anymore.
function removeOldButtons(pages) {
  for (var p = 0; p < pages.length; p++) {
    var nodes = pages[p].findAllWithCriteria({ pluginData: { keys: [KEY_BUTTON] } });
    for (var i = 0; i < nodes.length; i++) {
      if (isTarget(nodes[i])) continue;
      try {
        nodes[i].setRelaunchData({});
        nodes[i].setPluginData(KEY_BUTTON, '');
      } catch (err) {
        // Layers that can't be changed keep it.
      }
    }
  }
}

function ensureRelaunchButton(node) {
  try {
    // Once added, leave it alone: people can remove it with the "−" next to the button.
    if (node.getPluginData(KEY_BUTTON) === '1') return;
    node.setRelaunchData({ toggle: '' });
    node.setPluginData(KEY_BUTTON, '1');
  } catch (err) {
    // Files you can only view can't store the button. The command still runs.
  }
}

function runCommand(command, s) {
  var t = messagesFor(s);
  var forceDocument = command === 'restore-all';
  var scopeKey = forceDocument ? 'document' : (t.scope[s.scope] ? s.scope : 'page');

  return collectTargets(s, forceDocument).then(function (targets) {
    removeOldButtons(forceDocument || s.scope === 'document' ? figma.root.children : [figma.currentPage]);
    addButtons(targets);

    if (targets.length === 0) {
      return { changed: 0, hidden: 0, total: 0, message: t.empty[scopeKey] };
    }

    var action = command;
    if (command === 'toggle') action = countHidden(targets) > 0 ? 'show' : 'hide';
    if (command === 'restore-all') action = 'show';

    var changed = 0;
    for (var i = 0; i < targets.length; i++) {
      if (action === 'hide' ? hideNode(targets[i]) : showNode(targets[i])) changed++;
    }

    var message;
    if (changed === 0) {
      message = action === 'hide' ? t.alreadyHidden : t.nothingHidden;
    } else {
      message = (action === 'hide' ? t.hid(changed) : t.restored(changed)) + ' · ' + t.scope[scopeKey];
    }

    return { changed: changed, hidden: countHidden(targets), total: targets.length, message: message };
  });
}

/* ---------------------------------------------------------------------- UI */

function statusFor(s) {
  return collectTargets(s, false).then(function (targets) {
    return { total: targets.length, hidden: countHidden(targets) };
  });
}

function openUI(settings) {
  figma.showUI(__html__, { width: 380, height: 560, themeColors: true });

  var ready = false;
  var pending = null;

  function push() {
    if (!ready) return Promise.resolve();
    return statusFor(settings).then(function (status) {
      figma.ui.postMessage({
        type: 'state',
        settings: settings,
        status: status,
        language: languageOf(settings) || 'en',
        links: { linkedin: !!LINKS.linkedin }
      });
    });
  }

  // selectionchange fires often, and counting every page is slow in big files.
  function schedulePush() {
    if (pending) clearTimeout(pending);
    pending = setTimeout(function () { pending = null; push(); }, 150);
  }

  function fail(err) {
    figma.notify(messagesFor(settings).error + err.message, { error: true });
  }

  figma.ui.onmessage = function (msg) {
    if (!msg) return;

    if (msg.type === 'ready') {
      ready = true;
      var detected = normalizeLanguage(msg.language);
      if (detected !== settings.detectedLanguage) {
        settings.detectedLanguage = detected;
        saveSettings(settings);
      }
      push();
      return;
    }

    if (msg.type === 'settings') {
      for (var k in msg.settings) {
        if (k in DEFAULTS && !PLUGIN_OWNED[k]) settings[k] = msg.settings[k];
      }
      saveSettings(settings).then(push);
      return;
    }

    if (msg.type === 'run') {
      runCommand(msg.command, settings).then(function (result) {
        figma.notify(result.message);
        if (settings.onboarded) return push();
        // From now on, menu commands and the shortcut run without opening this window.
        settings.onboarded = true;
        return saveSettings(settings).then(push);
      }).catch(fail);
      return;
    }

    if (msg.type === 'open') {
      if (LINKS[msg.link]) figma.openExternal(LINKS[msg.link]);
      return;
    }

    if (msg.type === 'resize') {
      var height = Math.round(Math.max(240, Math.min(680, Number(msg.height) || 560)));
      figma.ui.resize(380, height);
      return;
    }

    if (msg.type === 'close') figma.closePlugin();
  };

  figma.on('selectionchange', schedulePush);
  figma.on('currentpagechange', schedulePush);
}

/* -------------------------------------------------------------------- main */

loadSettings().then(function (settings) {
  var command = figma.command || 'open';

  // Open shows the window with its buttons. Until names have been changed from the window
  // once, the other commands open it too, so people read how the plugin renames frames first.
  // 'settings' is the old name of Open; "Run last plugin" can still ask for it.
  if (command === 'open' || command === 'settings' || !settings.onboarded) {
    openUI(settings);
    return;
  }

  ensureLanguage(settings).then(function () {
    return runCommand(command, settings);
  }).then(function (result) {
    figma.closePlugin(result.message);
  }).catch(function (err) {
    figma.closePlugin(messagesFor(settings).error + err.message);
  });
});
