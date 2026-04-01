# Crash Review: SolarVest iOS OOM (Out of Memory)

## What Happened

**Exception:** `EXC_BAD_ACCESS (SIGSEGV)` at address `0x0000000000000000`  
**Triggered by:** Thread 6 – `com.facebook.react.JavaScript`  
**Root cause:** Hermes JavaScript engine **ran out of memory (OOM)**.

### Stack Trace (Crashed Thread)

1. `hermes::vm::GCBase::oom(std::__1::error_code)` – **Out of memory** in Hermes GC  
2. `hermes::vm::HadesGC::OldGen::alloc(unsigned int)` – Allocation in old generation failed  
3. `hermes::vm::HiddenClass::create` / `addProperty` – Creating JS object metadata  
4. `hermes::vm::JSObject::addOwnPropertyImpl` – Adding property during JS execution  
5. `hermes::vm::Interpreter::interpretFunction` – Normal JavaScript execution

The actual SIGSEGV at `0x0` is a **consequence** of the OOM: the GC could not allocate more memory, reported OOM, and the process was terminated.

### Supporting Evidence

- **Kernel:** `mach_vm_allocate_kernel failed within call to vm_map_enter` (repeated) – kernel could not grant more VM.
- **VM summary:** MALLOC ~8.9 GB, total virtual ~13.6 GB – very high memory use.
- **Runtime:** App ran ~53 minutes before crash – consistent with gradual growth or a heavy batch (e.g. many images).

---

## Root Cause (App Side)

The Hermes JS heap was exhausted. In this app the main risks are:

1. **Parallel uploads** – `uploadPicture` uses `updatedImageSections.forEach(async (item) => { await uploadImageSharepoint(...) })`. This **starts every upload at once**; it does not wait for one to finish before starting the next.  
   - For `file://` URIs the upload service streams from disk (good).  
   - For `ph://` or `content://` URIs it does `RNFS.readFile(..., "base64")` then `toByteArray(base64Data)` – **one full image in JS memory per concurrent upload**. With many images, multiple full images can be in memory at once and push the JS heap over the limit.

2. **Other contributors** (already noted in IMAGE_MEMORY_REVIEW.md):  
   - Picker/camera paths that read full image as base64.  
   - Large or numerous objects in React state / AsyncStorage.  
   - Many mounted list items or full‑resolution decoding if not constrained.

---

## Fix Applied

### 1. Sequential upload (main fix)

The SharePoint upload loop was changed from **parallel** to **sequential**:

- **Before:** `updatedImageSections.forEach(async (item) => { await uploadImageSharepoint(...) });`  
  → All uploads start immediately; multiple images can be read (e.g. base64) at once.

- **After:** A `for` loop that `await`s each `uploadImageSharepoint(...)` before starting the next.  
  → Only one image is in the upload path at a time; peak JS memory is much lower.

This keeps the “upload one image at a time” behavior recommended in IMAGE_MEMORY_REVIEW.md and reduces OOM risk during batch uploads.

---

## Generate Report (PowerPoint) OOM

**You confirmed:** The crash happens when **generating the report** (GENERATE REPORT / PowerPoint), not during image upload. Images were already uploaded.

**Why report generation can OOM:**

1. **Template images** – Six large base64 images are imported from `src/assets/images.js` (backgroundImg, titleBackgroundImg, mainBackground, titleLogo, siteInfoLogo, dropPointIcon) and passed to pptxgen as `data:`. They stay in the JS heap and are referenced on many slides.
2. **All content images in memory** – pptxgen builds the whole presentation in memory. Each slide’s image (from `path: picture`) is read and held until `ppt.write("arraybuffer")`. With many images, the JS heap grows a lot.
3. **Final buffer** – `ppt.write("arraybuffer")` creates the full .pptx in memory. So at peak you have: template base64 + all slide image data inside pptxgen + the final arraybuffer.

**Fixes applied:**

- **Template images via file path** – At the start of report generation, the six template images are written once to temp files and pptxgen uses `path:` instead of `data:`. This avoids passing large base64 strings into pptxgen and reduces duplication in memory.

---

## Further Recommendations

1. **Keep FlatList tuning** – `windowSize={5}`, `maxToRenderPerBatch={5}`, `initialNumToRender={3}` so only a few list items (and images) are mounted.
2. **Prefer `file://` for uploads** – Copy picked/captured images to DocumentDirectory so upload uses streaming (`uploadFromFile`) and avoids base64 in JS.
3. **Memory / AppState** – Optionally listen for background/foreground and clear any caches or temporary data when the app goes to background.
4. **Monitor** – Use Xcode memory gauge and Instruments (Allocations / VM Tracker) during uploads and long sessions to confirm OOM is resolved and to catch any new growth.

---

## Research: Others Who Faced This Issue

