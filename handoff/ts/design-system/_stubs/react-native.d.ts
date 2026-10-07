// TEMPORARY STUB — only so ts/design-system type-checks before `react-native` is installed.
// Covers only the APIs the design system uses, modelled on react-native 0.86/0.87's own types
// (props/styles kept to the subset we touch; real types are wider). Where the real type is
// stricter than this stub, the real install will surface it: fix the code, not the stub.
// DELETE THIS FOLDER (_stubs/) once the real packages are installed in the Expo app.

declare function require(id: string): any;

declare module 'react-native' {
  import type { ReactElement, ReactNode } from 'react';

  // ---- values -------------------------------------------------------------------------
  export type ColorValue = string;
  export type DimensionValue = number | 'auto' | `${number}%` | null;
  export type ColorSchemeName = 'light' | 'dark' | 'unspecified' | null | undefined;

  export interface Insets {
    top?: number;
    left?: number;
    bottom?: number;
    right?: number;
  }

  export interface RegisteredStyle<T> {
    __registeredStyleBrand: T;
  }
  type Falsy = undefined | null | false | '';
  export type StyleProp<T> = T | RegisteredStyle<T> | ReadonlyArray<StyleProp<T>> | Falsy;

  // ---- styles -------------------------------------------------------------------------
  interface FlexStyle {
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    flex?: number;
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';
    flexShrink?: number;
    flexGrow?: number;
    gap?: number | string;
    rowGap?: number | string;
    columnGap?: number | string;
    position?: 'absolute' | 'relative' | 'static';
    top?: DimensionValue;
    right?: DimensionValue;
    bottom?: DimensionValue;
    left?: DimensionValue;
    width?: DimensionValue;
    height?: DimensionValue;
    minWidth?: DimensionValue;
    minHeight?: DimensionValue;
    maxWidth?: DimensionValue;
    maxHeight?: DimensionValue;
    margin?: DimensionValue;
    marginHorizontal?: DimensionValue;
    marginVertical?: DimensionValue;
    marginTop?: DimensionValue;
    marginBottom?: DimensionValue;
    marginLeft?: DimensionValue;
    marginRight?: DimensionValue;
    padding?: DimensionValue;
    paddingHorizontal?: DimensionValue;
    paddingVertical?: DimensionValue;
    paddingTop?: DimensionValue;
    paddingBottom?: DimensionValue;
    paddingLeft?: DimensionValue;
    paddingRight?: DimensionValue;
    aspectRatio?: number | string;
  }

  type TransformsStyle = {
    transform?: ReadonlyArray<{ rotate: string } | { scale: number } | { translateX: number } | { translateY: number }>;
  };

  export interface ViewStyle extends FlexStyle, TransformsStyle {
    backgroundColor?: ColorValue;
    opacity?: number;
    overflow?: 'visible' | 'hidden' | 'scroll';
    borderWidth?: number;
    borderTopWidth?: number;
    borderBottomWidth?: number;
    borderColor?: ColorValue;
    borderTopColor?: ColorValue;
    borderBottomColor?: ColorValue;
    borderRadius?: number;
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    borderStyle?: 'solid' | 'dotted' | 'dashed';
    /** iOS 13+ */
    borderCurve?: 'circular' | 'continuous';
    /** New Architecture only. */
    boxShadow?: string;
    experimental_backgroundImage?: string;
  }

  export type FontVariant = 'small-caps' | 'oldstyle-nums' | 'lining-nums' | 'tabular-nums' | 'proportional-nums';

