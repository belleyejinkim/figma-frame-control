#!/bin/sh
set -eu

# Download only the files Figma needs. Re-running this script updates them.
install_dir=${FIGMA_FRAME_CONTROL_DIR:-"$HOME/FigmaPlugins/figma-frame-control"}
base_url=https://raw.githubusercontent.com/belleyejinkim/figma-frame-control/main

if ! command -v curl >/dev/null 2>&1; then
    printf '%s\n' 'Error: curl is required to install Frame Name Control.' >&2
    exit 1
fi

if [ -e "$install_dir" ] && [ ! -d "$install_dir" ]; then
    printf 'Error: the install path is not a directory: %s\n' "$install_dir" >&2
    exit 1
fi

download_dir=$(mktemp -d)
trap 'rm -rf "$download_dir"' EXIT
trap 'exit 1' HUP INT TERM

printf '%s\n' 'Downloading Frame Name Control...'
for file in manifest.json code.js ui.html; do
    if ! curl -fsSL --connect-timeout 15 --retry 2 "$base_url/$file" -o "$download_dir/$file"; then
        printf 'Error: could not download %s. Existing plugin files were left unchanged.\n' "$file" >&2
        exit 1
    fi
    if [ ! -s "$download_dir/$file" ]; then
        printf 'Error: %s is empty. Existing plugin files were left unchanged.\n' "$file" >&2
        exit 1
    fi
done

mkdir -p "$install_dir"
for file in manifest.json code.js ui.html; do
    mv "$download_dir/$file" "$install_dir/$file"
done

manifest_path="$install_dir/manifest.json"
if command -v cygpath >/dev/null 2>&1; then
    manifest_path=$(cygpath -w "$manifest_path")
fi

printf '\nPlugin files installed at: %s\n' "$install_dir"
printf '%s\n' 'One-time setup in the Figma desktop app:'
printf '%s\n' '1. Open any design file.'
printf '%s\n' '2. Choose Plugins > Development > Import plugin from manifest...'
printf '3. Select: %s\n' "$manifest_path"
printf '%s\n' 'Then run Plugins > Development > Frame Name Control > Open.'
