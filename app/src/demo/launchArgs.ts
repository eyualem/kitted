// Launch arguments exist only on iOS (launchArgs.ios.ts). Web and Android use deep-link queries.
import type { RawArgs } from './demoArgs';

export function readLaunchArgs(): RawArgs {
  return {};
}
