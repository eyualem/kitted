// Keeps the aps-environment (push) entitlement out of the app (T53, specs/notifications.md). Kitted's notifications are
// all local, scheduled on the phone, and local notifications need no entitlement. But prebuild applies
// expo-notifications' own config plugin automatically whenever the package is installed, and that plugin always adds
// aps-environment, which the free Personal Team can't sign (app.config.ts APPLE.paid is false) and which would make the
// App Store expect push. Prebuild runs the mods registered later first, so this one (listed in app.config.ts) runs after
// expo-notifications' and removes the key again.
const { withEntitlementsPlist } = require('expo/config-plugins');

/** The entitlements without the push key. Pure, for a check. */
function withoutAps(entitlements) {
  const { ['aps-environment']: _push, ...rest } = entitlements;
  return rest;
}

const withoutPushEntitlement = (config) =>
  withEntitlementsPlist(config, (cfg) => {
    cfg.modResults = withoutAps(cfg.modResults);
    return cfg;
  });

module.exports = withoutPushEntitlement;
module.exports.withoutAps = withoutAps;
