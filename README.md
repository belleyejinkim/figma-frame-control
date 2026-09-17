# Frame Name Control

[한국어](README.ko.md)

Frame Name Control is a free plugin for Figma that hides the frame name labels on the canvas and brings them back with one click.

![Click Hide frame names to hide the labels on the canvas, then click again to bring them back](assets/cover.gif)

Name labels help you find frames, but they clutter the canvas when you review a layout or share your screen. With Frame Name Control, one click clears them and another brings them back. There's nothing to set up.

## Install

### In Figma

Frame Name Control is coming soon to Figma Community. Once it's published, you can install it without leaving Figma:

1. Open any design file in Figma.
2. Press **⌘K** (Windows: **Ctrl+K**) to open **Actions**, then choose the **Plugins & widgets** tab.
3. Search for **Frame Name Control** and choose **Open**.
4. Click **Hide frame names**. Click it again to bring the names back.

After the first run, the plugin shows up in your recent plugins, so it's easy to find again.

### From source

Use this to develop the plugin or to try changes before they're published. It needs the Figma desktop app.

1. Download this repository (**Code → Download ZIP**) and unzip it.
2. Open any design file in the Figma desktop app.
3. Choose **Plugins → Development → Import plugin from manifest…** and select `manifest.json`.

You import the plugin once, and it appears in every file. Import through the **Plugins** menu, not **Widgets**. Importing through Widgets fails with this error:

```
Manifest error: Expected "manifest.containsWidget" to have type true but got undefined instead
```

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

After the plugin runs a command in a file, a **Hide/Show Frame Name** button appears under **Tools** in the right panel. You see it when nothing is selected, and when you select frames, sections, or components the plugin has handled. Click it to hide or show names without opening a menu. It follows the plugin's scope, so it changes the whole page unless the scope is set to selected layers.

The button is saved with the file, so people who open the file see it too. To remove it from a layer, click **−** next to it. The plugin won't add it back.

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
- **Instances and nested frames keep their names.** Renaming an instance would unlink it from its main component's name, and frames nested inside other frames don't show labels on the canvas.
- **Variant components are never renamed.** Their `Property=Value` names define the variants.

If you rename a layer while its name is hidden, the plugin keeps your new name when it restores the others.

## Development

```
manifest.json            plugin definition and menu commands
code.js                  hide and restore logic (no build step)
ui.html                  plugin window
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

Found a bug or have an idea? Choose **Send feedback** at the bottom of the plugin window, or [fill out the feedback form](https://docs.google.com/forms/d/e/1FAIpQLSeSW8T6jTH7-0Vgd6DsBZE14iGYCRsVAxkcF2ton4zTk7KvVA/viewform). No account needed.

## Author

Made by Belle Kim · [LinkedIn](https://www.linkedin.com/in/belleyejinkim/)

## License

[MIT](LICENSE) © Belle Kim
