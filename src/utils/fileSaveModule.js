import { NativeModules, Platform } from 'react-native';

const { FileSaveModule } = NativeModules;

/**
 * Saves a file to Downloads folder on Android using MediaStore API
 * This makes the file visible in file managers on Android 10+
 * @param {string} filePath - Path to the source file
 * @param {string} fileName - Name for the file in Downloads folder
 * @returns {Promise<string>} - Promise that resolves with the saved file URI/path
 */
export const saveFileToDownloads = async (filePath, fileName) => {
  if (Platform.OS !== 'android') {
    throw new Error('saveFileToDownloads is only available on Android');
  }

  if (!FileSaveModule) {
    throw new Error('FileSaveModule is not available. Make sure the native module is properly linked.');
  }

  try {
    const result = await FileSaveModule.saveFileToDownloads(filePath, fileName);
    return result;
  } catch (error) {
    console.error('Error saving file to Downloads:', error);
    throw error;
  }
};

export default saveFileToDownloads;



