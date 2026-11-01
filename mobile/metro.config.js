const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
// The pure Progress helpers are shared with Next.js; they have no React/DOM dependencies at import time.
config.watchFolders = [...(config.watchFolders || []), path.resolve(__dirname, '../frontend/src/lib')];
module.exports = config;
