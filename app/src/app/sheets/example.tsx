import { ExampleCheckScreen } from '@/features/onboarding/ExampleCheckScreen';

// O1e as a sheet (02 S26 "See an example" → O1e as a sheet; 09-ui-review §20.8 G23): after "Not now", from the
// "Turn on fit checks" card. An X closes it; "Check my own fit" closes it and opens the agreement.
export default function ExampleSheet() {
  return <ExampleCheckScreen mode="sheet" />;
}
