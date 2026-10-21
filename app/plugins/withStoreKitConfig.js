// Points the Debug scheme's Run at storekit/Kitted.storekit (09 §26 K2, #365), so the Pro subscription's real purchase
// flow can be tried on the Simulator from Xcode (Product → Run) with no App Store Connect. Xcode reads the file only for
// a Run from Xcode: Release, Archive and EAS builds never use it, and `expo run:ios` (launched by simctl) doesn't either.
// The scheme is regenerated at prebuild, so this writes the reference every time.
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

/** Xcode resolves the identifier from `<project>.xcodeproj/xcshareddata`, as the schemes Xcode itself writes do. */
const STOREKIT_REF = '../../../storekit/Kitted.storekit';

/** The scheme XML with the reference inside its LaunchAction (unchanged if it's already there). Pure, for the tests. */
function withStoreKitRef(xml, ref = STOREKIT_REF) {
  if (xml.includes('<StoreKitConfigurationFileReference')) return xml;
  const close = xml.indexOf('</LaunchAction>');
  if (close < 0) return xml;
  const block = `      <StoreKitConfigurationFileReference\n         identifier = "${ref}">\n      </StoreKitConfigurationFileReference>\n   `;
  return xml.slice(0, close) + block + xml.slice(close);
}

const withStoreKitConfig = (config) =>
  withDangerousMod(config, [
    'ios',
    (cfg) => {
      const name = cfg.modRequest.projectName;
      const scheme = path.join(cfg.modRequest.platformProjectRoot, `${name}.xcodeproj`, 'xcshareddata', 'xcschemes', `${name}.xcscheme`);
      if (fs.existsSync(scheme)) fs.writeFileSync(scheme, withStoreKitRef(fs.readFileSync(scheme, 'utf8')));
      return cfg;
    },
  ]);

module.exports = withStoreKitConfig;
module.exports.withStoreKitRef = withStoreKitRef;
module.exports.STOREKIT_REF = STOREKIT_REF;
