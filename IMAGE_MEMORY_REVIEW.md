# Image Memory Review – Tester Feedback

Review of the iOS image memory best-practices document sent by the tester, mapped to the SolarVest React Native app.

---

## Summary: Tester’s Document Is Solid

The guidance is correct for iOS and directly relevant to avoiding OOMs and memory pressure. Below is how each point applies to SolarVest and what to change.

---

## 1. Avoid Storing `UIImage` in Arrays ✅ (Mostly aligned)

**Tester:** Store file paths or identifiers; load images on-demand.

**SolarVest:**  
- `imageSections` holds **URIs** (`picture: "file://..."`), not decoded image data.  
- That matches “store paths, not images.”

**Caveat:**  
- When picking from Photos (`ph://` / `content://`), the app does `RNFS.readFile(imageUri, 'base64')` and then writes to disk. That briefly holds the **full image in memory**.  
- Same in `loadImageBase64()` used for SharePoint upload: each call reads the full file into memory.

**Action:**  
- Keep storing only URIs in state.  
- For uploads, consider streaming/chunked read instead of loading entire file into base64 when possible, or at least avoid holding multiple full base64 strings at once.

---

## 2. Downsample Before Displaying ⚠️ (Needs improvement)

**Tester:** Don’t load full resolution for thumbnails; use something like `CGImageSourceCreateThumbnailAtIndex`.

**SolarVest:**  
- Picker uses `maxHeight: 2000, maxWidth: 2000` – still large.  
- List and detail views use `<Image source={{ uri: section.picture }} />` with no size hint, so the native bridge can decode **full-resolution** images for display.

**Action:**  
- For list/category thumbnails, use a smaller display size (e.g. `style` with fixed width/height) and/or use a library that supports thumbnails (e.g. `react-native-fast-image` with resize mode, or native thumbnail generation).  
- Consider lowering picker `maxHeight`/`maxWidth` for “choose from gallery” when the image is only for list/upload (e.g. 1024 or 1200).  
- On iOS, true downsampling like `CGImageSourceCreateThumbnailAtIndex` would require native code or a library that uses it; worth considering if OOM persists.

---

## 3. Use Auto-release Pools ⚠️ (Relevant to native / batch work)

**Tester:** When generating many images in a loop, wrap work in `autoreleasepool { ... }` so temporary image data is released each iteration.

**SolarVest:**  
- JS layer doesn’t use autorelease pools (that’s native iOS).  
- Batch work that touches images:  
  - **Upload loop:** `updatedImageSections.forEach(async (item) => { await uploadImageSharepoint(...) })`. Each `uploadImageSharepoint` calls `loadImageBase64(imgUri)` so only one full image is in memory at a time – good.  
  - **Gallery picker:** For `ph://` URIs you do one `readFile(..., 'base64')` per pick – no loop of many images in one go.

**Action:**  
- If you add **native** iOS code that generates or processes many images in a loop, use `@autoreleasepool { }` inside the loop.  
- In JS, keep processing one image at a time in loops (as you largely do) and avoid building arrays of full base64 strings.

---

## 4. Implement Lazy Loading ✅ (Partially in place)

**Tester:** Load when about to appear (e.g. `cellForItemAt`); set to `nil` when off-screen.

**SolarVest:**  
- Category list uses **FlatList** with `data={imageSections}` and `renderItem` that renders `<Image source={{ uri: section.picture }} />`.  
- FlatList virtualizes: only visible items are mounted, so you get “load when about to appear” for list items.

**Gap:**  
- React Native’s `Image` with `uri` doesn’t give an explicit “set to nil when off-screen” hook. You can approximate by:  
  - Using `FlatList`’s `windowSize` / `maxToRenderPerBatch` to limit how many items are mounted.  
  - Or using a library that supports canceling/clearing off-screen image loads.

