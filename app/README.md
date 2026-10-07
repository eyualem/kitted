# Kitted app (Expo SDK 57, React Native, TypeScript)

Start here: `../handoff/README.md` and `../handoff/05-build-plan.md`.

```sh
npm run check          # typecheck + core typecheck + lint + core tests (5,694 parity) + jest
npm run web            # web preview on :8081 (layout/copy loop; not iOS)
npx expo run:ios --device "iPhone 17 Pro"   # dev build on the Simulator
```

Demo links: `/demo` lists all 20 mockup screens; `/demo/screen/<n>?theme=dark&frame=1` on web,
`xcrun simctl openurl booted "kitted://demo/screen/<n>"` on the Simulator.
