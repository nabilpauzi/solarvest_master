import AsyncStorage from "@react-native-async-storage/async-storage";

const CUSTOM_CATEGORY_NAMES_KEY = "customCategoryNames";

/**
 * Get custom category names from AsyncStorage
 * Returns a map of original name -> custom name
 */
export const getCustomCategoryNames = async () => {
  try {
    const customNamesJSON = await AsyncStorage.getItem(CUSTOM_CATEGORY_NAMES_KEY);
    if (customNamesJSON) {
      return JSON.parse(customNamesJSON);
    }
    return {};
  } catch (error) {
    console.error("Error loading custom category names:", error);
    return {};
  }
};

/**
 * Save custom category names to AsyncStorage
 * @param {Object} customNames - Map of original name -> custom name
 */
export const saveCustomCategoryNames = async (customNames) => {
  try {
    await AsyncStorage.setItem(
      CUSTOM_CATEGORY_NAMES_KEY,
      JSON.stringify(customNames)
    );
    return true;
  } catch (error) {
    console.error("Error saving custom category names:", error);
    return false;
  }
};

/**
 * Update a single category name
 * @param {string} originalName - The original category name
 * @param {string} newName - The new custom name
 */
export const updateCategoryName = async (originalName, newName) => {
  try {
    const customNames = await getCustomCategoryNames();
    if (newName && newName.trim() !== "") {
      customNames[originalName] = newName.trim();
    } else {
      // If empty, remove the custom name (revert to default)
      delete customNames[originalName];
    }
    await saveCustomCategoryNames(customNames);
    return true;
  } catch (error) {
    console.error("Error updating category name:", error);
    return false;
  }
};

/**
 * Reset all custom category names (revert to defaults)
 */
export const resetCategoryNames = async () => {
  try {
    await AsyncStorage.removeItem(CUSTOM_CATEGORY_NAMES_KEY);
    return true;
  } catch (error) {
    console.error("Error resetting category names:", error);
    return false;
  }
};

