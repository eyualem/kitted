// Y3 fact sheet (02 §3.6 Y3; revised #246), medium detent: the fact as the title, where it came from, then Edit
// (inline) and Delete (no dialog; "Forgot it." with Undo). A guess gets That's right / Change it instead.
// "Show the check" (→ L2) waits until a fact stores the check it came from: FactRow has no check id today (the
// seed's `ref` isn't kept), so the link is left out rather than pointing nowhere.
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CONTROL_TEXT_MAX_SCALE, KButton, KText, MonoLabel, space, useTheme } from '@/design-system';
import { textStyles } from '@/design-system/typography';
import { store } from '@/data/db';
import { useLive } from '@/data/useLive';
import { SheetScaffold } from '@/features/sheet/SheetScaffold';
import { confirmGuess, editFact, FACT_MAX_CHARS, factTitle, forgetWithUndo, sourceLine } from '@/features/you/facts';
import { t } from '@/i18n/en';
import { sessionClock } from '@/state/session';

export default function FactSheet() {
  const { colors, isAccessibilitySize } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const fact = useLive(['facts'], () => store.facts.get(String(id)), [id], String(id));
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  if (fact === undefined) return null;
  if (!fact || fact.isDeleted) return <SheetScaffold title={t('knows.title')} />;

  const guess = fact.source === 'guess';
  const startEdit = () => {
    setText(fact.value);
    setEditing(true);
  };
  const save = async () => {
    await editFact(store, fact.id, text, sessionClock.nowMs());
    setEditing(false);
    router.back();
  };
  const remove = async () => {
    router.back();
    await forgetWithUndo(store, fact.id);
  };
  const confirm = async () => {
    await confirmGuess(store, fact.id, sessionClock.nowMs());
    router.back();
  };

  const pair = (a: React.ReactNode, b: React.ReactNode) => (
    <View style={{ flexDirection: isAccessibilitySize ? 'column' : 'row', gap: space.s }}>
      <View style={{ flex: isAccessibilitySize ? undefined : 1 }}>{a}</View>
      <View style={{ flex: isAccessibilitySize ? undefined : 1 }}>{b}</View>
    </View>
  );

  return (
    <SheetScaffold title={factTitle(fact)}>
      <View style={{ gap: space.xs }}>
        <MonoLabel>{t('knows.cameFrom')}</MonoLabel>
        <KText variant="subheadline" color="ink2">
          {sourceLine(fact, sessionClock.offset)}
        </KText>
      </View>
      {editing ? (
        <View style={{ gap: space.m, marginTop: space.m }}>
          <TextInput
            autoFocus
            value={text}
            onChangeText={setText}
            maxLength={FACT_MAX_CHARS}
            multiline
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            onSubmitEditing={() => void save()}
            accessibilityLabel={t('knows.edit.a11y')}
            allowFontScaling
            maxFontSizeMultiplier={CONTROL_TEXT_MAX_SCALE}
            style={{
              color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 16, borderCurve: 'continuous',
              minHeight: 52, paddingHorizontal: space.l, paddingTop: space.m, paddingBottom: space.m, fontSize: textStyles.body.fontSize,
            }}
          />
          {pair(
            <KButton kind="secondary" size="regular" fullWidth title={t('common.cancel')} onPress={() => setEditing(false)} />,
            <KButton kind="primary" size="regular" fullWidth title={t('common.save')} disabled={!text.trim()} onPress={() => void save()} />,
          )}
        </View>
      ) : (
        <View style={{ marginTop: space.m }}>
          {guess
            ? pair(
                <KButton kind="secondary" size="regular" fullWidth title={t('knows.right')} onPress={() => void confirm()} />,
                <KButton kind="secondary" size="regular" fullWidth title={t('knows.change')} onPress={startEdit} />,
              )
            : pair(
                <KButton kind="secondary" size="regular" fullWidth title={t('common.edit')} onPress={startEdit} />,
                <KButton kind="secondary" size="regular" fullWidth title={t('common.delete')} onPress={() => void remove()} />,
              )}
        </View>
      )}
    </SheetScaffold>
  );
}
