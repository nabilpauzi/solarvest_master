/**
 * Image compression utility for PPT report generation.
 *
 * Speed: skips native work for small images; runs up to CONCURRENCY compressions in parallel.
 */

import PhotoManipulator from "react-native-photo-manipulator";
import RNFS from "react-native-fs";
import { Image } from "react-native";

const DEFAULT_OPTIONS = {
  // Balanced defaults: faster than old path, still high quality.
  maxDimension: 1600,
  jpegQuality: 72,
  // Skip native compression for already-small files.
  skipCompressMaxBytes: 700 * 1024,
  // 2 is safer for memory-heavy devices, 3 is faster.
  concurrency: 3,
};

function getImageDimensions(uri, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (val) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(val);
    };
    const timer = setTimeout(() => done(null), timeoutMs);
    Image.getSize(
      uri,
      (w, h) => done(w > 0 && h > 0 ? { width: w, height: h } : null),
      () => done(null)
    );
  });
}

/**
 * Compress one image, or return original fast-path when no native work needed.
 */
export async function compressImageForPPT(imageUri, options = {}) {
  if (!imageUri || typeof imageUri !== "string") return null;
  const cfg = { ...DEFAULT_OPTIONS, ...options };

  try {
    const dims = await getImageDimensions(imageUri);
    if (!dims) return null;

    const { width, height } = dims;
    const originalPath = imageUri.replace(/^file:\/\//, "");
    let originalBytes = 0;
    try {
      const stat = await RNFS.stat(originalPath);
      originalBytes = Number(stat.size) || 0;
    } catch (_) {}

    const needsResize =
      width > cfg.maxDimension || height > cfg.maxDimension;

    let targetWidth = width;
    let targetHeight = height;
    if (needsResize) {
      if (width >= height) {
        targetWidth = cfg.maxDimension;
        targetHeight = Math.round((height / width) * cfg.maxDimension);
      } else {
        targetHeight = cfg.maxDimension;
        targetWidth = Math.round((width / height) * cfg.maxDimension);
      }
    }

    const normalizedUri = imageUri.startsWith("file://")
      ? imageUri
      : `file://${originalPath}`;

    // Fast path: already fits slide size and file is small — no native compress (huge time save)
    if (!needsResize && originalBytes > 0 && originalBytes <= cfg.skipCompressMaxBytes) {
      return {
        uri: normalizedUri,
        width,
        height,
        originalBytes,
        compressedBytes: originalBytes,
        originalWidth: width,
        originalHeight: height,
        reusedOriginal: true,
      };
    }

    const resultPath = await PhotoManipulator.batch(
      normalizedUri,
      [],
      { x: 0, y: 0, width, height },
      { width: targetWidth, height: targetHeight },
      cfg.jpegQuality
    );

    if (!resultPath) return null;

    const resultUri = resultPath.startsWith("file://")
      ? resultPath
      : `file://${resultPath}`;

    let compressedBytes = 0;
    try {
      const stat = await RNFS.stat(resultUri.replace(/^file:\/\//, ""));
      compressedBytes = Number(stat.size) || 0;
    } catch (_) {}

    return {
      uri: resultUri,
      width: targetWidth,
      height: targetHeight,
      originalBytes,
      compressedBytes,
      originalWidth: width,
      originalHeight: height,
      reusedOriginal: false,
    };
  } catch (e) {
    console.warn("[ImageCompressor] Failed to compress, using original:", e?.message);
    return null;
  }
}

/**
 * Compress many images with limited parallelism + progress.
 */
export async function compressImagesForPPT(items, onProgress, options = {}) {
  const cfg = { ...DEFAULT_OPTIONS, ...options };
  const compressedMap = new Map();
  const tempFiles = [];
  const total = items.length;
  let totalOriginalBytes = 0;
  let totalCompressedBytes = 0;
  let skippedCount = 0;
  let completed = 0;

  const formatMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

  const work = [];
  for (let i = 0; i < total; i++) {
    const item = items[i];
    if (!item?.picture) {
      skippedCount++;
      completed++;
      if (onProgress) {
        try {
          const ret = onProgress(completed, total);
          if (ret && typeof ret.then === "function") await ret;
        } catch (_) {}
      }
      continue;
    }
    work.push({ item, index: i });
  }

  for (let w = 0; w < work.length; w += cfg.concurrency) {
    const batch = work.slice(w, w + cfg.concurrency);
    const results = await Promise.all(
      batch.map(({ item, index }) =>
        compressImageForPPT(item.picture, cfg).then((result) => ({
          item,
          index,
          result,
        }))
      )
    );

    for (const { item, index, result } of results) {
      completed++;
      if (result) {
        const key =
          item.__compressKey ||
          (item.id != null ? `id:${String(item.id)}` : `idx:${String(index)}`);
        compressedMap.set(key, result);
        if (!result.reusedOriginal) {
          tempFiles.push(result.uri.replace(/^file:\/\//, ""));
        }
        totalOriginalBytes += result.originalBytes;
        totalCompressedBytes += result.compressedBytes;
      } else {
        skippedCount++;
      }
      if (onProgress) {
        try {
          const ret = onProgress(completed, total);
          if (ret && typeof ret.then === "function") await ret;
        } catch (_) {}
      }
    }
  }

  const totalSaved = totalOriginalBytes - totalCompressedBytes;
  const totalSavedPct =
    totalOriginalBytes > 0
      ? ((totalSaved / totalOriginalBytes) * 100).toFixed(1)
      : "0";
  console.log(
    `[Report] Compression: ${compressedMap.size}/${total} images, ${formatMB(totalOriginalBytes)} MB → ${formatMB(totalCompressedBytes)} MB (${totalSavedPct}% saved), parallel=${cfg.concurrency}, dim=${cfg.maxDimension}, q=${cfg.jpegQuality}`
  );

  return { compressedMap, tempFiles, totalOriginalBytes, totalCompressedBytes };
}

export async function cleanupTempImages(paths) {
  for (const p of paths) {
    try {
      await RNFS.unlink(p);
    } catch (_) {}
  }
}