  export interface TextStyle extends ViewStyle {
    color?: ColorValue;
    fontFamily?: string;
    fontSize?: number;
    fontStyle?: 'normal' | 'italic';
    fontWeight?:
      | 'normal'
      | 'bold'
      | '100'
      | '200'
      | '300'
      | '400'
      | '500'
      | '600'
      | '700'
      | '800'
      | '900'
      | 100
      | 200
      | 300
      | 400
      | 500
      | 600
      | 700
      | 800
      | 900;
    fontVariant?: FontVariant[];
    letterSpacing?: number;
    lineHeight?: number;
    textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
    textDecorationLine?: 'none' | 'underline' | 'line-through' | 'underline line-through';
    textDecorationStyle?: 'solid' | 'double' | 'dotted' | 'dashed';
    textDecorationColor?: ColorValue;
    textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
    /** Android only. */
    includeFontPadding?: boolean;
  }

  export interface ImageStyle extends FlexStyle, TransformsStyle {
    borderRadius?: number;
    overflow?: 'visible' | 'hidden';
    opacity?: number;
  }

  // ---- events -------------------------------------------------------------------------
  export interface NativeSyntheticEvent<T> {
    nativeEvent: T;
  }
  export interface LayoutRectangle {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  export type LayoutChangeEvent = NativeSyntheticEvent<{ layout: LayoutRectangle }>;
  export interface TextLayoutLine extends LayoutRectangle {
    ascender: number;
    capHeight: number;
    descender: number;
    text: string;
    xHeight: number;
  }
  export interface TextLayoutEventData {
    lines: TextLayoutLine[];
  }
  export type GestureResponderEvent = NativeSyntheticEvent<unknown>;

  // ---- accessibility ------------------------------------------------------------------
  export type AccessibilityRole =
    | 'none'
    | 'button'
    | 'link'
    | 'header'
    | 'text'
    | 'image'
    | 'summary'
    | 'progressbar'
    | 'adjustable'
    | 'togglebutton'
    | 'list';
  export interface AccessibilityState {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  }
  export interface AccessibilityValue {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  }
  export interface AccessibilityActionInfo {
    name: string;
    label?: string;
  }
  export type AccessibilityActionEvent = NativeSyntheticEvent<{ actionName: string }>;

  interface AccessibilityProps {
    accessible?: boolean;
    accessibilityLabel?: string;
    accessibilityHint?: string;
    accessibilityRole?: AccessibilityRole;
    accessibilityState?: AccessibilityState;
    accessibilityValue?: AccessibilityValue;
    accessibilityActions?: ReadonlyArray<AccessibilityActionInfo>;
    onAccessibilityAction?: (event: AccessibilityActionEvent) => void;
    /** iOS */
    accessibilityElementsHidden?: boolean;
    importantForAccessibility?: 'auto' | 'yes' | 'no' | 'no-hide-descendants';
  }

  // ---- components ---------------------------------------------------------------------
  export interface ViewProps extends AccessibilityProps {
    children?: ReactNode;
    style?: StyleProp<ViewStyle>;
    onLayout?: (event: LayoutChangeEvent) => void;
    pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
    hitSlop?: null | Insets | number;
    testID?: string;
  }
  export const View: (props: ViewProps) => ReactElement | null;

  export interface TextProps extends AccessibilityProps {
    children?: ReactNode;
    style?: StyleProp<TextStyle>;
    allowFontScaling?: boolean;
    maxFontSizeMultiplier?: number | null;
    /** iOS */
    dynamicTypeRamp?:
      | 'caption2'
      | 'caption1'
      | 'footnote'
      | 'subheadline'
      | 'callout'
      | 'body'
      | 'headline'
      | 'title3'
      | 'title2'
      | 'title1'
      | 'largeTitle';
    numberOfLines?: number;
    onTextLayout?: (event: NativeSyntheticEvent<TextLayoutEventData>) => void;
    onPress?: (event: GestureResponderEvent) => void;
    testID?: string;
  }
  export const Text: (props: TextProps) => ReactElement | null;

  export interface PressableStateCallbackType {
    readonly pressed: boolean;
  }
  export interface PressableProps extends AccessibilityProps {
    children?: ReactNode | ((state: PressableStateCallbackType) => ReactNode);
    style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
    onPress?: null | ((event: GestureResponderEvent) => void);
    disabled?: null | boolean;
    hitSlop?: null | Insets | number;
    testID?: string;
  }
  export const Pressable: (props: PressableProps) => ReactElement | null;

