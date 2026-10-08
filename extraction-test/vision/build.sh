#!/bin/sh
# Builds kmeasure from the app's own Swift files (no Xcode project needed).
set -e
cd "$(dirname "$0")"
IOS=../../app/modules/kitted-vision/ios
mkdir -p bin
xcrun swiftc -O -o bin/kmeasure "$IOS/KittedPrep.swift" "$IOS/KittedGuide.swift" "$IOS/KittedMeasure.swift" main.swift
echo "built bin/kmeasure"
