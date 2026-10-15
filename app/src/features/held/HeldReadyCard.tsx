// S17h after 4 am (02, #281): "Ready to score last night's photo?" with Score it / Not this one, under the stylist's
// line. Posted by offerHeld at launch or a foreground; nothing is read or sent until he taps Score it (ruling 27). Not
// this one deletes the photo (it was never sent). Gone once the photo is scored (its card moves to today) or deleted.
import { View } from 'react-native';
import { KButton, StylistMessage } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { scoreHeldPhoto } from '@/features/camera/startCheck';
import { fitCheck } from '@/features/fitcheck/session';
import { heldReadyContent } from './content';

export function HeldReadyCard({ checkId, showHeader, readOnly = false }: { checkId: string; showHeader: boolean; readOnly?: boolean }) {
  const row = useLive(['fitChecks'], () => store.fitChecks.get(checkId), [checkId], checkId);
  const c = heldReadyContent(row);
  if (!c) return null;
  return (
    <StylistMessage
      showHeader={showHeader}
      footer={readOnly ? null : (
        <View style={{ paddingTop: 6, gap: 8, alignItems: 'flex-start' }}>
          <KButton title={c.score} size="regular" onPress={() => void scoreHeldPhoto(checkId)} />
          <KButton title={c.notThis} kind="secondary" size="regular" onPress={() => void fitCheck.dropHeld(checkId)} />
        </View>
      )}
    >
      {c.text}
    </StylistMessage>
  );
}
