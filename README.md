# Frame Name Control

[한국어](README.ko.md)

Frame Name Control is a free Figma plugin that hides the frame name labels on the canvas and brings them back with one keyboard shortcut.

![Press ⌘⌥F to hide frame name labels, and press it again to bring them back](assets/cover.gif)

Name labels help you find frames, but they clutter the canvas when you review a layout or share your screen. With Frame Name Control, one keypress clears them and the same keypress brings them back. Its menu commands keep fixed names, which lets you bind a macOS keyboard shortcut.

## Install

**Figma Community**: coming soon. The link will appear here once Figma approves the plugin.

**From source**

1. Download this repository (**Code → Download ZIP**) and unzip it.
2. Open any design file in the Figma desktop app.
3. Choose **Plugins → Development → Import plugin from manifest…** and select `manifest.json`.

You import the plugin once, and it appears in every file. The first time you run a command, the plugin explains how it changes names and waits for you to confirm.

Import through the **Plugins** menu, not **Widgets**. Importing through Widgets fails with this error:

```
Manifest error: Expected "manifest.containsWidget" to have type true but got undefined instead
```

## Set up a shortcut (macOS)

1. Open **System Settings → Keyboard → Keyboard Shortcuts… → App Shortcuts**.
2. Click **+**, choose **Figma**, and enter the menu title `Toggle Frame Names` exactly.
3. Click the shortcut field, press **⌥⌘F**, and click **Done**.
4. Quit Figma with **⌘Q** and open it again.

⌥⌘F is awkward to press with one hand. Hold **⌘⌥** on the right side of the keyboard with your right hand, and press **F** with your left.

The plugin's **Frame Name Settings** screen walks you through the same steps for the shortcut you record. You can also register the shortcut from Terminal:

```bash
./scripts/set-shortcut.sh cmd+opt+f     # set
./scripts/set-shortcut.sh --list        # check
./scripts/set-shortcut.sh --remove      # remove
```

### Why the shortcut needs ⌘

A shortcut like ⇧F registers and even shows up in the menu, but pressing it does nothing. Keys without ⌘ go to Figma's canvas before the menu sees them. If you type in a language like Korean, the input method also turns the key into a character first. A shortcut with ⌘ gets past both, as long as Figma doesn't already use it.

Figma already uses ⌘F (Find) and ⇧⌘F (Find Next), but ⌥⌘F is free. Avoid ⌥⌘H, which macOS uses for Hide Others.

### Without setup

Run the plugin once, then press **⌥⌘P** (Run last plugin). Until you run a different plugin, ⌥⌘P toggles frame names.

### Windows

App shortcuts are a macOS feature. On Windows, run the plugin once, then press **Ctrl+Alt+P** to run it again.

## Commands

| Menu | What it does |
| --- | --- |
| Toggle Frame Names | Hides names, or restores them if they're hidden. Bind your shortcut to this command. |
| Hide Frame Name Labels | Hides names in the current scope. |
| Show Frame Name Labels | Restores names in the current scope. |
| Restore All Frame Names | Restores names on every page, whatever the scope. |
| Frame Name Settings | Opens the settings screen. |

## Settings

- **Scope**: this page, all pages, or selected layers
- **Targets**: sections, components, instances, and nested frames (frames are always included)
- **Language**: auto, English, or Korean

Figma saves your settings per user, so they follow you from file to file.

## How it works

Figma's plugin API can't switch off canvas labels. Instead, the plugin renames each frame to an invisible character, `U+2800` (Braille Pattern Blank), and stores the original name in the layer's plugin data. Plugin data is saved with the file, so names come back even after you close and reopen it.

This approach has side effects:

- **Names look blank in the Layers panel too.** The plugin can't hide the canvas label alone.
- **Collaborators see the change.** Renaming a layer edits the file.
- **Each run adds one undo step.** ⌘Z brings the names back, and version history is a safe fallback.
- **Instances are off by default.** Renaming an instance unlinks it from its main component's name, so it keeps a manual name after you restore it.
- **Variant components are never renamed.** Their `Property=Value` names define the variants.

If you rename a layer while its name is hidden, the plugin keeps your new name when it restores the others.

## Troubleshooting

**The shortcut does nothing**

1. Run `./scripts/set-shortcut.sh --list` and check that the title reads `Toggle Frame Names` exactly.
2. Quit Figma with **⌘Q** and open it again. Closing the window isn't enough.
3. Find **Frame Name Control** in the **Plugins** menu and check that your shortcut appears next to `Toggle Frame Names`. If it doesn't, Figma hasn't loaded the new setting yet.
4. If the shortcut appears but still does nothing, make sure it includes **⌘**.

## Development

```
manifest.json            plugin definition and menu commands
code.js                  hide and restore logic (no build step)
ui.html                  settings screen and shortcut helper
scripts/set-shortcut.sh  registers a macOS app shortcut
test/logic.test.js       tests for the hide and restore logic
assets/                  Figma Community icon, cover image, GIF, and video
```

The plugin uses no TypeScript or bundler. After you edit a file, choose **Plugins → Development → Hot reload plugin** in Figma.

The tests run `code.js` against a fake Figma API:

```bash
node test/logic.test.js
```

The icon and cover assets are built from the HTML files in `assets/src`. Rebuilding them needs Google Chrome, Pillow, and ffmpeg:

```bash
python3 assets/src/build.py
```

## Feedback

Found a bug or have an idea? Choose **Send feedback** at the bottom of the plugin window, or [open an issue](https://github.com/belleyejinkim/figma-frame-control/issues/new?template=feedback.yml).

## Author

Made by Belle Kim · [LinkedIn](https://www.linkedin.com/in/belleyejinkim/)

## License

[MIT](LICENSE) © Belle Kim
