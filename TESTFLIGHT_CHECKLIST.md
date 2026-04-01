# TestFlight upload checklist

Quick review of changes that affect testers and the build.

## Build configuration

| Item | Status | Notes |
|------|--------|--------|
| **Hermes disabled (JSC)** | OK | `ios/Podfile`: `ENV['USE_HERMES']='0'`, `:hermes_enabled => false`. `project.pbxproj`: `USE_HERMES = false` (Debug & Release). Reduces OOM risk. |
| **JSC teardown patch** | OK | `patches/react-native+0.75.5.patch` removes Debug-only assert. Applied by `postinstall: patch-package`. After `npm install`, run `npx patch-package` if needed. |
| **Release build** | OK | TestFlight uses Release. The JSC assert is not compiled in Release, so no SIGABRT from that. |

## Before archive (Xcode / CI)

1. **Install deps and apply patches**  
   `npm install` (or `yarn`) so `patch-package` runs and applies `react-native+0.75.5.patch`.
2. **iOS**  
   From project root: `cd ios && pod install && cd ..`.
3. **Archive**  
   Use **Product → Archive** (Release). Do not use Debug for TestFlight.

## Tester-facing behavior

| Feature | What testers see |
|---------|-------------------|
| **Report progress** | While the report is generating, a loading modal shows plain-English lines: storage check, project/images/categories, template sizes, “Report built in memory”, “File saved”, **Total file size: X MB**. |
| **Errors** | On failure, an alert shows a short explanation plus “Technical details”. The last report log line is also set to `Error: …`, so if they open the Generate modal again without generating, they still see the previous error in the status area. |
| **Stress test** | The “Stress test: OFF (tap to 2x images…)” control is Visible for testers in TestFlight. When ON, each image is duplicated on an extra slide to stress memory (for OOM testing). |

## What to tell testers

- **Report generation** can take 1–2+ minutes for large projects. They should see progress lines in the modal (storage, project info, templates, then “Report built in memory” and “File saved” with **total file size**).
- If something fails, they can note the **alert message** and, after closing it, open the Generate modal again to see the last **Error:** line in the status text (or send a screenshot of the alert).
- If the app crashes or freezes, ask for: device model, iOS version, and approximate number of images/categories when it happened.

## Summary

- Hermes is off; JSC is used; patch is applied via `postinstall`.
- Report status text is simple, includes total file size, and errors are shown in the log and in the alert.
- Stress test toggle is available for testers in TestFlight. Ready for TestFlight.
