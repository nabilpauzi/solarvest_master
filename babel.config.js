// module.exports = {
//   presets: ['module:metro-react-native-babel-preset'],

//   overrides: [
//     {
//       test: './node_modules/ethers',
//       plugins: [
//         ['@babel/plugin-transform-private-methods', { loose: true }]
//       ]
//     }
//   ]

//   plugins: [
//     "react-native-reanimated/plugin",
//   ],
// };

// module.exports = {
//   presets: ["module:metro-react-native-babel-preset"],
//   plugins: [
//     // Other plugins if any
//     '@babel/plugin-transform-private-methods',
//     "react-native-reanimated/plugin", // <-- This must be last
//   ],
//   overrides: [
//     {
//       test: "./node_modules/ethers",
//       plugins: [["@babel/plugin-transform-private-methods", { loose: true }]],
//     },
//   ],
// };

module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    ["@babel/plugin-transform-class-properties", { loose: true }],
    ["@babel/plugin-transform-private-methods", { loose: true }],
    ["@babel/plugin-transform-private-property-in-object", { loose: true }],
    "react-native-reanimated/plugin", // Must be last (Reanimated docs)
  ],
};
