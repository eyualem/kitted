// Row ids. expo-crypto's randomUUID on device; a counter in tests (setIdFactory) so ids are stable.
import * as Crypto from 'expo-crypto';

let factory: (prefix: string) => string = (prefix) => {
  const uuid = typeof Crypto.randomUUID === 'function' ? Crypto.randomUUID() : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uuid}`;
};

export function newId(prefix: string): string {
  return factory(prefix);
}

/** Tests: deterministic ids ("FC-1", "FC-2", …). */
export function setIdFactory(f: (prefix: string) => string): void {
  factory = f;
}

export function counterIds(): (prefix: string) => string {
  const n = new Map<string, number>();
  return (prefix) => {
    const k = (n.get(prefix) ?? 0) + 1;
    n.set(prefix, k);
    return `${prefix}-${k}`;
  };
}
