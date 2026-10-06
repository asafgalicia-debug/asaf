const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const workspace = path.resolve(__dirname, '../..');
// Native outputs and unrelated applications are not mobile JavaScript inputs.
config.watchFolders = config.watchFolders.filter(folder =>
  ![path.join(workspace, 'apps/web'), path.join(workspace, 'backend')].includes(folder));
const existingBlocks = config.resolver.blockList ? [].concat(config.resolver.blockList) : [];
const escapePath = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const generatedFolders = [path.join(workspace, 'node_modules/react-native'), path.join(workspace, 'node_modules/react'), path.join(workspace, 'node_modules/@react-native/gradle-plugin'), path.join(__dirname, 'android'), path.join(workspace, 'output'), path.join(workspace, 'tmp'), path.join(workspace, '.gradle-user-home')];
config.resolver.blockList = [...existingBlocks, ...generatedFolders.map(folder => new RegExp('^' + escapePath(folder) + '[\\\\/].*')),
  /[\\/](?:android|ios)[\\/]build[\\/].*/];
// Hoisted packages must use the mobile React and native renderer together.
const mobilePackages = Object.fromEntries(['react', 'react-native'].map((name) =>
  [name, path.dirname(require.resolve(`${name}/package.json`, { paths: [__dirname] }))]));
if (process.platform === 'win32') config.maxWorkers = 2;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  for (const [name, directory] of Object.entries(mobilePackages)) {
    if (moduleName === name || moduleName.startsWith(`${name}/`)) {
      const entry = moduleName === name ? 'index.js' : moduleName.slice(name.length + 1);
      return context.resolveRequest(context, path.join(directory, entry), platform);
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
