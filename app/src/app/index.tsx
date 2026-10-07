// "/" sends you through the gate: age stop → onboarding → Stylist (02 §1.1).
import { Redirect } from 'expo-router';
import { useGate } from '@/state/appGate';

export default function Index() {
  const gate = useGate();
  if (!gate.ready) return null; // the splash screen is still up
  if (gate.ageBlocked) return <Redirect href="/age-stop" />;
  if (!gate.onboarded) return <Redirect href="/onboarding/welcome" />;
  return <Redirect href="/stylist" />;
}
