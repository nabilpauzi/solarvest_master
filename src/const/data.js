export const defaultCategories = [
  { amount: 1, name: "Map Overview", icon: "map" },
  { amount: 14, name: "Roofs", icon: "house-chimney" },
  { amount: 14, name: "Inverter Location", icon: "solar-panel" },
  { amount: 2, name: "BESS Location", icon: "battery-half" },
  { amount: 14, name: "MSB Room", icon: "bolt-lightning" },
  { amount: 14, name: "Cable Route", icon: "route" },
  { amount: 10, name: "Substation", icon: "map-location-dot" },
  { amount: 5, name: "TNB PE", icon: "lightbulb" },
  { amount: 5, name: "Storage & Hoisting", icon: "warehouse" },
  { amount: 14, name: "Measurement access", icon: "ruler" },
  { amount: 10, name: "FCLR", icon: "power-off" },
  { amount: 2, name: "Other", icon: "gears" },
  // { amount: 2, name: "EV Charger", icon: "charging-station" },
  // { amount: 2, name: "Drone Footage", icon: "helicopter" },
];

// Export categories for backward compatibility (will use defaults)
export const categories = defaultCategories;

export const subCategories = [
  { name: "Installtion Location" },
  { name: "Tapping Point Location" },
];

/**
 * Get categories with custom names applied
 * This function should be called from components that need dynamic category names
 */
export const getCategoriesWithCustomNames = async () => {
  const { getCustomCategoryNames } = await import("../utils/categoryUtils");
  const customNames = await getCustomCategoryNames();
  
  return defaultCategories.map((category) => ({
    ...category,
    name: customNames[category.name] || category.name,
    originalName: category.name, // Keep original name for reference
  }));
};

  //  android:roundIcon="@mipmap/ic_launcher_round"