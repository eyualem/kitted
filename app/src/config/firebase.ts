// The Firebase project (handoff/11-firestore-schema.md, #293–295): kitted-a5b45, the "Kitted app (JS SDK)" web app's
// config. These are public identifiers, not secrets (the security rules and, later, App Check guard the data). The API
// key still comes from app/.env.local (EXPO_PUBLIC_FIREBASE_API_KEY): the repo's pre-commit check refuses anything
// shaped like a Google key. Google Sign-In's iOS client comes from the "Kitted iOS" app's config.
export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: 'kitted-a5b45.firebaseapp.com',
  projectId: 'kitted-a5b45',
  storageBucket: 'kitted-a5b45.firebasestorage.app',
  messagingSenderId: '1069635510987',
  appId: '1:1069635510987:web:0a978290f1266d6764f14e',
} as const;

/** Google Sign-In on iPhone: the "Kitted iOS" app's OAuth client (GoogleService-Info.plist CLIENT_ID). Its reversed
 *  form is the URL scheme in app.config.ts (GOOGLE_IOS_URL_SCHEME there); keep the two in step. */
export const GOOGLE_IOS_CLIENT_ID: string = '1069635510987-h35362quu682rbpvvsdhqdkp4ic295v9.apps.googleusercontent.com';
