import chalk from 'chalk'
import { readRegistries } from '../utils/registry.js'
import { header, info } from '../utils/exec.js'

/**
 * List all registered marketplaces and their installed plugins.
 */
export async function runList() {
  header('Registered marketplaces');

  const registries = await readRegistries();
  const names = Object.keys(registries);

  if (names.length === 0) {
    info('No marketplaces registered yet');
    info('Run: npx opencode-market add <owner/repo>');
    return;
  }

  for (const name of names) {
    const entry = registries[name];
    console.log();
    console.log(chalk.bold(name));
    info(`repo: ${entry.repo}`);
    info(`ref: ${entry.ref}`);
    info(`source: ${entry.source}`);

    const installed = entry.installed || [];
    if (installed.length === 0) {
      info('installed: (none)');
    } else {
      info(`installed: ${installed.join(', ')}`);
    }
  }
}
