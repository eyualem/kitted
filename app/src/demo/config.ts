import Constants from 'expo-constants';

/** Demo tools (demo/* routes, scripted story, demo store). Off in App Store builds (KITTED_DEMO=0). */
export const DEMO_ENABLED: boolean = Constants.expoConfig?.extra?.demo !== false;
