#!/bin/zsh
# Builds the dev app for the founder's iPhone (free Personal Team, 7-day installs), signs it,
# installs it and opens it on the Metro server on this Mac (same Wi-Fi). Rerun every 7 days.
# The phone: plugged in, unlocked, Developer Mode on, "Apple Development: …" trusted once in
# Settings → General → VPN & Device Management.
# It opens the app as a tester would: a fresh install starts at Welcome and plays today's setup;
# a phone that finished setup keeps its data and opens in the app. To play setup again, delete
# Kitted from the phone first (that erases the phone's fits and closet). A TestFlight copy of
# Kitted carries its own frozen code: delete it before the first install from this script.
set -e
cd "$(dirname "$0")/../../app/ios"
DEVICE_UDID=$(xcrun xctrace list devices 2>/dev/null | awk -F'[()]' '/iPhone/ && !/Simulator/ {print $(NF-1); exit}')
DEVICE_ID=$(xcrun devicectl list devices 2>/dev/null | grep -E 'iPhone.*(connected|available)' | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' | head -1)
[[ -z "$DEVICE_UDID" || -z "$DEVICE_ID" ]] && { echo "No iPhone found. Plug it in and unlock it."; exit 1; }
xcodebuild -workspace Kitted.xcworkspace -scheme Kitted -configuration Debug -destination "id=$DEVICE_UDID" \
  -allowProvisioningUpdates -derivedDataPath build/phone COMPILER_INDEX_STORE_ENABLE=NO build -quiet
APP=build/phone/Build/Products/Debug-iphoneos/Kitted.app
# Some prebuilt frameworks come out unsigned (DECISIONS-LOG #52): sign them, then the app.
ID=$(security find-identity -v -p codesigning | awk '/Apple Development/ {print $2; exit}')
ENT=$(mktemp)
codesign -d --entitlements - --xml "$APP" > "$ENT" 2>/dev/null
for f in "$APP"/Frameworks/*.framework; do codesign --force --sign "$ID" --timestamp=none "$f" 2>/dev/null; done
codesign --force --sign "$ID" --entitlements "$ENT" --timestamp=none "$APP" 2>/dev/null
codesign --verify --deep --strict "$APP"
xcrun devicectl device install app --device "$DEVICE_ID" "$APP" >/dev/null
IP=$(ipconfig getifaddr en0)
xcrun devicectl device process launch --device "$DEVICE_ID" --terminate-existing \
  --payload-url "exp+kitted://expo-development-client/?url=http%3A%2F%2F$IP%3A8081" com.trykitted.kitted >/dev/null
echo "Installed and opened on the iPhone (Metro at $IP:8081)."
