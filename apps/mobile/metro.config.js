const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Include the shared package so Metro transpiles it
config.watchFolders = [
  ...(config.watchFolders || []),
  path.resolve(__dirname, "../../packages/shared"),
];

// Exclude shared from node_modules resolution — it's outside the project
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(__dirname, "../../node_modules"),
];

// Add .ts and .tsx as source extensions
config.resolver.sourceExts = [...(config.resolver.sourceExts || []), "ts", "tsx"];

module.exports = config;