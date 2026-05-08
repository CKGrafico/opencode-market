import chalk from 'chalk'
import { fetchJsonFile } from '../utils/github.js'
import { getMarketplace, markInstalled } from '../utils/registry.js'
import { fetchPluginJson, installPlugin } from '../utils/installer.js'
import { header, success, error, info } from '../utils/exec.js'

/**
 * Install a plugin from a registered marketplace.
 * @param {string} pluginAtMarketplace - "plugin@marketplace" format
 * @param {{ local?: boolean }} options
 */
export async function runInstall(pluginAtMarketplace, options = {}) {
  header('Installing plugin');

  const atIndex = pluginAtMarketplace.indexOf('@');
  if (atIndex === -1 || atIndex === 0 || atIndex === pluginAtMarketplace.length - 1) {
    error(`Invalid format: ${pluginAtMarketplace}. Expected plugin@marketplace`);
    return;
  }

  const pluginName = pluginAtMarketplace.slice(0, atIndex);
  const marketplaceName = pluginAtMarketplace.slice(atIndex + 1);

  const registry = await getMarketplace(marketplaceName);
  if (!registry) {
    error(`Marketplace "${marketplaceName}" is not registered`);
    info('Run: npx opencode-market add <owner/repo> first');
    return;
  }

  info(`Looking up plugin "${pluginName}" in ${marketplaceName}...`);

  const [owner, repo] = registry.repo.split('/');
  const marketplace = await fetchJsonFile(owner, repo, registry.ref, registry.source);
  if (!marketplace) {
    error(`Could not fetch marketplace.json from ${registry.repo}`);
    return;
  }

  const pluginEntry = marketplace.plugins?.find(p => p.name === pluginName);
  if (!pluginEntry) {
    error(`Plugin "${pluginName}" not found in marketplace "${marketplaceName}"`);
    info('Available plugins:');
    for (const p of (marketplace.plugins || [])) {
      info(`  ${p.name}`);
    }
    return;
  }

  const result = await fetchPluginJson(owner, repo, registry.ref, registry.source, pluginEntry.source);
  if (!result) {
    error(`Could not fetch plugin.json for "${pluginName}"`);
    return;
  }

  const { pluginJson, pluginBasePath } = result;
  info(`Installing ${pluginName} v${pluginJson.version}...`);

  await installPlugin(owner, repo, registry.ref, pluginBasePath, pluginJson, options);
  await markInstalled(marketplaceName, pluginName);

  success(`Installed ${chalk.bold(pluginName)} from ${chalk.bold(marketplaceName)}`);
}
