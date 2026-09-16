#!/bin/bash
#
# Bind a keyboard shortcut to a Figma desktop menu item on macOS.
#
#   ./scripts/set-shortcut.sh cmd+opt+f
#   ./scripts/set-shortcut.sh cmd+opt+shift+h --menu "Hide Frame Name Labels"
#   ./scripts/set-shortcut.sh --list
#   ./scripts/set-shortcut.sh --remove
#
# Figma plugins can't register shortcuts themselves. macOS app shortcuts
# (NSUserKeyEquivalents) can, by matching a menu item's exact title.

set -euo pipefail

BUNDLE_ID="com.figma.Desktop"
MENU_TITLE="Toggle Frame Names"
COMBO=""
MODE="set"

while [ $# -gt 0 ]; do
  case "$1" in
    --menu)   MENU_TITLE="$2"; shift 2 ;;
    --list)   MODE="list"; shift ;;
    --remove) MODE="remove"; shift ;;
    -h|--help)
      sed -n '3,11p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *)        COMBO="$1"; shift ;;
  esac
done

restart_hint() {
  if pgrep -x Figma >/dev/null 2>&1; then
    echo "Figma is running. Quit it with ⌘Q and open it again to apply the change."
  else
    echo "The change applies the next time you open Figma."
  fi
}

if [ "$MODE" = "list" ]; then
  echo "Figma app shortcuts:"
  defaults read "$BUNDLE_ID" NSUserKeyEquivalents 2>/dev/null || echo "  (none)"
  exit 0
fi

if [ "$MODE" = "remove" ]; then
  # Remove only this menu title. Other app shortcuts for Figma stay as they are.
  tmp="$(mktemp)"
  trap 'rm -f "$tmp"' EXIT
  defaults export "$BUNDLE_ID" "$tmp"
  if plutil -extract "NSUserKeyEquivalents.$MENU_TITLE" raw "$tmp" >/dev/null 2>&1; then
    plutil -remove "NSUserKeyEquivalents.$MENU_TITLE" "$tmp"
    defaults import "$BUNDLE_ID" "$tmp"
    echo "Removed the shortcut for \"$MENU_TITLE\"."
    restart_hint
  else
    echo "No shortcut is set for \"$MENU_TITLE\"."
  fi
  exit 0
fi

if [ -z "$COMBO" ]; then
  echo "Usage: $0 <combo>   e.g. $0 cmd+opt+f" >&2
  exit 1
fi

# Convert "cmd+opt+f" to NSUserKeyEquivalents notation: ^ Control, ~ Option, $ Shift, @ Command
ctrl=""; opt=""; shift_=""; cmd=""; key=""
IFS='+' read -r -a parts <<< "$(echo "$COMBO" | tr '[:upper:]' '[:lower:]' | tr -d ' ')"

for part in "${parts[@]:-}"; do
  case "$part" in
    ctrl|control|⌃)           ctrl='^' ;;
    opt|option|alt|⌥)         opt='~' ;;
    shift|⇧)                  shift_='$' ;;
    cmd|command|meta|super|⌘) cmd='@' ;;
    "")                       ;;
    *)                        key="$part" ;;
  esac
done

if [ -z "$key" ]; then
  echo "No key found in: $COMBO" >&2
  exit 1
fi
if [ "${#key}" -ne 1 ]; then
  echo "The key must be a single letter, number, or symbol: $key" >&2
  exit 1
fi
# Keys without ⌘ are handled by Figma's canvas (or the input method) and never reach the menu.
if [ -z "$cmd" ]; then
  echo "Figma only responds to shortcuts that include Command (⌘). e.g. cmd+opt+f" >&2
  exit 1
fi

SPEC="${ctrl}${opt}${shift_}${cmd}${key}"
defaults write "$BUNDLE_ID" NSUserKeyEquivalents -dict-add "$MENU_TITLE" "$SPEC"

pretty="${ctrl:+⌃}${opt:+⌥}${shift_:+⇧}${cmd:+⌘}$(echo "$key" | tr '[:lower:]' '[:upper:]')"
echo "Set \"$MENU_TITLE\" → $pretty  ($SPEC)"
restart_hint
