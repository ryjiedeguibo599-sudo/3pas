const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Block the root-level server.js from being bundled by Metro
const serverPath = path.resolve(__dirname, '../../server.js')
config.resolver.blockList = [
  new RegExp(serverPath.replace(/\\/g, '\\\\') + '$'),
]

module.exports = config
