# Xcode Memory Profiling Guide – SolarVest

How to use Xcode’s memory gauge and Instruments (Allocations / VM Tracker) to confirm the OOM fix and spot remaining memory growth during uploads and long sessions.

---

## 1. Xcode Memory Gauge (Quick Check)

### Run the app from Xcode

1. Open the iOS project in Xcode:
   - `ios/SolarVest_Project.xcworkspace` (if using CocoaPods) **or**
   - `ios/SolarVest_Project.xcodeproj`

2. Select the **SolarVest_Project** scheme and an **iPhone Simulator** (or a physical device).

3. Press **⌘R** (or Product → Run) to build and run.

4. While the app is running, open the **Debug navigator**:
   - **View → Navigators → Show Debug Navigator**, or **⌘7**.

5. In the left sidebar, select the **running app process** (e.g. “SolarVest_Project”).

6. At the top you’ll see **CPU**, **Memory**, **Disk**, etc. Click **Memory**.

7. The **memory gauge** shows:
   - Current memory use (e.g. “85 MB”).
   - A small graph over time.
   - Rough “zones”: green → yellow → red as usage grows.

### What to do

- **Before upload:** Note the baseline (e.g. 80–120 MB).
- **During upload:** Trigger “Upload” / save pictures to SharePoint. Watch the gauge.
  - **Good:** Memory may rise during each image then drop again (sequential upload = one image at a time).
  - **Bad:** Steady climb into hundreds of MB or toward red without dropping.
- **Long session:** Use the app for 10–20+ minutes (open categories, scroll lists, add/delete images, upload again). Memory should not climb without bound.
- **After upload / after leaving heavy screens:** Memory often drops after a few seconds (GC). If it stays high, there may be retained references.

**Red zone** or **repeated growth without recovery** suggests a leak or too much retained data; use Instruments next.

---

## 2. Instruments – Allocations (See What’s Allocating)

Allocations shows **who** is allocating memory (by category and sometimes call tree).

### Open Instruments

1. In Xcode, with the app **not** running: **Product → Profile** (or **⌘I**).
2. Choose the **SolarVest** scheme and Simulator/device, then click **Choose**.
3. In the Instruments template chooser, select **Allocations** and click **Choose**.

### Basic use

1. Recording starts automatically. Your app launches under Instruments.
2. **Allocations** list: shows allocation categories (e.g. “VM: JavaScript”, “MALLOC”, “CG raster data”). Focus on:
   - **VM: JavaScript** (Hermes JS heap) – this is where the OOM happened.
   - **MALLOC** – native heap.
3. Use the app:
   - Do an **upload** (save pictures to SharePoint).
   - Scroll category lists, open/close screens.
   - Repeat a few times or use the app for a **longer session** (e.g. 10–15 minutes).
4. Click the **Mark Generation** button (circled arrow) **before** and **after** big actions (e.g. “Before upload”, “After upload”, “After 10 min”).
5. In the **Allocations** instrument:
   - **Persistent bytes** / **# Persistent** = what’s still alive. Growth that never goes down = leak or retained data.
   - **Transient** spikes during upload that then drop = normal.

### Call tree (optional)

- In the **Allocations** detail, use **View → Call Tree** (or the call tree icon).
- Enable **Invert Call Tree** and **Hide System Libraries** to see your app’s and JS’s contribution.
- Look for large or growing categories (e.g. “JSObject”, “Array”, “string”) if you need to dig deeper.

**Goal:** After the sequential-upload fix, you should see **no unbounded growth** in “VM: JavaScript” or MALLOC over time; upload may cause a short spike, then a drop.

---

## 3. Instruments – VM Tracker (Virtual Memory Regions)

VM Tracker shows **virtual memory regions** (similar to the crash report’s “VM Region Summary”) and helps spot large or growing regions.

### Open VM Tracker

1. **Product → Profile** (⌘I).
2. In the template chooser, select **Leaks** or **Allocations**, then click the **+** at the top and add **VM Tracker** from the list.  
   Or: **File → New** and pick a blank template, then add **VM Tracker**.
3. Start recording; the app launches.

### Basic use

1. **VM Tracker** shows regions by type: **Dirty**, **Resident**, **Swapped**, etc.
2. **Dirty** memory is the most important: it’s memory your process has written (real usage).
3. Use the app (upload, scroll, long session) and **Snapshot** (e.g. “Before upload”, “After upload”, “After 10 min”).
4. Compare snapshots:
   - **Dirty size** should not grow without bound.
   - **MALLOC** and **VM: JavaScript** (or similar) are the main suspects from the crash; watch their **Dirty** size over time.

**Goal:** Dirty memory grows during upload then stabilizes or decreases; it should not keep climbing for the whole session.

---

## 4. Suggested Workflow (Upload + Long Session)

1. **Xcode memory gauge**
   - Run app from Xcode (⌘R).
   - Note baseline memory.
   - Do one full upload (all images to SharePoint).
   - Watch: spike then drop = good; steady rise = bad.
   - Use app 10–15 minutes (navigate, scroll, add/remove images, maybe upload again).
   - Memory should not trend upward into the red.

2. **Instruments – Allocations**
   - Profile with Allocations (⌘I → Allocations).
   - Mark generations: “Start”, “After first upload”, “After 10 min”.
   - Check **VM: JavaScript** and **MALLOC** persistent bytes: no continuous growth.

3. **Instruments – VM Tracker** (if you want region-level detail)
   - Add VM Tracker to the same or a new session.
   - Take snapshots at the same points (before/after upload, after long use).
   - Confirm **Dirty** size does not grow unbounded.

---

## 5. Interpreting Results

| Observation | Meaning |
|-------------|--------|
| Memory spikes during upload then drops | Normal; sequential upload limits peak (one image at a time). |
| “VM: JavaScript” or MALLOC grows and never drops over 10+ min | Likely leak or too much retained data (e.g. images, closures, caches). |
| Dirty size in VM Tracker keeps increasing | Same: something is holding memory. |
| Memory in red zone in Xcode gauge | High risk of OOM; optimize or fix leaks before release. |

---

## 6. Tips

- **Simulator vs device:** Simulator often has more memory; test on a **real device** for production-like limits.
- **Release vs Debug:** Debug builds use more memory. For final check, profile a **Release** build (Edit Scheme → Run → Build Configuration → Release).
- **Hermes:** The crash was in Hermes (“VM: JavaScript”). That’s the first place to watch in Allocations / VM Tracker.
- **Baseline:** After cold start, wait a few seconds for initialisation, then note “idle” memory before starting your test.

Using the memory gauge regularly and Instruments for upload + long sessions will confirm the OOM fix and help you catch any remaining growth early.
