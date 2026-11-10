// Rewrites incoming kitted:// links before routing (06 §2). Demo links only work in demo
// builds; an App Store build drops kitted://demo/... and opens the app normally. The Settings page is gone (SY1,
// #405): a link that opened it opens You at its rows instead.
import { DEMO_ENABLED } from '@/demo/config';

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const url = new URL(path, 'kitted://app');
    const route = url.protocol === 'kitted:' && url.host && url.host !== 'app' ? `/${url.host}${url.pathname}` : url.pathname;
    if (route.startsWith('/demo') && !DEMO_ENABLED) return '/';
    if (route === '/you/settings' || route === '/you/settings/') return '/you?at=settings';
    return `${route}${url.search}`;
  } catch {
    return '/';
  }
}