**Action:**  
- Add `windowSize={5}` (or similar) and `maxToRenderPerBatch={5}` to the category FlatList to reduce the number of mounted image components.  
- Optionally use `removeClippedSubviews={true}` on Android; on iOS it can help in some setups.

---

## 5. Handle Memory Warnings ⚠️ (Not implemented in app code)

**Tester:** Implement `didReceiveMemoryWarning` (or equivalent) to clear caches and purge non-visible images.

**SolarVest:**  
- No `AppState` / memory-warning handling in JS.  
- No explicit image cache clearing on memory pressure.

**Action:**  
- In React Native you can’t implement `didReceiveMemoryWarning` directly, but you can:  
  - Use `AppState` to listen for app going to background and optionally clear any in-memory image caches or temporary data.  
  - If you use an image library with a cache (e.g. Fast Image), call its “clear cache” when you get an app-level memory warning event if your stack exposes one, or on critical user actions (e.g. leaving a heavy screen).  
- For native iOS, if you have custom view controllers or image caches, implementing `didReceiveMemoryWarning` there is still recommended; the tester’s doc applies to that code.

---

## Tester’s Debugging Tools – Use Them

| Tool | Use in SolarVest |
|------|-------------------|
| **Xcode Memory Report** | Run the app from Xcode, watch the memory gauge in the Debug navigator; if it hits the red zone before a crash, treat as OOM. |
| **Instruments (Allocations / Leaks)** | Profile “Dirty VM” and allocations while opening category screens, scrolling the image list, and uploading multiple photos. |
| **MetricKit** | Integrate to get real-world termination reports (e.g. OOM) from users’ devices. |

---

## Recommended Code Changes (Priority)

1. **FlatList tuning** (Category screen): Set `windowSize` and `maxToRenderPerBatch` so fewer list images are mounted at once.  
2. **Thumbnail size**: Use a bounded size for list thumbnails (e.g. 200×200 or 300×300 in style) and consider lower `maxHeight`/`maxWidth` in the picker when full resolution isn’t needed.  
3. **Upload flow**: Keep uploading one image at a time (no parallel `loadImageBase64` for many images); consider streaming or chunked read for very large files if you add support for them.  
4. **Memory / AppState**: Add optional cache clearing or “release heavy data” on app background or when navigating away from the category screen, if you introduce caches or large in-memory structures.

---

## Conclusion

The tester’s document is accurate and useful. SolarVest already follows “store paths, not images” and uses FlatList for lazy rendering. The main improvements are: **downsampling/thumbnail sizing**, **FlatList virtualization limits**, and **memory-warning / cache handling** where applicable. Using Xcode memory tools and Instruments will help confirm OOM and guide further native-side optimizations (e.g. real downsampling with `CGImageSourceCreateThumbnailAtIndex` if needed).

---

## Changes implemented in the app

The following changes were applied in `src/components/Category.js` based on this review:

1. **FlatList memory tuning**
   - `windowSize={5}` – only ~5 screens worth of items are kept in memory.
   - `maxToRenderPerBatch={5}` – at most 5 new items per scroll batch.
   - `initialNumToRender={3}` – only 3 items rendered on first paint.
   - `removeClippedSubviews={true}` – unmount off-screen views (helps on Android; can help on iOS).

2. **List image size (thumbnail-style)**
   - List images now use a fixed-size style `listThumbnailImage`: width `width - 80`, height `300`, so the native decoder can allocate for display size instead of full resolution.

3. **Gallery picker max size**
   - `maxHeight` / `maxWidth` reduced from `2000` to `1200` when picking from gallery, so less memory when loading and copying the selected image.

**Still optional (not done):**
- **AppState / memory warning**: Add an `AppState` listener to clear caches or release heavy data when the app goes to background (useful if you add an image cache library later).
- **Native downsampling**: If OOM continues, consider a native module or library that uses `CGImageSourceCreateThumbnailAtIndex` for true thumbnail generation on iOS.
