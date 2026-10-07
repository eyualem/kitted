// Keychain (expo-secure-store): the device ID and the age-blocked flag. On iOS these survive
// uninstall/reinstall with the same bundle ID, which the age flag needs (05 S11).
// "Delete all my data" removes the device ID and keeps the age flag.
import * as SecureStore from 'expo-secure-store';

const OPTS: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK };
const AGE_BLOCKED = 'kitted.ageBlocked';
const DEVICE_ID = 'kitted.deviceId';

export async function getAgeBlocked(): Promise<boolean> {
  return (await SecureStore.getItemAsync(AGE_BLOCKED, OPTS)) === '1';
}
export async function setAgeBlocked(blocked: boolean): Promise<void> {
  if (blocked) await SecureStore.setItemAsync(AGE_BLOCKED, '1', OPTS);
  else await SecureStore.deleteItemAsync(AGE_BLOCKED, OPTS);
}
export async function getDeviceId(): Promise<string | null> {
  return SecureStore.getItemAsync(DEVICE_ID, OPTS);
}
export async function setDeviceId(id: string): Promise<void> {
  await SecureStore.setItemAsync(DEVICE_ID, id, OPTS);
}
export async function clearDeviceId(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_ID, OPTS);
}