Yes. The same crash pattern is reported by other developers. Summary below.

### 1. Almost identical crash (Hermes GitHub)

**Source:** [facebook/hermes#511 – OOM crash on iOS](https://github.com/facebook/hermes/issues/511)  
**App:** Plexamp (React Native 0.64.1, Hermes 0.7.2). Crashes showed up in BugSnag after release.

- **Same exception:** `EXC_BAD_ACCESS` (attempted to dereference null pointer).
- **Same stack:**  
  `hermes::vm::GCBase::oom` → `OldGen::fullCollectThenAlloc` → `OldGen::alloc` → `HiddenClass::addProperty` → `JSObject::addOwnPropertyImpl` → `Interpreter::interpretFunction`.
- **Same observation:** “Looks like an out-of-memory issue, but **free memory shows as considerable** in all the reports and **didn’t have any issues with JSC**.”
- **Repro:** Bug does **not** occur with JSC; only with Hermes.

So the same “Hermes GC OOM → EXC_BAD_ACCESS” behaviour is documented in the Hermes repo.

### 2. SIGSEGV with Hermes (Stack Overflow)

**Source:** [React native app with Hermes crashes with SIGSEGV](https://stackoverflow.com/questions/60886903/react-native-app-with-hermes-crashes-with-sigsegv-segmentation-violation-inva)  
**Context:** Android, libhermes.so in stack trace; seen in production (e.g. BugSnag), “many times every day” for a subset of users.

- Crashes are in Hermes (SIGSEGV / invalid memory reference).
- Don’t reproduce locally; only in production for some devices/users.
- Community notes: can be OOM or error-handling related; Hermes can surface JS or native issues as SIGSEGV.

### 3. Hermes memory and GC issues (GitHub / articles)

- **[facebook/hermes#878](https://github.com/facebook/hermes/issues/878)** – Hermes uses **20–40 MB more** memory than JSC on iOS (e.g. RN 0.70.6, iPhone 12 Pro).
- **[facebook/hermes#982](https://github.com/facebook/hermes/issues/982)** – GC does not account for large native allocations (e.g. HostObjects); memory can stay “live” and contribute to OOM.
- **[facebook/hermes#1629](https://github.com/facebook/hermes/issues/1629)** – Hades GC not releasing memory as expected after component unmount.
- **Medium (Stackademic)** – [React Native OOM Crashes: Profiling with Hermes, Flipper, Heap Snapshots](https://medium.com/@dikhyantkrishnadalai/react-native-oom-crashes-explained-profiling-with-hermes-flipper-and-heap-snapshots-8e0de47a8d4b): Android 256–512 MB heap limits; OOM from image inflation, FlatList, and large JS allocations; recommends heap snapshots and reducing peak memory.

### 4. Kernel / VM message

**“mach_vm_allocate_kernel failed within call to vm_map_enter”** is reported in other contexts (e.g. Xcode/CI with Hermes builds on macOS). It indicates the kernel could not satisfy a VM allocation—consistent with the process having already consumed a lot of memory (your ~8.9 GB MALLOC / ~13.6 GB virtual).

### Conclusion

- **Same crash type:** Hermes OOM in GC (e.g. `GCBase::oom` / OldGen alloc) leading to EXC_BAD_ACCESS/SIGSEGV is a **known pattern** (Hermes#511 and others).
- **Common themes:** Higher JS heap use with Hermes, heavy allocations (images, base64, big buffers), and GC not reclaiming in time.
- **Mitigations used by others:** Reduce peak JS memory (sequential uploads, avoid large base64 in memory, use file paths), tune lists/images, and profile with Hermes heap snapshots. Your fixes (sequential uploads, template images via file path, disk-space check) align with that.

---

## How They Fixed It (and What We Did)

### 1. Hermes#511 (Plexamp) – no in-engine fix documented

The issue was **closed**; the repo does not document an Hermes engine fix. The reporter stated they **confirmed the crash does not occur with JSC**. So the only fix mentioned there is:

- **Workaround:** Use **JSC instead of Hermes** (e.g. `enableHermes: false`) if you must ship without other changes. That trades away Hermes benefits (startup, size) and is a last resort.

No Plexamp-specific app-level fix (e.g. reducing RegExp/string work or memory) was described in the issue.

### 2. Community / articles – reduce JS heap usage

From Medium, Hermes issues, and SO:

- **Reduce peak memory:** Avoid many large allocations at once. For uploads: process **one item at a time** (sequential loop with `await`) instead of starting all uploads in parallel.
- **Avoid base64 in JS when possible:** Prefer **file paths** so native/pptxgen read from disk instead of holding big base64 strings in the JS heap. For report generation: write template images to temp files and pass `path:` to pptxgen instead of `data:`.
- **FlatList tuning:** Use `windowSize={5}`, `maxToRenderPerBatch={5}`, `initialNumToRender={3}`, `removeClippedSubviews={true}` so fewer items (and images) are mounted.
- **Cleanup:** Unsubscribe listeners and clear caches in `useEffect` cleanup or on background; avoid holding large objects in state/AsyncStorage longer than needed.
- **Profiling:** Use Hermes heap snapshots (Flipper / React Native DevTools) to find what keeps memory high.
- **Last resort:** **Switch to JSC** temporarily if Hermes OOM cannot be mitigated in the app.

### 3. Seven Hills (upload OOM) – native module

[Blog post](https://www.sevenhillstechnology.com/blog/cracking-the-code-fixing-memory-leaks-and-file-corruption-in-react-native-gcp-uploads): Uploads in JS (RNFetchBlob, base64 chunks) kept the GC from reclaiming memory and led to OOM.

- **Fix:** Move **upload logic to native** (Expo Native Modules): iOS (Swift) and Android (Kotlin) read file in chunks (e.g. 5 MB) and send via `URLSession` / `HttpURLConnection`. No big base64 in the JS heap → stable memory and no upload OOM.

### 4. SolarVest – what we did

- **Upload OOM:** Switched from **parallel** (`forEach` + async) to **sequential** `for` loop with `await` for each `uploadImageSharepoint(...)`. Only one image in the upload path at a time → much lower peak JS memory.
- **Report (PowerPoint) OOM:** Write the six **template images to temp files** and pass **file paths** to pptxgen instead of base64 `data:`. Release the large array buffer after writing (`arrayBuffer = null`). Write PPT in chunks where applicable.
- **Storage:** Before generating the report, **check free disk space** (`RNFS.getFSInfo()`), **estimate** required space (images + overhead), and **warn** the user if free space is low, with “Try anyway” / “Cancel”.
- **UX:** “Save to device (Downloads)” option and clearer OOM error message (free up storage, close other apps, try fewer images).

**Summary:** Nobody “fixed” the Hermes engine for this OOM in the issues we found. Fixes are **app-side**: reduce JS heap pressure (sequential work, file paths instead of base64, list tuning, native modules for heavy I/O), and optionally use JSC as a last resort.

---

## "Excessive number of pending callbacks: 501" warning

**What it means:** The native side has 501 callbacks that JS registered (e.g. for `Image.getSize`, or other bridge calls) but native never invoked them, so they are "pending" and considered leaked.

**Why it happens during report generation:** Report generation calls `Image.getSize` once per image. If the app crashes (e.g. Hermes OOM) before native can invoke those callbacks, they stay pending. Very large image counts (or stress test) can make this worse.

**What we did:** Added a **15s timeout** around `Image.getSize` in report generation so that if native never calls back, the Promise rejects and we don’t leave that callback pending forever. That reduces callback buildup when native is slow or the app is under memory pressure.

---

## EXC_BAD_ACCESS in `Value call(...)` / `plain_.call` (JSI layer)

**Symptom:** `EXC_BAD_ACCESS (code=1, address=0x0)` in the JS thread, stack in:
- `Value call(const Function& f, const Value& jsThis, const Value* args, size_t count) override { return plain_.call(f, jsThis, args, count); }`
- (in React Native’s JSI `decorator.h`)

**Meaning:** A null pointer is being used (address 0x0). The bridge is calling into the JS runtime (`plain_.call`), and either the underlying runtime reference or something inside the call is invalid (e.g. runtime torn down, or invalid `Function`/`Value`).

**Common with JSC + Reanimated:** This pattern is reported when using **JSC** (Hermes disabled) with **react-native-reanimated**. Reanimated uses JSI/worklets; with JSC, reloads or certain call paths can hit this crash.

**What we did:**
1. **Babel:** Reanimated’s plugin must be **last** in `babel.config.js`. It was first; it’s now last. After changing, run `npx react-native start --reset-cache` and do a clean iOS build.
2. **Clean build:** `cd ios && pod install`, then in Xcode: Product → Clean Build Folder, then build again.
3. **If it still crashes:** Consider re-enabling Hermes and relying on app-side memory fixes (sequential uploads, template images via file path, disk check). Hermes avoids this JSC/Reanimated class of crash but brings back OOM risk; the memory fixes reduce that.

---

## Ship Without Crash: Disable Hermes (Current Workaround)

Because the crash still occurred after app-side fixes, **Hermes is disabled** in the Podfile so the app should use **JavaScriptCore (JSC)** instead.

**If you still see Hermes in the crash log** (e.g. `hermes.framework`, `hermes::vm::GCBase::oom`, `HadesGC` in the stack): the build you ran still had Hermes enabled. Often the Xcode project had `USE_HERMES = true` in `project.pbxproj` and/or `Podfile.lock` still had Hermes from a previous install. Both are now fixed; you must do a **full clean reinstall** (see below). Then confirm in the app log: `[App] JS engine: JSC`. The same OOM does not occur with JSC (reported in [Hermes#511](https://github.com/facebook/hermes/issues/511) and others).

### What was changed

| Platform | File | Change |
|----------|------|--------|
| **iOS** | `ios/Podfile` | `ENV['USE_HERMES']='0'` at top; `:hermes_enabled => false` in `use_react_native!` |
| **iOS** | `ios/SolarVest_Project.xcodeproj/project.pbxproj` | `USE_HERMES = false` (was `true`, so Hermes was still linked) |
| **Android** | `android/gradle.properties` | `hermesEnabled=false` |

### After pulling these changes (iOS – critical)

The crash log still showing **hermes.framework** / **HadesGC** means the **running app is an old build** that was built with Hermes. You must do a **full clean and reinstall** so the binary actually uses JSC:

1. **Quit Xcode** (Cmd+Q).
2. **Terminal – clean everything:**
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/SolarVest*
   cd /path/to/solarvest_master/ios
   rm -rf build Pods Podfile.lock
   pod install
   ```
3. **Simulator:** Delete the SolarVest app (long‑press icon → Delete App). This forces a fresh install so the new build is the one that runs.
4. **Xcode:** Open `SolarVest_Project.xcworkspace` (not the .xcodeproj). Product → Clean Build Folder, then Build and run.
5. **Confirm:** In the app log you should see `[App] JS engine: JSC`. If a new crash still shows `hermes.framework` or `hermes::vm::GCBase::oom`, you are still running an old binary — repeat from step 1 and ensure the app was deleted from the simulator before step 4.

**Android:** Clean build: `cd android && ./gradlew clean` then build as usual.

### Trade-offs

- **Pros:** Stops the Hermes OOM crash so you can ship a stable build.
- **Cons:** Slightly larger app size and potentially slower cold start than with Hermes; no functional change to your app.

### Re-enabling Hermes later

When you want to try Hermes again (e.g. after more memory optimizations or a Hermes update):

1. **iOS:** In `ios/Podfile`, remove the `ENV['USE_HERMES'] = '0'` line and set `:hermes_enabled => true`. In `ios/SolarVest_Project.xcodeproj/project.pbxproj`, set `USE_HERMES = true`. Then `cd ios && rm -rf Pods Podfile.lock && pod install` and rebuild.
2. **Android:** In `android/gradle.properties`, set `hermesEnabled=true`, then clean and rebuild.

Keep the app-side fixes (sequential uploads, template images via file path, disk check); they still reduce memory and help when you re-enable Hermes.

---

## JSC teardown crash (SIGABRT) – “dangling API object/string”

After switching from Hermes to JSC you may see:

```text
com.facebook.react.JavaScript: signal SIGABRT
JSCRuntime destroyed with a dangling API object
JSCRuntime destroyed with a dangling API string
```

**Cause:** In **Debug** builds, JavaScriptCore’s runtime checks that all JSI objects and strings are released before the runtime is destroyed. If something (e.g. react-native-reanimated worklets, a native module callback, or the bridge during reload) still holds a reference when the runtime tears down, this assert fires and the process aborts.

### Fix applied (patch)

A **patch** disables this teardown assert in React Native’s JSCRuntime so Debug builds no longer abort:

| File | Change |
|------|--------|
| `patches/react-native+0.75.5.patch` | Replaces the two `assert(...)` calls in `JSCRuntime::~JSCRuntime()` with a comment. The runtime is torn down anyway; the patch only avoids the SIGABRT. |

The patch is applied automatically on `npm install` / `yarn` (via `postinstall: patch-package`). After pulling, run `npm install` or `npx patch-package` so the change is applied. Then **rebuild the iOS app** (clean build if needed) so the updated JSC code is used.

### If the crash persists

1. **Run in Release** – Use Build Configuration **Release** or `npx react-native run-ios --configuration Release`; the assert is not compiled in Release.
2. **Avoid reload during heavy work** – Don’t Fast Refresh or Reload while report generation or uploads are in progress.
3. **Re-enable Hermes** – If you prefer, you can switch back to Hermes and rely on the app-side memory fixes to reduce OOM risk.

---

## Summary

| Item              | Detail                                                |
|-------------------|--------------------------------------------------------|
| **Crash**         | Hermes JS heap OOM → GC failed to allocate → SIGSEGV  |
| **Primary fix**   | Upload images **sequentially** instead of in parallel  |
| **Why it helps**  | At most one image (and for ph://, one base64 buffer) in the upload path at a time |
| **Others**        | Same pattern in [Hermes#511](https://github.com/facebook/hermes/issues/511), SO, and Hermes memory issues (#878, #982, #1629) |
| **Next steps**    | Keep list/image tuning; consider AppState/cache handling; profile with Instruments |