  export interface ActivityIndicatorProps extends ViewProps {
    color?: ColorValue;
    size?: number | 'small' | 'large';
  }
  export const ActivityIndicator: (props: ActivityIndicatorProps) => ReactElement | null;

  export type ImageSourcePropType = number | { uri?: string; width?: number; height?: number } | ReadonlyArray<{ uri?: string }>;
  export interface ImageProps extends AccessibilityProps {
    source: ImageSourcePropType;
    style?: StyleProp<ImageStyle>;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  }
  export const Image: (props: ImageProps) => ReactElement | null;

  // ---- hooks & modules ----------------------------------------------------------------
  export function useColorScheme(): ColorSchemeName;
  export interface ScaledSize {
    width: number;
    height: number;
    scale: number;
    fontScale: number;
  }
  export function useWindowDimensions(): ScaledSize;

  export interface EmitterSubscription {
    remove(): void;
  }

  type AccessibilityChangeEventName =
    | 'reduceMotionChanged'
    | 'reduceTransparencyChanged'
    | 'boldTextChanged'
    | 'darkerSystemColorsChanged'
    | 'screenReaderChanged';

  export const AccessibilityInfo: {
    isReduceMotionEnabled(): Promise<boolean>;
    isReduceTransparencyEnabled(): Promise<boolean>;
    isBoldTextEnabled(): Promise<boolean>;
    isDarkerSystemColorsEnabled(): Promise<boolean>;
    prefersCrossFadeTransitions(): Promise<boolean>;
    announceForAccessibility(announcement: string): void;
    addEventListener(eventName: AccessibilityChangeEventName, handler: (enabled: boolean) => void): EmitterSubscription;
  };

  export const Appearance: {
    getColorScheme(): ColorSchemeName;
    setColorScheme(scheme: ColorSchemeName): void;
  };

  export const PixelRatio: {
    get(): number;
    getFontScale(): number;
  };

  export const StyleSheet: {
    hairlineWidth: number;
    create<T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(styles: T): T;
  };

  export const Platform: {
    OS: 'ios' | 'android' | 'web' | 'windows' | 'macos';
    Version: number | string;
  };

  // ---- Animated (subset) --------------------------------------------------------------
  export namespace Animated {
    interface CompositeAnimation {
      start(callback?: (result: { finished: boolean }) => void): void;
      stop(): void;
      reset(): void;
    }
    interface InterpolationConfig<T extends number | string> {
      inputRange: number[];
      outputRange: T[];
    }
    class AnimatedInterpolation<T extends number | string> {
      private __brand: T;
    }
    class Value {
      constructor(value: number);
      setValue(value: number): void;
      interpolate<T extends number | string>(config: InterpolationConfig<T>): AnimatedInterpolation<T>;
    }
    interface TimingConfig {
      toValue: number;
      duration?: number;
      easing?: (value: number) => number;
      delay?: number;
      useNativeDriver: boolean;
    }
    function timing(value: Value, config: TimingConfig): CompositeAnimation;
    function loop(animation: CompositeAnimation, config?: { iterations?: number }): CompositeAnimation;
    type AnimatedStyle = Omit<ViewStyle, 'transform' | 'opacity'> & {
      opacity?: number | Value | AnimatedInterpolation<number>;
      transform?: ReadonlyArray<{ rotate: string | AnimatedInterpolation<string> } | { scale: number | Value }>;
    };
    const View: (props: Omit<ViewProps, 'style'> & { style?: StyleProp<AnimatedStyle> }) => ReactElement | null;
  }

  export const Easing: {
    linear: (t: number) => number;
    ease: (t: number) => number;
    inOut(easing: (t: number) => number): (t: number) => number;
  };
}
