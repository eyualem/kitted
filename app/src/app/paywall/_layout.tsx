// Paywall: a full-screen cover with its own stack for page 2 (plans), 02 D18 / P1b.
import { Stack } from 'expo-router';

export default function PaywallStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
