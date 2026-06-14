// brandFonts.js — brand font activation scaffold.
//
// STATUS: NOT YET ACTIVE — needs (1) `npx expo install expo-font` and (2) the
// .ttf binaries dropped into assets/fonts/ (see assets/fonts/FONTS.md). Until
// then the app runs on the system font (tokens.js leaves families undefined, so
// there is no crash and no missing-font box).
//
// To activate: install expo-font, add the binaries, then in App.js:
//     import { useBrandFonts, BRAND_FONTS } from './src/theme/brandFonts';
//     const fontsReady = useBrandFonts();
//     // gate first paint on fontsReady, then set tokens.serif/sans/mono to the
//     // family names below.

export const BRAND_FONTS = {
  serif: 'SourceSerif4',   // headings / product names  → Source Serif 4
  sans: 'HankenGrotesk',   // body / UI                 → Hanken Grotesk
  mono: 'SplineSansMono',  // metadata / dates / counts → Spline Sans Mono
};

// The map expo-font's useFonts() expects once the binaries exist:
//   import { useFonts } from 'expo-font';
//   export function useBrandFonts() {
//     const [loaded] = useFonts({
//       SourceSerif4: require('../../assets/fonts/SourceSerif4-Regular.ttf'),
//       SourceSerif4SemiBold: require('../../assets/fonts/SourceSerif4-SemiBold.ttf'),
//       HankenGrotesk: require('../../assets/fonts/HankenGrotesk-Regular.ttf'),
//       HankenGroteskBold: require('../../assets/fonts/HankenGrotesk-Bold.ttf'),
//       SplineSansMono: require('../../assets/fonts/SplineSansMono-Regular.ttf'),
//     });
//     return loaded;
//   }
//
// Kept commented so the bundler doesn't fail on the not-yet-present requires.
export function useBrandFonts() {
  return true; // system-font fallback path: always "ready"
}
