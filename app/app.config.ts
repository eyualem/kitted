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
/** The same once WeatherKit is on (APPLE.paid): Apple Weather first, NWS when it's down (#366). Not yet OK'd by the founder. */
const LOCATION_USAGE_PAID = "Kitted uses your approximate location to get today's weather for your outfit idea. It goes only to Apple Weather (or the US National Weather Service if that's down) and is never stored.";

/**
 * THE PAID-TEAM SWITCH (09 §27 S1–S3, #366). The one place the $99 program's features turn on. Off: the founder's free
 * Personal Team, no entitlements (a Personal Team can't sign them), NWS weather. On (approval day, market/app-store-connect.md
 * §8): the paid team's ID, the entitlements for Declared Age Range, App Attest, WeatherKit and Sign in with Apple
 * (EAS turns the matching capabilities on for the App ID), Apple Weather first in the app (src/config/apple.ts), and the
 * location string that names it. Sign in with Apple's button and App Check still need their packages (the founder's OK).
 */
const APPLE = {
  paid: false,
  /** The paid team's 10-character Team ID (developer.apple.com → Membership). Required when `paid` is true. */
  teamId: '',
};
const FREE_TEAM_ID = '6652QVRQAL';

/** What the switch sets (pure, for the tests: src/__tests__/approvalDay.test.ts). */
export function appleSettings(apple: { paid: boolean; teamId: string }, easProfile: string | undefined) {
  if (!apple.paid) return { teamId: FREE_TEAM_ID, entitlements: {}, locationUsage: LOCATION_USAGE, applePaid: false };
  if (!/^[A-Z0-9]{10}$/.test(apple.teamId)) {
    throw new Error("app.config.ts: APPLE.paid is on, so APPLE.teamId must be the paid team's 10-character Team ID.");
  }
  return {
    teamId: apple.teamId,
    // Apple's keys. App Attest's environment follows the build: development for the dev client.
    entitlements: {
      'com.apple.developer.declared-age-range': true,
      'com.apple.developer.devicecheck.appattest-environment': easProfile === 'development' ? 'development' : 'production',
      'com.apple.developer.weatherkit': true,
      'com.apple.developer.applesignin': ['Default'],
    },
    locationUsage: LOCATION_USAGE_PAID,
    applePaid: true,
  };
}

/** EAS sets this on its builders: development / preview / production (eas.json). Unset on local runs. */
const easProfile = process.env.EAS_BUILD_PROFILE;

/** A store or internal Release build without the Firebase web key can't make the guest account, so every check and
 *  question would fail (09 §27 A2). Locally the key comes from app/.env.local; on EAS from its environment variables. */
export function requireFirebaseKey(profile: string | undefined, key: string | undefined): void {
  if ((profile === 'preview' || profile === 'production') && !key) {
    throw new Error(`app.config.ts: the "${profile}" build has no EXPO_PUBLIC_FIREBASE_API_KEY. Add it to EAS's ${profile} environment (market/app-store-connect.md §8).`);
  }
}
requireFirebaseKey(easProfile, process.env.EXPO_PUBLIC_FIREBASE_API_KEY);

const apple = appleSettings(APPLE, easProfile);

