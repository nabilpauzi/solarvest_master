import Share from "react-native-share";
import { Platform } from "react-native";
import { saveFileToDownloads as saveToDownloadsNative } from "./fileSaveModule.js";

const shareFile = async (filePath) => {
  try {
    // Share the file
    const shareOptions = {
      title: "Share File",
      url: `file://${filePath}`, // The file path in the file system
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation", // Adjust to your file type
      subject: "Here is your file", // For email or other services
    };

    await Share.open(shareOptions);
  } catch (error) {
    console.log("Error sharing file:", error);
  }
};

/**
 * Saves a file to Downloads folder on Android using MediaStore API
 * This makes the file visible in file managers
 */
export const saveToDownloads = async (filePath, fileName) => {
  if (Platform.OS !== "android") {
    console.log("saveToDownloads is only available on Android");
    return false;
  }

  try {
    // Try using native module first (uses MediaStore API for Android 10+)
    try {
      const result = await saveToDownloadsNative(filePath, fileName);
      console.log("File saved to Downloads using native module:", result);
      return true;
    } catch (nativeError) {
      console.log("Native module failed, falling back to Share API:", nativeError.message);
      // Fallback to react-native-share if native module fails
      await Share.open({
        url: `file://${filePath}`,
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        title: "Save to Downloads",
        message: `Save ${fileName} to Downloads folder?`,
        saveToFiles: true,
      });
      return true;
    }
  } catch (error) {
    // User cancelled or error occurred
    if (error.message && error.message.includes("User did not share")) {
      console.log("User cancelled save to Downloads");
      return false;
    }
    console.error("Error saving to Downloads:", error);
    return false;
  }
};

export default shareFile;

