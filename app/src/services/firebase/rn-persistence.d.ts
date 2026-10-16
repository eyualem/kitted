// firebase/auth's React Native build exports getReactNativePersistence, but TypeScript resolves the browser typings
// (no "react-native" condition), so it's declared here. Metro loads the RN build at runtime on iOS.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
