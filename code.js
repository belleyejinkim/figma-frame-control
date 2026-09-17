/*
 * Frame Name Control
 *
 * The plugin API has no switch for the frame name labels drawn on the canvas.
 * Instead, each frame is renamed to U+2800 (Braille Pattern Blank), which
 * renders as nothing, and the original name is kept in the node's plugin data.
 * Plugin data is saved with the file, so names come back even after the plugin
 * or the file has been closed.
 */

var BLANK = '⠀';
var KEY_ORIGINAL = 'fnc_original';
var KEY_HIDDEN = 'fnc_hidden';
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

function isTarget(node) {
  switch (node.type) {
    case 'FRAME':
    case 'SECTION':
    case 'COMPONENT_SET':
      return true;
    case 'COMPONENT':
      // Variant names follow "Property=Value". Renaming one breaks the variant.
      return !(node.parent && node.parent.type === 'COMPONENT_SET');
    default:
      // Instances keep the name that follows their main component.
      return false;
  }
}

// Frames inside sections and groups still show labels on the canvas.
// Frames nested inside other frames don't, so they keep their names.
function showsNestedLabels(node) {
  return node.type === 'SECTION' || node.type === 'GROUP';
}

function walk(container, out) {
  var kids = container.children;
  for (var i = 0; i < kids.length; i++) {
    var node = kids[i];
    if (isTarget(node)) out.push(node);
    if (showsNestedLabels(node)) walk(node, out);
  }
}

function collectTargets(s, forceDocument) {
  var out = [];

  if (!forceDocument && s.scope === 'selection') {
    var sel = figma.currentPage.selection;
    for (var i = 0; i < sel.length; i++) {
      var node = sel[i];
      if (isTarget(node)) out.push(node);
      if (showsNestedLabels(node)) walk(node, out);
    }
    return Promise.resolve(out);
  }

  if (forceDocument || s.scope === 'document') {
    return figma.loadAllPagesAsync().then(function () {
      var pages = figma.root.children;
      for (var p = 0; p < pages.length; p++) walk(pages[p], out);
      return out;
    });
  }

  walk(figma.currentPage, out);
  return Promise.resolve(out);
}

/* ------------------------------------------------------------- hide / show */

function isBlankName(name) {
  return name.replace(/[⠀ㅤ​ \s]/g, '') === '';
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

function runCommand(command, s) {
  var t = messagesFor(s);
  var forceDocument = command === 'restore-all';
  var scopeKey = forceDocument ? 'document' : (t.scope[s.scope] ? s.scope : 'page');

  return collectTargets(s, forceDocument).then(function (targets) {
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
  var command = figma.command || 'settings';

  // Until names have been changed from the window once, every command opens it first,
  // so people read how the plugin renames frames before it does.
  if (command === 'settings' || !settings.onboarded) {
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
