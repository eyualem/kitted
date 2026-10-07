// Web preview stand-in for the Keychain (expo-secure-store has no web support). In memory.
let ageBlocked = false;
let deviceId: string | null = null;

export async function getAgeBlocked(): Promise<boolean> {
  return ageBlocked;
}
export async function setAgeBlocked(blocked: boolean): Promise<void> {
  ageBlocked = blocked;
}
export async function getDeviceId(): Promise<string | null> {
  return deviceId;
}
export async function setDeviceId(id: string): Promise<void> {
  deviceId = id;
}
export async function clearDeviceId(): Promise<void> {
  deviceId = null;
}
