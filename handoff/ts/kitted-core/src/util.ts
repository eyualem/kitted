// Small helpers that reproduce Python semantics exactly. Kept dependency-free and ES2019-safe
// (no structuredClone / Object.hasOwn / replaceAll), so they run on Hermes, Workers and Node alike.

/** Deep copy of JSON-shaped data (readings, closet items). Never share objects with the caller. */
export function clone<T>(v: T): T {
  if (v === null || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map((x) => clone(x)) as unknown as T;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(v as Record<string, unknown>)) out[k] = clone((v as Record<string, unknown>)[k]);
  return out as T;
}

/** Python `k in d` for a plain object (own key, even if the value is null). */
export function has(o: object | null | undefined, k: string): boolean {
  return o != null && Object.prototype.hasOwnProperty.call(o, k);
}

/** Python `x is None` for a value read with `.get()` (missing key or JSON null). */
export function isNone(v: unknown): v is null | undefined {
  return v === null || v === undefined;
}

/** Python truthiness: None, False, 0, "", [] and {} are falsy. */
export function truthy(v: unknown): boolean {
  if (v === null || v === undefined || v === false || v === 0 || v === "") return false;
  if (typeof v === "number" && Number.isNaN(v)) return true; // Python: bool(nan) is True
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "object") return Object.keys(v as object).length > 0;
  return true;
}

/** Python `a or b`. */
export function or<A, B>(a: A, b: B): A | B {
  return truthy(a) ? a : b;
}

/** rubric.round_half: floor(x * 2 + 0.5) / 2 (never Math.round, never toFixed). */
export function roundHalf(x: number): number {
  return Math.floor(x * 2 + 0.5) / 2;
}

/** rubric.nearest: floor(x + 0.5) (Python's round() is banker's rounding; this is not). */
export function nearest(x: number): number {
  return Math.floor(x + 0.5);
}

/**
 * Python's built-in round(x, n) for n >= 0: round the EXACT binary value half-to-even at n decimals, then
 * return the nearest double. Used only for the display fields (raw_score, credit_points, ...).
 * toFixed(100) gives the exact decimal expansion for every value this library produces (|x| >= 1e-15).
 */
export function pyRound(x: number, n: number): number {
  if (!Number.isFinite(x) || x === 0) return x;
  const neg = x < 0;
  const exact = Math.abs(x).toFixed(100);
  const dot = exact.indexOf(".");
  const intPart = exact.slice(0, dot);
  const frac = exact.slice(dot + 1);
  const kept = intPart + frac.slice(0, n); // digits of the result, scaled by 10^n
  const next = frac.charCodeAt(n) - 48;
  const rest = frac.slice(n + 1);
  let up: boolean;
  if (next > 5) up = true;
  else if (next < 5) up = false;
  else if (/[1-9]/.test(rest)) up = true;
  else up = (kept.charCodeAt(kept.length - 1) - 48) % 2 === 1; // exact tie: half to even
  let digits = kept;
  if (up) {
    const arr = digits.split("");
    let i = arr.length - 1;
    while (i >= 0) {
      if (arr[i] === "9") {
        arr[i] = "0";
        i--;
      } else {
        arr[i] = String.fromCharCode(arr[i]!.charCodeAt(0) + 1);
        break;
      }
    }
    digits = (i < 0 ? "1" : "") + arr.join("");
  }
  const s = n === 0 ? digits : digits.slice(0, digits.length - n) + "." + digits.slice(digits.length - n);
  const v = Number(s);
  return neg ? -v : v;
}

/** Python sum(): left to right, starting from 0. */
export function sum(xs: readonly number[]): number {
  let s = 0;
  for (const x of xs) s += x;
  return s;
}

/** Python max(iterable) / min(iterable) for numbers (first extreme wins; same value either way). */
export function maxOf(xs: readonly number[]): number {
  let m = xs[0]!;
  for (let i = 1; i < xs.length; i++) if (xs[i]! > m) m = xs[i]!;
  return m;
}
export function minOf(xs: readonly number[]): number {
  let m = xs[0]!;
  for (let i = 1; i < xs.length; i++) if (xs[i]! < m) m = xs[i]!;
  return m;
}

/** Python max(a, b, ...) for numbers: the first argument that is strictly greater than all before it. */
export function pyMax(...xs: number[]): number {
  return maxOf(xs);
}
export function pyMin(...xs: number[]): number {
  return minOf(xs);
}

/** Python str.replace(old, new): every occurrence. */
export function replaceAll(s: string, find: string, rep: string): string {
  return s.split(find).join(rep);
}

/** Deep equality for JSON-shaped values (key order ignored, -0 == 0). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    const bb = b as unknown[];
    if (a.length !== bb.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], bb[i])) return false;
    return true;
  }
  const ka = Object.keys(a as object);
  const kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!has(b as object, k)) return false;
    if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) return false;
  }
  return true;
}
