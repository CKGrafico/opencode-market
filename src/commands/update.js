import chalk from 'chalk'
import { fetchJsonFile } from '../utils/github.js'
import { getMarketplace, setMarketplace } from '../utils/registry.js'
import { fetchPluginJson, installPlugin } from '../utils/installer.js'
import { header, success, error, info, warn } from '../utils/exec.js'

/**
 * Update all installed plugins for a given marketplace.
 * @param {string} marketplaceName
 */
export async function runUpdate(marketplaceName) {
  header('Updating marketplace');

  const registry = await getMarketplace(marketplaceName);
  if (!registry) {
    error(`Marketplace "${marketplaceName}" is not registered`);
    info('Run: npx opencode-market add <owner/repo> first');
    return;
  }

  const [owner, repo] = registry.repo.split('/');

  info(`Re-fetching marketplace.json from ${registry.repo}...`);
  const marketplace = await fetchJsonFile(owner, repo, registry.ref, registry.source);
  if (!marketplace) {
    error(`Could not fetch marketplace.json from ${registry.repo}`);
    return;
  }

  // Update the registry entry with latest marketplace data
  await setMarketplace(marketplaceName, {
    repo: registry.repo,
    ref: registry.ref,
    source: registry.source,
    installed: registry.installed || [],
  });

  success(`Marketplace "${marketplaceName}" refreshed`);

  const installed = registry.installed || [];
  if (installed.length === 0) {
    info('No installed plugins to update');
    return;
  }

  info(`Updating ${installed.length} installed plugin(s)...`);

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
    await installPlugin(owner, repo, registry.ref, pluginBasePath, pluginJson);
    success(`Updated ${chalk.bold(pluginName)}`);
  }

  success('All installed plugins updated');
}
