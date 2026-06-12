#!/usr/bin/env bash
# ARCHIVE PATH ONLY — the production app is sfis-app/ (React Native + Expo).
# Re-copies the STALE web prototype (../replica, non-authoritative) into the
# Android assets, builds the debug APK, and installs it on any attached
# device/emulator. Run this after editing anything under ../replica.
#
#   ./sync-and-build.sh           # sync + build
#   ./sync-and-build.sh install   # sync + build + install + launch
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPLICA="$HERE/../replica"
ASSETS="$HERE/app/src/main/assets"
SDK="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
ADB="$SDK/platform-tools/adb"

echo "→ syncing $REPLICA → assets"
rm -rf "$ASSETS"/*
cp -R "$REPLICA/index.html" "$REPLICA/app" "$REPLICA/vendor" "$ASSETS/"

echo "→ building debug APK"
export JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home -v 17)}"
"$HERE/gradlew" -p "$HERE" --no-daemon assembleDebug

APK="$HERE/app/build/outputs/apk/debug/app-debug.apk"
echo "→ built: $APK"

if [ "${1:-}" = "install" ]; then
  echo "→ installing + launching"
  "$ADB" install -r "$APK"
  "$ADB" shell am start -n com.sfis.scanner/.MainActivity
fi
