// Rewrites incoming kitted:// links before routing (06 §2). Demo links only work in demo
// builds; an App Store build drops kitted://demo/... and opens the app normally.
import { DEMO_ENABLED } from '@/demo/config';

export function redirectSystemPath({ path }: { path: string; initial: boolean }): string {
  try {
    const url = new URL(path, 'kitted://app');
    const route = url.protocol === 'kitted:' && url.host && url.host !== 'app' ? `/${url.host}${url.pathname}` : url.pathname;
    if (route.startsWith('/demo') && !DEMO_ENABLED) return '/';
    return `${route}${url.search}`;
  } catch {
    return '/';
  }
}
