// Purchases behind an interface (05 §3.2, 02 P1b/P1s; 10-onboarding.md §9.4). v1 fills it with RevenueCat (founder
// decision S8); until then the mock store below, which sells nothing: a "purchase" turns on the demo entitlement.
// One product since #285: Pro monthly, $9.99 with a 1-week free trial. The yearly plan, the cap and the founding offer
// are open, so nothing else is offered.
import { demoEntitlements } from './entitlements';

export interface ProProduct {
  id: string;
  period: 'month';
  /** The store's own localized price string ("$9.99"): the billed amount, always the biggest price on P1b (3.1.2). */
  price: string;
  /** Free-trial length in days (0 = none offered). */
  trialDays: number;
}

export type ProductsResult = { kind: 'ok'; products: ProProduct[] } | { kind: 'failed' } | { kind: 'offline' };
export type PurchaseResult = { kind: 'ok' } | { kind: 'cancelled' } | { kind: 'pending' } | { kind: 'failed' } | { kind: 'offline' };
export type RestoreOutcome = 'restored' | 'none' | 'failed';

export interface PurchaseStore {
  products(): Promise<ProductsResult>;
  /** Whether this Apple ID can still start the free trial. */
  trialEligible(): Promise<boolean>;
  purchase(productId: string): Promise<PurchaseResult>;
  restore(): Promise<RestoreOutcome>;
  /** A store that sells nothing (P1b shows "Demo: no real purchase"). */
  readonly mock: boolean;
}

export const PRO_MONTHLY: ProProduct = { id: 'kitted.pro.monthly', period: 'month', price: '$9.99', trialDays: 7 };

/** How a demo screen scripts the mock store (demo/scenarios.ts `paywall`). */
export type StoreScript = 'ok' | 'loading' | 'loadFailed' | 'offline' | 'pending' | 'cancel' | 'fail' | 'noTrial';

export interface MockStoreOptions {
  script?: () => StoreScript;
  setPro?: (on: boolean) => void;
  isPro?: () => boolean;
}

export function createMockStore(o: MockStoreOptions = {}): PurchaseStore {
  const script = o.script ?? (() => 'ok' as StoreScript);
  const setPro = o.setPro ?? ((on: boolean) => demoEntitlements.setPro(on));
  const isPro = o.isPro ?? (() => demoEntitlements.isPro());
  let trialUsed = false;
  return {
    mock: true,
    async products() {
      const s = script();
      if (s === 'loading') return new Promise<ProductsResult>(() => {}); // stays loading (the skeleton)
      if (s === 'loadFailed') return { kind: 'failed' };
      if (s === 'offline') return { kind: 'offline' };
      return { kind: 'ok', products: [PRO_MONTHLY] };
    },
    async trialEligible() {
      return script() !== 'noTrial' && !trialUsed;
    },
    async purchase(id) {
      if (id !== PRO_MONTHLY.id) return { kind: 'failed' };
      const s = script();
      if (s === 'cancel') return { kind: 'cancelled' };
      if (s === 'pending') return { kind: 'pending' };
      if (s === 'fail') return { kind: 'failed' };
      if (s === 'offline') return { kind: 'offline' };
      trialUsed = true;
      setPro(true);
      return { kind: 'ok' };
    },
    async restore() {
      try {
        return isPro() ? 'restored' : 'none';
      } catch {
        return 'failed';
      }
    },
  };
}
