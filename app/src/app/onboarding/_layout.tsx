// Onboarding: its own stack behind the onboarding guard. No tab bar (the tabs aren't mounted
// yet) and Back, not X (02 §1.2). The steps draw their own Back control (P4).
import { Stack } from 'expo-router';

export default function OnboardingStack() {
  return <Stack initialRouteName="welcome" screenOptions={{ headerShown: false }} />;
}
