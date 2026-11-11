import { Redirect } from 'expo-router';

// The old agreement step (O5), removed by T39 (specs/onboarding-screens.md OS3.2): setup ends on About you and the
// agreement comes on the camera's first open. An old link, or a resume from an install closed here, opens About you.
export default function OnboardingConsent() {
  return <Redirect href="/onboarding/basics" />;
}