/** One collected-data entry: used only for the app to work, never for tracking. */
function collected(type: string, linked: boolean) {
  return {
    NSPrivacyCollectedDataType: type,
    NSPrivacyCollectedDataTypeLinked: linked,
    NSPrivacyCollectedDataTypeTracking: false,
    NSPrivacyCollectedDataTypePurposes: ['NSPrivacyCollectedDataTypePurposeAppFunctionality'],
  };
}

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
    // The founder's free Personal Team (7-day dev installs on his iPhone) until the paid-team switch (APPLE above).
    appleTeamId: apple.teamId,
    buildNumber: '1',
    supportsTablet: false,
    icon: './assets/expo.icon',
    infoPlist: {
      NSCameraUsageDescription: CAMERA_USAGE,
      NSMicrophoneUsageDescription: MIC_USAGE,
      NSSpeechRecognitionUsageDescription: SPEECH_USAGE,
      // When-in-use only, and approximate by default (iOS shows "Precise: Off"); no background location.
      NSLocationWhenInUseUsageDescription: apple.locationUsage,
      NSLocationDefaultAccuracyReduced: true,
      ITSAppUsesNonExemptEncryption: false,
    },
    // The app's own privacy manifest (09 §27 P1–P2, #366). Pods that ship their own manifest inside a resource bundle
    // are merged in at pod install; prebuilt ones (ExpoFileSystem, ExpoMediaLibrary) drop theirs, so every required-reason
    // API the app or a pod uses is declared here too. Collected data = market/app-store-connect.md §5 (keep them equal).
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyAccessedAPITypes: [
        // AsyncStorage-like settings: RN, expo-constants, expo-system-ui, expo-sharing, the dev launcher.
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults', NSPrivacyAccessedAPITypeReasons: ['CA92.1'] },
        // Dates of files in the app's own folders: the photo, detail-copy and cut-out clean-ups (KittedPrep, privacy/files.ts).
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp', NSPrivacyAccessedAPITypeReasons: ['C617.1'] },
        // Elapsed time (RN timers, expo-device's uptime).
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime', NSPrivacyAccessedAPITypeReasons: ['35F9.1'] },
        // expo-file-system checks free space before writing (its prebuilt framework drops its own manifest).
        { NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace', NSPrivacyAccessedAPITypeReasons: ['E174.1'] },
      ],
      NSPrivacyCollectedDataTypes: [
        // The face-blurred copy of a fit photo, to Google's Gemini through our server (kept up to 55 days for abuse checks).
        collected('NSPrivacyCollectedDataTypePhotosorVideos', false),
        // Questions to Kit (text), to OpenAI through our server (up to 30 days).
        collected('NSPrivacyCollectedDataTypeOtherUserContent', false),
        // The Firebase guest account's ID, which the server's daily counts are kept under.
        collected('NSPrivacyCollectedDataTypeUserID', true),
        // The server's per-account daily counts of checks and questions (7 days).
        collected('NSPrivacyCollectedDataTypeProductInteraction', true),
        // Approximate location, to the weather service only, never stored by us.
        collected('NSPrivacyCollectedDataTypeCoarseLocation', false),
      ],
    },
    entitlements: apple.entitlements,
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
      // The launch screen (T92): the icon's own navy and its K, 96 pt wide (founder, Nov 11: "a bit smaller" than 120), the same in light and dark so opening the app
      // from its icon feels like one motion. iOS shows it only when it starts the app, never on a return from the background.
      { backgroundColor: '#1D2851', dark: { backgroundColor: '#1D2851' }, image: './assets/images/splash-k.png', imageWidth: 96 },
    ],
    // Archivo (OFL 1.1, assets/fonts/OFL.txt): score numerals + wordmark only (03 §3.4). Founder OK Oct 12.
    ['expo-font', { fonts: ['./assets/fonts/ArchivoCondensed-SemiBold.ttf', './assets/fonts/ArchivoCondensed-Medium.ttf', './assets/fonts/ArchivoExpanded-Bold.ttf'] }],
    'expo-sqlite',
    // Continue with Google (#295): Google's sign-in sheet returns to the app through this URL scheme, the reversed iOS
    // client ID (src/config/firebase.ts GOOGLE_IOS_CLIENT_ID).
    ['@react-native-google-signin/google-signin', { iosUrlScheme: 'com.googleusercontent.apps.1069635510987-h35362quu682rbpvvsdhqdkp4ic295v9' }],
    // Continue with Apple (T41): this plugin adds the Sign in with Apple entitlement (com.apple.developer.applesignin) on its
    // own, whatever APPLE.paid says, so the paid-team switch above stays off and Apple's weather stays off with it. The
    // package needs the founder's next npm install; scripts/check-release-app.js expects the entitlement in every build.
    'expo-apple-authentication',
    ['expo-secure-store', { faceIDPermission: false }], // no Face ID in Kitted; keeps NSFaceIDUsageDescription out (05 T29)
    // PHPicker needs no Photos permission (09 §3). cameraPermission must be the SAME string as
    // NSCameraUsageDescription above: `false` deletes that key, and iOS then kills the app the
    // moment the camera asks for access (DECISIONS-LOG #53).
    ['expo-image-picker', { photosPermission: false, cameraPermission: CAMERA_USAGE, microphonePermission: MIC_USAGE }],
    // The share card's Save (#345): add-only, so Kitted can put a card in Photos but never read the library.
    ['expo-media-library', { photosPermission: false, savePhotosPermission: 'Save your Kitted card to Photos.', isAccessMediaLocationEnabled: false, granularPermissions: [] }],
    // The Pro subscription's local StoreKit file on the Debug scheme's Run (09 §27 K2); Release and Archive never use it.
    './plugins/withStoreKitConfig.js',
    // P6: 'expo-notifications',
  ],
  experiments: { typedRoutes: true, reactCompiler: true },
  // The EAS project @matemind/kitted (made Nov 8 with `eas init`); EAS builds and submits read it.
  extra: { demo, applePaid: apple.applePaid, eas: { projectId: 'a8fb4438-eccf-4126-be62-873103370419' } },
  owner: 'matemind',
};

export default config;
