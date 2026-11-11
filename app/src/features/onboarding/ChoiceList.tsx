// A single-choice list (T39, tasks/T39/DESIGN.md "New parts"): equal rows in a card, a checkmark on the picked row,
// radio semantics (the list a radiogroup with the question as its label, each row a radio with its selected state).
// Every row is the same size and weight until he taps one (OS4: equal size and weight); the picked row's words turn
// semibold and gain the checkmark. While a finger is down the row fills with surface2, like an iOS list row.
// Lives here rather than in design-system/ (outside the Setup lane); a follow-up moves it there.
import * as Haptics from 'expo-haptics';
import { Fragment } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import { Icon, KCard, KText, RowDivider, radius, space, useTheme } from '@/design-system';

export interface Choice<T extends string> {
  value: T;
  label: string;
  spoken: string;
  testID: string;
}

export function ChoiceList<T extends string>({ label, choices, value, onChange, testID }: {
  /** The radiogroup's accessibilityLabel (the question). */
  label: string;
  choices: readonly Choice<T>[];
  /** null: nothing picked. */
  value: T | null;
  onChange: (v: T) => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  const pick = (v: T) => {
    void Haptics.selectionAsync();
    Keyboard.dismiss();
    onChange(v);
  };
  return (
    <KCard radius={radius.cardSmall}>
      <View testID={testID} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {choices.map((c, i) => {
          const selected = c.value === value;
          return (
            <Fragment key={c.value}>
              {i > 0 ? <RowDivider inset={space.rowX} /> : null}
              <Pressable
                testID={c.testID}
                accessibilityRole="radio"
                accessibilityLabel={c.spoken}
                accessibilityState={{ selected }}
                onPress={() => pick(c.value)}
                style={({ pressed }) => [styles.row, pressed ? { backgroundColor: colors.surface2 } : null]}
              >
                <KText variant="body" weight={selected ? '600' : '400'} style={styles.label}>
                  {c.label}
                </KText>
                {selected ? (
                  <View testID={`${c.testID}-check`}>
                    <Icon name="check" size={20} color="ink" />
                  </View>
                ) : null}
              </Pressable>
            </Fragment>
          );
        })}
      </View>
    </KCard>
  );
}

const styles = StyleSheet.create({
  // minHeight, not height: at the largest text sizes a label wraps and the row grows with it.
  row: { minHeight: 52, paddingHorizontal: space.rowX, paddingVertical: space.s, flexDirection: 'row', alignItems: 'center', gap: space.m },
  label: { flex: 1 },
});
