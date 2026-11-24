#!/bin/zsh
# Builds Kitted for the founder's iPhone (free Personal Team, 7-day installs), signs it, installs it
# and opens it. Rerun every 7 days.
#   tools/phone/install.sh               the dev app: its code comes from Metro on this Mac (over the
#                                        USB cable, else the same Wi-Fi), so every change shows at once.
#   tools/phone/install.sh --standalone  a Release build with its code inside: no Mac or Metro needed,
#                                        demo tools off, frozen until the next run (DECISIONS-LOG #530).
#                                        Run `npm run guard:release` in app/ first.
# The phone: plugged in, unlocked, Developer Mode on, "Apple Development: …" trusted once in
# Settings → General → VPN & Device Management.
# It opens the app as a tester would: a fresh install starts at Welcome and plays today's setup;
# a phone that finished setup keeps its data and opens in the app. To play setup again, delete
# Kitted from the phone first (that erases the phone's fits and closet). A TestFlight copy of
# Kitted carries its own frozen code: delete it before the first install from this script.
set -e
CONFIG=Debug; BUILD=build/phone
[[ "$1" == --standalone ]] && { CONFIG=Release; BUILD=build/phone-release; }
[[ -n "$1" && "$1" != --standalone ]] && { echo "Unknown option $1 (the only one is --standalone)."; exit 1; }
cd "$(dirname "$0")/../../app/ios"
DEVICE_UDID=$(xcrun xctrace list devices 2>/dev/null | awk -F'[()]' '/iPhone/ && !/Simulator/ {print $(NF-1); exit}')
DEVICE_ID=$(xcrun devicectl list devices 2>/dev/null | grep -E 'iPhone.*(connected|available)' | grep -oE '[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}' | head -1)
[[ -z "$DEVICE_UDID" || -z "$DEVICE_ID" ]] && { echo "No iPhone found. Plug it in and unlock it."; exit 1; }
xcodebuild -workspace Kitted.xcworkspace -scheme Kitted -configuration $CONFIG -destination "id=$DEVICE_UDID" \
  -allowProvisioningUpdates -derivedDataPath $BUILD COMPILER_INDEX_STORE_ENABLE=NO build -quiet
APP=$BUILD/Build/Products/$CONFIG-iphoneos/Kitted.app
# Some prebuilt frameworks come out unsigned (DECISIONS-LOG #52): sign them, then the app.
ID=$(security find-identity -v -p codesigning | awk '/Apple Development/ {print $2; exit}')
ENT=$(mktemp)
codesign -d --entitlements - --xml "$APP" > "$ENT" 2>/dev/null
for f in "$APP"/Frameworks/*.framework; do codesign --force --sign "$ID" --timestamp=none "$f" 2>/dev/null; done
codesign --force --sign "$ID" --entitlements "$ENT" --timestamp=none "$APP" 2>/dev/null
codesign --verify --deep --strict "$APP"
xcrun devicectl device install app --device "$DEVICE_ID" "$APP" >/dev/null
if [[ $CONFIG == Release ]]; then
  xcrun devicectl device process launch --device "$DEVICE_ID" --terminate-existing com.trykitted.kitted >/dev/null
  echo "Installed and opened on the iPhone: the standalone build, its code inside. Unplug and take it anywhere."
  echo "Back to the dev app (code from Metro): tools/phone/install.sh"
  exit 0
fi
# Metro's address: the USB cable when the phone is plugged in (the cable is a small network of its own,
# with a 169.254.x.x address on the Mac), else Wi-Fi. School and public Wi-Fi often block a phone from
# reaching the Mac, so the cable comes first (DECISIONS-LOG #529).
IP=""; VIA="USB cable"
for IF in $(ifconfig -l); do
  [[ "$IF" == en0 ]] && continue
  ADDR=$(ipconfig getifaddr "$IF" 2>/dev/null || true)
  [[ "$ADDR" == 169.254.* ]] && { IP=$ADDR; break; }
done
[[ -z "$IP" ]] && { IP=$(ipconfig getifaddr en0); VIA="Wi-Fi (same network as the phone)"; }
xcrun devicectl device process launch --device "$DEVICE_ID" --terminate-existing \
  --payload-url "exp+kitted://expo-development-client/?url=http%3A%2F%2F$IP%3A8081" com.trykitted.kitted >/dev/null
echo "Installed and opened on the iPhone (Metro at $IP:8081, over the $VIA)."
[[ "$VIA" == "USB cable" ]] && echo "Keep the phone plugged in: unplugged, it loses Metro (plug in again and reopen Kitted)."
exit 0
