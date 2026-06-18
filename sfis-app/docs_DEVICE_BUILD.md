# Running Anvara on a real phone (Samsung S24) — real OCR

The camera/OCR path uses the native `anvara-ocr` module, so it needs a **dev build**
(not Expo Go). Two ways: local USB (fastest) or EAS cloud build.

## A. Local build over USB (recommended for the S24)
1. **On the S24:** Settings → About phone → Software information → tap **Build number** 7×
   to unlock Developer options. Then Settings → Developer options → enable **USB debugging**.
2. Plug the S24 into the Mac with a USB-C cable. On the phone, tap **Allow** when it asks
   to trust this computer.
3. Confirm the Mac sees it:
   ```sh
   ~/Library/Android/sdk/platform-tools/adb devices
   ```
   You should see the device serial listed as `device` (not `unauthorized`).
4. One-time native deps (owner runs):
   ```sh
   cd sfis-app
   npx expo install expo-dev-client expo-build-properties
   ```
5. Build + install onto the phone (compiles the OCR module in):
   ```sh
   npx expo run:android --device
   ```
   First run is slow (Gradle). After it installs, the app opens on the S24 and the
   camera scan path runs real on-device OCR.

## B. EAS cloud build (no Android toolchain needed locally)
1. `npm i -g eas-cli && eas login` (needs a free Expo account).
2. `eas build --profile development --platform android` (uses the `development`
   profile in `eas.json`).
3. Scan the QR / download the APK to the S24 and install (allow "unknown sources").

## What to verify on the first device run
- Camera permission prompt appears (string set in app.json).
- A real photo of an English ingredient label returns OCR text, then findings.
- The `URL`/`file://` path coercion round-trips (iOS vs Android string handling).
- Non-English label → the honest "we may not have read this label" notice fires.

> App icon/splash + brand fonts are still asset-blocked (see assets/fonts/FONTS.md);
> the build works without them (system font + default icon).
