# T45: the app starts in Light

**Size:** normal (settings words and one default; no scoring, privacy or age gate). Spec: `specs/setup-and-you.md` SY1.3 (Appearance); the specs never name System as the default, so no spec line changed.

**Asked (founder, Nov 11):** "make the app have light mode by default. it looks better at this time." Agreed: a fresh install starts in Light; You > Appearance (System / Light / Dark) stays.

## What was built
- `features/settings/prefs.ts`: `DEFAULT_APPEARANCE = 'light'`. `parseAppearance` gives it for nothing or junk; a stored `light`, `dark` or `system` is kept. `applySavedAppearance` now always applies the choice (before, it skipped System because System was the default) and never writes the default to the store.
- `SettingsRows.tsx`: the row starts at the default, so it never flashes "System".
- `privacy/actions.ts`: Delete all my data returns the running app to Light, as a fresh install is.
- `e2e/flows/T34-you-settings-home.yaml`: "Appearance, System" is now "Appearance, Light", and the pick test ends back on Light.
- No `app.config.ts` change: `userInterfaceStyle: 'automatic'` stays; `Appearance.setColorScheme` overrides at runtime (so no prebuild).

## Who sees a change
Testers who never touched the row have nothing stored, so after this build they switch to Light. Anyone who picked Dark or System keeps it.

## Checks (tests written first; they failed for the right reason, then passed)
- `settingsPrefs.test.ts`: a fresh store loads light; saved dark and system are respected (`system` is not folded into the default); boot applies `light` / `dark` / `unspecified` through `Appearance.setColorScheme`; the default is not written.
- `youSettingsHome.test.tsx` SY1.3: the row reads "Light" on a fresh install and after Delete all my data; a saved System reads System.
- Full run: tsc clean, lint 0 errors (6 old warnings), jest 144 suites pass (1,945 tests).
- Maestro `T34-you-settings-home.yaml` passes.

## Seen on the Simulator (Release demo build, JS bundle swapped in; the phone itself set with `simctl ui appearance`)
1. Phone dark, fresh data: opens in Light, tab bar too (`1-...`).
2. You > Appearance reads Light; picking Dark makes the app dark (`2-...`).
3. Phone light, saved Dark, cold launch: stays Dark (`3-...`).
4. Pick System: phone light gives a light app, phone dark a dark app (`4-...`, `5-...`); a cold launch with System on a dark phone is dark (`6-...`).

Not checked: the launch screen on a dark phone (navy in both modes, untouched); a real phone; the web preview (it follows the browser; layout only).
