# Brand fonts — drop-in instructions

The app runs on the system font until these are added (no crash, no missing-font
boxes — see src/theme/tokens.js). To activate the brand type:

1. `npx expo install expo-font`
2. Download from Google Fonts (SIL Open Font License, free for commercial use) and
   place the .ttf files here with these exact names:
   - Source Serif 4:  SourceSerif4-Regular.ttf, SourceSerif4-SemiBold.ttf
   - Hanken Grotesk:  HankenGrotesk-Regular.ttf, HankenGrotesk-Bold.ttf
   - Spline Sans Mono: SplineSansMono-Regular.ttf
3. Uncomment the real `useBrandFonts` in src/theme/brandFonts.js, gate first paint
   on it in App.js, and set tokens.serif/sans/mono to BRAND_FONTS values.

## App icon / splash / wordmark image
Also asset-blocked: replace assets/icon.png (1024×1024) and the splash with the
Anvara mark. The text Wordmark (src/components/Wordmark.jsx) ships now and needs
no binary.
