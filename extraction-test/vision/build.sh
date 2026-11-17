#!/bin/sh
# Builds kmeasure from the app's own Swift files (no Xcode project needed), plus the harness-only files: the fit ruler (FitRuler.swift) the leg-width probe (LegShapeProbe.swift) the leg probe (LegTaper.swift) the hem probe (HemProbe.swift) and the waist ruler (WaistRuler.swift), none of which is in the app.
set -e
cd "$(dirname "$0")"
IOS=../../app/modules/kitted-vision/ios
mkdir -p bin
xcrun swiftc -O -o bin/kmeasure "$IOS/KittedPrep.swift" "$IOS/KittedGuide.swift" "$IOS/KittedMeasure.swift" FitRuler.swift LegShapeProbe.swift LegTaper.swift HemProbe.swift WaistRuler.swift BodyRuler.swift OutlineProbe.swift main.swift
echo "built bin/kmeasure"
