// TEMPORARY type shim so `tsc --noEmit` can type-check the tests BEFORE `npm install`.
// It declares only what the tests use. DELETE THIS FILE after installing vitest and @types/node
// (npm i -D vitest @types/node typescript); the real packages provide these types.

declare module "vitest" {
  interface Matchers {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeNull(): void;
    toBeGreaterThan(n: number): void;
    not: Matchers;
  }
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>, timeout?: number): void;
  export function expect(actual: unknown): Matchers;
}

declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8"): string;
  export function existsSync(path: string): boolean;
}

declare module "node:path" {
  export function join(...parts: string[]): string;
  export function dirname(path: string): string;
}

declare module "node:url" {
  export function fileURLToPath(url: string): string;
}

interface ImportMeta {
  url: string;
}
