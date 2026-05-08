import chalk from 'chalk'
import { fetchJsonFile } from '../utils/github.js'
import { getMarketplace } from '../utils/registry.js'
import { fetchPluginJson, installPlugin } from '../utils/installer.js'
import { header, success, error, info, warn } from '../utils/exec.js'

/**
 * Re-download all installed plugins for a given marketplace.
 * @param {string} marketplaceName
 * @param {{ local?: boolean, opencode?: boolean }} options
 */
export async function runUpdate(marketplaceName, options = {}) {
  header('Updating plugins');

  const registry = await getMarketplace(marketplaceName);
  if (!registry) {
    error(`Marketplace "${marketplaceName}" is not registered`);
    info('Run: npx opencode-market add <owner/repo> first');
    return;
  }

  const installed = registry.installed || [];
  if (installed.length === 0) {
    info(`No installed plugins for "${marketplaceName}"`);
    return;
  }

  const [owner, repo] = registry.repo.split('/');

  // Need marketplace.json only to resolve each plugin's source path
  const marketplace = await fetchJsonFile(owner, repo, registry.ref, registry.source);
  if (!marketplace) {
    error(`Could not fetch marketplace.json from ${registry.repo}`);
    return;
  }

  info(`Updating ${installed.length} plugin(s) from "${marketplaceName}"...`);

  for (const pluginName of installed) {
    const pluginEntry = marketplace.plugins?.find(p => p.name === pluginName);
    if (!pluginEntry) {
      warn(`Plugin "${pluginName}" no longer exists in marketplace, skipping`);
      continue;
    }

    const result = await fetchPluginJson(owner, repo, registry.ref, registry.source, pluginEntry.source);
    if (!result) {
      warn(`Could not fetch plugin.json for "${pluginName}", skipping`);
      continue;
    }

    const { pluginJson, pluginBasePath } = result;
    info(`Updating ${pluginName} to v${pluginJson.version}...`);
    await installPlugin(owner, repo, registry.ref, pluginBasePath, pluginJson, options);
    success(`Updated ${chalk.bold(pluginName)}`);
  }

  success('Done');
}
