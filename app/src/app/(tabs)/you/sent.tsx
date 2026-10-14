// Y7 → "See what I send" (DECISIONS-LOG #246): the exact face-blurred copy his last check sent, and the close-ups that
// went with it, read from photo prep's upload folder (Caches/upload; nothing extra is kept for this screen). With none
// (no real photo yet, or after "Delete all photos"): one plain line.
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useState } from 'react';
import { View } from 'react-native';
import { KText, space, useTheme } from '@/design-system';
import { realPrivacyFiles, type SentCopy } from '@/features/privacy/files';
import { SettingsScroll } from '@/features/settings/SettingsList';
import { t } from '@/i18n/en';
import { clockTime, longDate } from '@/i18n/format';
import { sessionClock } from '@/state/session';

function Shot({ uri, label, initialAspect }: { uri: string; label: string; initialAspect: number }) {
  const { colors } = useTheme();
  const [aspect, setAspect] = useState(initialAspect);
  return (
    <Image
      source={{ uri }}
      accessible
      accessibilityLabel={label}
      contentFit="contain"
      // Never cached: after "Delete all photos" nothing of it may show again.
      cachePolicy="none"
      onLoad={(e) => {
        const { width, height } = e.source;
        if (width > 0 && height > 0) setAspect(width / height);
      }}
      style={{ width: '100%', aspectRatio: aspect, borderRadius: 16, backgroundColor: colors.surface2 }}
    />
  );
}

export default function SentCopyScreen() {
  const [sent] = useState<SentCopy | null>(() => realPrivacyFiles.lastSent());
  const provider = t('config.providerDefault');

  return (
    <>
      <Stack.Screen options={{ title: t('privacy.sent.title') }} />
      <SettingsScroll>
        {sent === null ? (
          <KText variant="body" color="ink2" style={{ paddingHorizontal: space.xs }}>
            {t('privacy.sent.none')}
          </KText>
        ) : (
          <View style={{ gap: space.l }}>
            <View style={{ gap: space.xs, paddingHorizontal: space.xs }}>
              <KText variant="subheadline" color="ink2">
                {t('privacy.sent.body', { provider })}
              </KText>
              {sent.at ? (
                <KText variant="footnote" color="ink3">
                  {t('privacy.sent.when', { date: longDate(sent.at, sessionClock.offset), time: clockTime(sent.at, sessionClock.offset) })}
                </KText>
              ) : null}
            </View>
            <Shot uri={sent.uri} label={t('privacy.sent.a11y')} initialAspect={3 / 4} />
            {sent.closeUps.length > 0 ? (
              <View style={{ gap: space.s }}>
                <KText variant="footnote" color="ink3" style={{ paddingHorizontal: space.xs }} accessibilityRole="header">
                  {t('privacy.sent.closeUps')}
                </KText>
                <View style={{ flexDirection: 'row', gap: space.s }}>
                  {sent.closeUps.map((uri, i) => (
                    <View key={uri} style={{ flex: 1 }}>
                      <Shot uri={uri} label={t('privacy.sent.a11yCloseUp', { n: i + 1, count: sent.closeUps.length })} initialAspect={1} />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </SettingsScroll>
    </>
  );
}
