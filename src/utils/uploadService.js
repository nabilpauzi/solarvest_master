/**
 * Upload service: uploads images to SharePoint.
 * - For file:// URIs: uses rn-fetch-blob so the native layer streams the file
 *   (no base64 in JS, reduces OOM risk).
 * - For ph:// or content:// URIs (e.g. when copy to DocumentDirectory failed):
 *   falls back to read-then-POST so behaviour stays the same as before.
 */

import RNFetchBlob from "rn-fetch-blob";
import RNFS from "react-native-fs";
import axios from "axios";
import { toByteArray } from "react-native-quick-base64";
import { retrieveAccessToken } from "./sharePointUtils";

const SHAREPOINT_BASE =
  "https://solarvest.sharepoint.com/sites/ProjectDevelopment/_api/web";

/**
 * Normalize a file URI to a path string (strip file:// prefix).
 * RNFetchBlob expects paths without the file:// prefix.
 */
function uriToPath(uri) {
  if (!uri || typeof uri !== "string") return "";
  return uri.replace(/^file:\/\//, "");
}

/**
 * Upload via file path (stream from disk, no base64 in JS).
 */
async function uploadFromFile(filePath, fileUploadUrl, accessToken, formDigest) {
  const response = await RNFetchBlob.fetch(
    "POST",
    fileUploadUrl,
    {
      Authorization: `Bearer ${accessToken}`,
      "X-RequestDigest": formDigest,
      Accept: "application/json; odata=verbose",
      "Content-Type": "image/jpeg",
    },
    RNFetchBlob.wrap(filePath)
  );
  const status = response.info?.()?.status ?? response.respInfo?.status;
  if (status >= 200 && status < 300) return { success: true };
  return { success: false, status };
}

/**
 * Fallback for ph:// or content://: read file then POST (same as original flow).
 */
async function uploadFromUri(fileUri, fileUploadUrl, accessToken, formDigest) {
  const base64Data = await RNFS.readFile(fileUri, "base64");
  const arrayBuffer = toByteArray(base64Data);
  const response = await axios({
    method: "POST",
    url: fileUploadUrl,
    data: arrayBuffer,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-RequestDigest": formDigest,
      Accept: "application/json; odata=verbose",
      "Content-Type": "image/jpeg",
    },
  });
  if (response.data?.d?.Exists) return { success: true };
  return { success: false };
}

/**
 * Get image count and total size in MB for a list of image URIs.
 * Logs to console and returns { count, totalSizeMB }.
 * Only file:// URIs are measured; others are counted but not sized.
 */
export async function getImageBatchStats(imageUris) {
  if (!imageUris || !Array.isArray(imageUris)) {
    return { count: 0, totalSizeMB: 0 };
  }
  const count = imageUris.length;
  let totalBytes = 0;
  for (const uri of imageUris) {
    if (!uri || typeof uri !== "string") continue;
    const path = uriToPath(uri);
    if (!path || !uri.startsWith("file://")) continue;
    try {
      const stat = await RNFS.stat(path);
      if (stat && typeof stat.size === "number") totalBytes += stat.size;
    } catch (_) {
      // skip unreadable paths
    }
  }
  const totalSizeMB = totalBytes / (1024 * 1024);
  return { count, totalSizeMB };
}

/**
 * Upload a single image to SharePoint. Same behaviour as before:
 * - file:// URIs: stream from disk (improvement, no base64 in JS).
 * - Other URIs (ph://, content://): read then POST (unchanged).
 *
 * @param {string} fileUri - Local file URI or ph:// / content:// URI
 * @param {string} imgName - File name to use on SharePoint
 * @param {string} folderUri - Folder path (e.g. project/category/categoryId)
 * @param {string} imgId - Image section id (unused here; caller uses for AsyncStorage)
 * @returns {Promise<boolean>} true if upload succeeded
 */
export async function uploadImageToSharePoint(fileUri, imgName, folderUri, imgId) {
  if (!fileUri || typeof fileUri !== "string") {
    return false;
  }

  const fileUploadUrl = `${SHAREPOINT_BASE}/GetFolderByServerRelativeUrl('/sites/ProjectDevelopment/ListofImage/${folderUri}')/Files/add(url='${imgName}',overwrite=true)`;

  try {
    const [accessToken, formDigest] = await retrieveAccessToken();
    if (!accessToken || !formDigest) {
      return false;
    }

    const isFileUri = fileUri.startsWith("file://");
    const filePath = uriToPath(fileUri);

    let result;
    if (isFileUri && filePath) {
      result = await uploadFromFile(filePath, fileUploadUrl, accessToken, formDigest);
    } else {
      result = await uploadFromUri(fileUri, fileUploadUrl, accessToken, formDigest);
    }

    if (result.success) return true;
    return false;
  } catch (error) {
    return false;
  }
}
