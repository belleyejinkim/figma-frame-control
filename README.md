# Frame Name Control

[한국어](README.ko.md)

Frame Name Control is a free plugin for Figma that hides the frame name labels on the canvas and brings them back with one click, or with a keyboard shortcut you set up once.

![Click Hide frame names in the plugin window, or press ⌥⌘F, to hide and show the labels on the canvas](assets/cover.gif)

Name labels help you find frames, but they clutter the canvas when you review a layout or share your screen. With Frame Name Control, one click clears them and another brings them back. There's nothing to set up.

## Install

Run this one line in **Terminal on macOS** or **Git Bash on Windows**. You need the [Figma desktop app](https://www.figma.com/downloads/).

```sh
curl -fsSL https://raw.githubusercontent.com/belleyejinkim/figma-frame-control/main/install.sh | sh
```

This downloads the three plugin files to `~/FigmaPlugins/figma-frame-control`. No Git, Node.js, or build step is needed. Run the same command again to update. You can [read the installer](install.sh) before running it.

**One-time setup in Figma:** the command installs the files; Figma requires you to [import the plugin](https://help.figma.com/hc/en-us/articles/360042786733-Create-a-classic-plugin-for-development) once to register it.

1. Open any design file in the Figma desktop app.
2. Choose **Plugins → Development → Import plugin from manifest…** and select `manifest.json` from the folder printed by the installer. Use the **Plugins** menu.
3. Run **Plugins → Development → Frame Name Control → Open** and click **Hide frame names**.

Once imported, the plugin is available in every file. Keep the installed folder in place so Figma can load it. Updating the files does not require another import.

## How to use

![Click Hide frame names in the plugin window to clear the labels, click again to bring them back, pick a scope, use the right panel button, or press ⌥⌘F](assets/usage-en.gif)

1. Open the plugin and click **Hide frame names**. The labels leave the canvas, and Figma says how many names it hid.
2. Click the button again, and every name comes back the way it was.
3. **Scope** decides what changes: this page, all pages, or the layers you selected.
4. After the first run in a file, the **Hide/Show Frame Name** button in the right panel does the same without opening the window.
5. Optional: once you set up the [keyboard shortcut](#keyboard-shortcut-macos-optional) on macOS, **⌥⌘F** hides and shows the names from anywhere in Figma.

## Commands

Most of the time, **Open** is all you need: the plugin window has buttons to hide and restore names. The other commands do the same without the window. The first time you run one of them, the plugin opens its window instead, so you can read how it changes names before you hide them.

| Menu | What it does |
| --- | --- |
| Open | Opens the plugin window. |
| Toggle Frame Names | Hides names, or restores them if they're hidden. |
| Hide Frame Name Labels | Hides names in the current scope. |
| Show Frame Name Labels | Restores names in the current scope. |
| Restore All Frame Names | Restores names on every page, whatever the scope. |

### Right panel button

After the plugin runs a command in a file, a **Hide/Show Frame Name** button appears under **Tools** in the right panel. You see it when nothing is selected, and when you select a frame whose name shows on the canvas, on a page where the plugin has run. Frames you add later get it the next time the plugin runs on that page. Click it to hide or show names without opening a menu. It follows the plugin's scope, so it changes the whole page unless the scope is set to selected layers.

The button is saved with the file, so people who open the file see it too. To remove it from a layer, click **−** next to it. The plugin won't add it back.

### Keyboard shortcut (macOS, optional)

Figma can't give plugins a shortcut, but macOS can bind one to any menu item. It takes a minute, once per computer.

![Walkthrough: in System Settings → Keyboard → Keyboard Shortcuts, pick App Shortcuts, add one for Figma with the menu title Toggle Frame Names, and record ⌥⌘F](assets/shortcut-en.gif)

1. Open **System Settings → Keyboard**, then click **Keyboard Shortcuts…**
2. Pick **App Shortcuts** on the left, then click **+**.
3. Choose **Figma**, and enter `Toggle Frame Names` as the menu title. It has to match exactly, so copy it from the plugin window.
4. Click the shortcut field, press **⌥⌘F**, then click **Done**.
5. Quit Figma with **⌘Q** and open it again.

Now **⌥⌘F** hides and shows frame names from anywhere in Figma. Any combination works as long as it includes **⌘** and Figma doesn't already use it; ⌘F and ⇧⌘F are taken. On Windows, use the button in the right panel.

## Settings

- **Scope**: this page, all pages, or selected layers
- **Language**: auto, English, or Korean

Figma saves your settings per user, so they follow you from file to file.

## How it works

Figma's plugin API can't switch off canvas labels. Instead, the plugin renames each frame to an invisible character, `U+2800` (Braille Pattern Blank), and stores the original name in the layer's plugin data. Plugin data is saved with the file, so names come back even after you close and reopen it.

This approach has side effects:

- **Names look blank in the Layers panel too.** The plugin can't hide the canvas label alone.
- **Collaborators see the change.** Renaming a layer edits the file.
- **Each run adds one undo step.** ⌘Z brings the names back, and version history is a safe fallback.
- **Only frames whose names show on the canvas change.** Figma shows names only for [top-level frames](https://help.figma.com/hc/en-us/articles/360041539473-Frames-in-Figma-Design), which sit directly on the canvas, and frames placed in a section show theirs too. Frames inside other frames or groups, sections, components, variants, and instances keep their names. Renaming a component would also change the names its instances show, so components are left alone.

If you rename a layer while its name is hidden, the plugin keeps your new name when it restores the others.

## Development

```
manifest.json            plugin definition and menu commands
code.js                  hide and restore logic (no build step)
ui.html                  plugin window
test/logic.test.js       tests for the hide and restore logic
assets/                  icon, cover, and the walkthrough images (sources in assets/src)
```

The plugin uses no TypeScript or bundler. After you edit a file, choose **Plugins → Development → Hot reload plugin** in Figma.

The tests run `code.js` against a fake Figma API:

```bash
node test/logic.test.js
```

The images are rendered from the HTML files in `assets/src`. Rebuilding them needs Google Chrome, Pillow, and ffmpeg:

```bash
python3 assets/src/build.py
```

## Feedback

Found a bug or have an idea? Choose **Send feedback** at the bottom of the plugin window, or [fill out the feedback form](https://docs.google.com/forms/d/e/1FAIpQLSeSW8T6jTH7-0Vgd6DsBZE14iGYCRsVAxkcF2ton4zTk7KvVA/viewform). No account needed.

## Author

Made by Belle Kim · [LinkedIn](https://www.linkedin.com/in/belleyejinkim/)

## License

[MIT](LICENSE) © Belle Kim
