// "/" sends you through the gate: age stop → onboarding → Stylist (02 §1.1).
import { Redirect } from 'expo-router';
import { useGate } from '@/state/appGate';
import { resumeHref, resumeStepAtLaunch } from '@/features/onboarding/resume';
import { useTourStop } from '@/features/onboarding/appTour';

export default function Index() {
  const gate = useGate();
  const tourStop = useTourStop();
  if (!gate.ready) return null; // the splash screen is still up
  if (gate.ageBlocked) return <Redirect href="/age-stop" />;
  // Mid-setup last time: back on the step he reached, his answers kept (10-onboarding.md F4).
  if (!gate.onboarded) return <Redirect href={resumeHref(resumeStepAtLaunch())} />;
  // Setup just ended with the app tour: the tour's first stop is Closet, so Stylist (and Kit's hello) stays out of sight.
  if (tourStop !== null) return <Redirect href="/closet" />;
  return <Redirect href="/stylist" />;
}
