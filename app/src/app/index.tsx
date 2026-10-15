// "/" sends you through the gate: age stop → onboarding → Stylist (02 §1.1).
import { Redirect } from 'expo-router';
import { useGate } from '@/state/appGate';
import { resumeHref, resumeStepAtLaunch } from '@/features/onboarding/resume';

export default function Index() {
  const gate = useGate();
  if (!gate.ready) return null; // the splash screen is still up
  if (gate.ageBlocked) return <Redirect href="/age-stop" />;
  // Mid-setup last time: back on the step he reached, his answers kept (10-onboarding.md F4).
  if (!gate.onboarded) return <Redirect href={resumeHref(resumeStepAtLaunch())} />;
  return <Redirect href="/stylist" />;
}
