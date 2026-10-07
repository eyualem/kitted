// Kitted design system for React Native (Expo, TypeScript, iOS first).
// Spec: /Users/eyu/Desktop/files/Kitted/handoff/03-design-system.md (owns every value here).
// Copy this folder to <app>/src/design-system/ (fonts.ts assumes <app>/assets/fonts/), delete
// `_stubs/` and `tsconfig.json` once react-native, expo-* and @types/react are installed, and
// wrap the root layout in <ThemeProvider>.
//
// Packages it needs (install with `npx expo install …` so versions match the SDK):
//   expo-font, expo-symbols, expo-glass-effect, expo-blur. Nothing else.

export * from './tokens';
export * from './typography';
export * from './score';
export * from './symbols';
export * from './fonts';
export * from './theme';
export * from './components';
