import type { ExpoConfig } from 'expo/config';

// Demo tools (demo/* routes, scripted story, demo store, ?resetData): KITTED_DEMO=1 on, KITTED_DEMO=0 off; unset, they
// follow the build: on in Debug, off in Release (src/demo/config.ts reads `__DEV__`), so a Release build is safe by
// default (09 §20.7 R1, #323). The Maestro demo build (05 §P7) sets KITTED_DEMO=1.
const demo = process.env.KITTED_DEMO === '1' ? true : process.env.KITTED_DEMO === '0' ? false : null;

/** The camera prompt's reason (Apple 5.1.1); used by both the plist and the picker plugin. */
const CAMERA_USAGE = 'Kitted uses the camera to check your outfit. Faces are blurred before anything is sent.';
/** The composer's mic (DECISIONS-LOG #70). Used for the plist AND the picker plugin: `false` there deletes the key (#53). */
const MIC_USAGE = 'Kitted uses the microphone so you can ask your stylist out loud. Your voice is turned into text on your phone.';
const SPEECH_USAGE = 'Kitted turns what you say into text on your phone, so you can ask your stylist out loud.';
/** The morning card's weather (02 "S1d", DECISIONS-LOG #58): approximate location, asked only from the card. */
const LOCATION_USAGE = "Kitted uses your approximate location to get today's weather for your outfit idea. It goes only to the US National Weather Service and is never stored.";

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
    // The founder's free Personal Team (7-day dev installs on his iPhone). The paid team replaces it (M4).
    appleTeamId: '6652QVRQAL',
    buildNumber: '1',
    supportsTablet: false,
    icon: './assets/expo.icon',
    infoPlist: {
      NSCameraUsageDescription: CAMERA_USAGE,
      NSMicrophoneUsageDescription: MIC_USAGE,
      NSSpeechRecognitionUsageDescription: SPEECH_USAGE,
      // When-in-use only, and approximate by default (iOS shows "Precise: Off"); no background location.
      NSLocationWhenInUseUsageDescription: LOCATION_USAGE,
      NSLocationDefaultAccuracyReduced: true,
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
      backgroundColor: '#1D2851', // the K icon's navy (DECISIONS-LOG #263)
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
    // Archivo (OFL 1.1, assets/fonts/OFL.txt): score numerals + wordmark only (03 §3.4). Founder OK Oct 12.
    ['expo-font', { fonts: ['./assets/fonts/ArchivoCondensed-SemiBold.ttf', './assets/fonts/ArchivoCondensed-Medium.ttf', './assets/fonts/ArchivoExpanded-Bold.ttf'] }],
    'expo-sqlite',
    // Continue with Google (#295): Google's sign-in sheet returns to the app through this URL scheme, the reversed iOS
    // client ID (src/config/firebase.ts GOOGLE_IOS_CLIENT_ID).
    ['@react-native-google-signin/google-signin', { iosUrlScheme: 'com.googleusercontent.apps.1069635510987-h35362quu682rbpvvsdhqdkp4ic295v9' }],
    ['expo-secure-store', { faceIDPermission: false }], // no Face ID in Kitted; keeps NSFaceIDUsageDescription out (05 T29)
    // PHPicker needs no Photos permission (09 §3). cameraPermission must be the SAME string as
    // NSCameraUsageDescription above: `false` deletes that key, and iOS then kills the app the
    // moment the camera asks for access (DECISIONS-LOG #53).
    ['expo-image-picker', { photosPermission: false, cameraPermission: CAMERA_USAGE, microphonePermission: MIC_USAGE }],
    // P6: ['expo-media-library', { photosPermission: false, savePhotosPermission: 'Save your Kitted card to Photos.', isAccessMediaLocationEnabled: false }],
    // P6: 'expo-notifications',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  extra: { demo },
};

export default config;
