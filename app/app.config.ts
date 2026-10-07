import type { ExpoConfig } from 'expo/config';

// Demo tools (demo/* routes, scripted story, demo store) are on unless KITTED_DEMO=0 (App Store builds).
const demo = process.env.KITTED_DEMO !== '0';

const config: ExpoConfig = {
  name: 'Kitted',
  slug: 'kitted',
  scheme: 'kitted',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  icon: './assets/images/icon.png',
  ios: {
    bundleIdentifier: 'com.trykitted.kitted', // placeholder until the App ID exists; keep it only here
    buildNumber: '1',
    supportsTablet: false,
    icon: './assets/expo.icon',
    infoPlist: {
      NSCameraUsageDescription:
        'Kitted uses the camera to check your outfit. Your face is cropped out before anything is sent.',
      ITSAppUsesNonExemptEncryption: false,
    },
    privacyManifests: {
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
      ],
    },
    // M4: entitlements: { 'com.apple.developer.declared-age-range': true, 'com.apple.developer.devicecheck.appattest-environment': 'production' }
  },
  android: {
    package: 'com.trykitted.kitted',
    adaptiveIcon: {
      backgroundColor: '#F3F4F6',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { output: 'single', bundler: 'metro', favicon: './assets/images/favicon.png' }, // 'single' (SPA), 05 T26
  plugins: [
    'expo-router',
    ['expo-build-properties', { ios: { deploymentTarget: '26.0' } }],
    [
      'expo-splash-screen',
      { backgroundColor: '#F3F4F6', dark: { backgroundColor: '#0C0E14' }, image: './assets/images/splash-icon.png', imageWidth: 76 },
    ],
    // ['expo-font', { fonts: ['./assets/fonts/ArchivoCondensed-SemiBold.ttf', './assets/fonts/ArchivoCondensed-Medium.ttf', './assets/fonts/ArchivoExpanded-Bold.ttf'] }],
    //   ↑ uncomment once the founder OKs the download and the files exist (a missing file fails prebuild).
    'expo-sqlite',
    ['expo-secure-store', { faceIDPermission: false }], // no Face ID in Kitted; keeps NSFaceIDUsageDescription out (05 T29)
    // PHPicker needs no Photos permission (09 §3); the camera string is set above.
    ['expo-image-picker', { photosPermission: false, cameraPermission: false, microphonePermission: false }],
    // P6: ['expo-media-library', { photosPermission: false, savePhotosPermission: 'Save your Kitted card to Photos.', isAccessMediaLocationEnabled: false }],
    // P6: 'expo-notifications',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { demo },
};

export default config;
