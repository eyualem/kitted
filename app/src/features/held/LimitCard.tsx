// D19 · S17 Limit card, and S17h once he taps "Save for tomorrow" (02, #280): inline under the photo he took after the
// free check (and its re-check) was used. Nothing was sent; the photo is held and scored after 4 am. The free path is
// the default: no blurred score, no "upgrade to see". Try Pro only once the paywall exists (PAYWALL_BUILT), never on
// the beta (FP7). testIDs sit on plain wrapping Views (the design system's parts take none), so VoiceOver is unchanged.
import { router } from 'expo-router';
import { View } from 'react-native';
import { KButton, KCard, KCardSection, KText, TagLine, TextLink, TextLinkRow } from '@/design-system';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { fitCheck, quota } from '@/features/fitcheck/session';
import { limitCardContent } from './content';

export function LimitCard({ checkId, readOnly = false }: { checkId: string; readOnly?: boolean }) {
  const row = useLive(['fitChecks'], () => store.fitChecks.get(checkId), [checkId], checkId);
  const snap = useLive(['usage', 'fitChecks'], () => quota.snapshot(), []);
  if (!row || !snap) return null;
  const c = limitCardContent(row, snap);
  if (!c) return null;
  const actions = readOnly ? [] : c.state === 'limit'
    ? [{ name: 'save', label: c.save ?? '' }, ...(c.tryPro ? [{ name: 'pro', label: c.tryPro }] : [])]
    : [{ name: 'drop', label: c.dontScore ?? '' }];
  const go = {
    save: () => void fitCheck.saveHeld(checkId),
    pro: () => router.push('/paywall?from=limit'),
    drop: () => void fitCheck.dropHeld(checkId),
  };
  return (
    <View testID={c.state === 'limit' ? 'limit-card' : 'held-card'}>
      <KCard
        accessibilityLabel={c.a11y}
        accessibilityActions={actions}
        onAccessibilityAction={(e) => go[e.nativeEvent.actionName as keyof typeof go]?.()}
      >
        <KCardSection gap={13} paddingVertical={14} style={{ paddingHorizontal: 16 }}>
          <TagLine left={c.tag} right={c.tagRight} />
          {c.title ? (
            <KText variant="title3" weight="600">
              {c.title}
            </KText>
          ) : null}
          <KText variant="subheadline" color={c.state === 'limit' ? 'ink2' : 'ink'}>
            {c.body}
          </KText>
          {readOnly ? null : c.state === 'limit' ? (
            <View style={{ gap: 8 }}>
              <View testID="limit-card-save">
                <KButton title={c.save ?? ''} size="large" fullWidth onPress={go.save} />
              </View>
              {c.tryPro ? (
                <View testID="limit-card-pro">
                  <KButton title={c.tryPro} kind="secondary" size="large" fullWidth onPress={go.pro} />
                </View>
              ) : null}
            </View>
          ) : (
            <TextLinkRow>
              <View testID="held-card-dont-score">
                <TextLink title={c.dontScore ?? ''} color="ink2" compact onPress={go.drop} />
              </View>
            </TextLinkRow>
          )}
        </KCardSection>
      </KCard>
    </View>
  );
}
