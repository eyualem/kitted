// Settings' outward actions: open a page, Apple's subscriptions page, or a mail to support. A failure is a toast,
// never a dead tap.
import { Linking } from 'react-native';
import { MANAGE_SUBSCRIPTIONS_URL } from '@/config/links';
import { showToast } from '@/features/toast/toast';
import { t } from '@/i18n/en';

/** A mailto link with only a subject (no personal data in the URL). */
export function mailtoUrl(to: string, subject: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}`;
}

export async function openLink(url: string): Promise<void> {
  try {
    await Linking.openURL(url);
  } catch {
    showToast(t('settings.openFailed'));
  }
}

/** Manage subscription: Apple's page until P6 adds StoreKit's manageSubscriptionsSheet. */
export const openManageSubscription = () => openLink(MANAGE_SUBSCRIPTIONS_URL);
