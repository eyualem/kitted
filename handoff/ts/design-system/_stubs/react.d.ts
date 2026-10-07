// TEMPORARY STUB — only so ts/design-system type-checks before `react` / `@types/react` are
// installed. Covers only what the design system uses, modelled on @types/react 19.
// DELETE THIS FOLDER (_stubs/) once the real packages are installed in the Expo app.

declare module 'react' {
  export type Key = string | number | bigint;

  export interface ReactElement<P = any, T = any> {
    type: T;
    props: P;
    key: string | null;
  }

  export type ReactNode =
    | ReactElement
    | string
    | number
    | bigint
    | boolean
    | null
    | undefined
    | Iterable<ReactNode>;

  export interface ProviderProps<T> {
    value: T;
    children?: ReactNode;
  }

  export interface Context<T> {
    Provider: (props: ProviderProps<T>) => ReactElement | null;
  }

  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;

  export type SetStateAction<S> = S | ((prev: S) => S);
  export type Dispatch<A> = (value: A) => void;
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];

  export type DependencyList = readonly unknown[];
  export type EffectCallback = () => void | (() => void);
  export function useEffect(effect: EffectCallback, deps?: DependencyList): void;
  export function useMemo<T>(factory: () => T, deps: DependencyList): T;
  export function useCallback<T extends Function>(callback: T, deps: DependencyList): T;

  export interface RefObject<T> {
    current: T;
  }
  export function useRef<T>(initialValue: T): RefObject<T>;
}

declare module 'react/jsx-runtime' {
  import type { Key, ReactElement, ReactNode } from 'react';

  export const Fragment: (props: { children?: ReactNode }) => ReactElement | null;
  export function jsx(type: unknown, props: unknown, key?: Key): ReactElement;
  export function jsxs(type: unknown, props: unknown, key?: Key): ReactElement;

  export namespace JSX {
    type ElementType = string | ((props: any) => ReactNode);
    interface Element extends ReactElement<any, any> {}
    interface ElementAttributesProperty {
      props: {};
    }
    interface ElementChildrenAttribute {
      children: {};
    }
    interface IntrinsicAttributes {
      key?: Key | null | undefined;
    }
    interface IntrinsicElements {}
  }
}
