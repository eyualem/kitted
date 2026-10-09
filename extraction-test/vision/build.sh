#!/bin/sh
# Builds kmeasure from the app's own Swift files (no Xcode project needed), plus the harness-only files: the fit ruler (FitRuler.swift) the leg-width probe (LegShapeProbe.swift) and the leg probe (LegTaper.swift), none of which is in the app.
set -e
cd "$(dirname "$0")"
IOS=../../app/modules/kitted-vision/ios
mkdir -p bin
xcrun swiftc -O -o bin/kmeasure "$IOS/KittedPrep.swift" "$IOS/KittedGuide.swift" "$IOS/KittedMeasure.swift" FitRuler.swift LegShapeProbe.swift LegTaper.swift main.swift
echo "built bin/kmeasure"
