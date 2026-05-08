import chalk from 'chalk'
import { fetchJsonFile } from '../utils/github.js'
import { setMarketplace } from '../utils/registry.js'
import { header, success, error, info } from '../utils/exec.js'

const MARKETPLACE_PATHS = [
  '.claude-plugin/marketplace.json',
  '.github/plugin/marketplace.json',
  'marketplace.json',
];

/**
 * Add a marketplace from a GitHub repo.
 * @param {string} ownerRepo - "owner/repo" format
 */
export async function runAdd(ownerRepo) {
  header('Adding marketplace');

  const parts = ownerRepo.split('/');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    error(`Invalid repo format: ${ownerRepo}. Expected owner/repo`);
    return;
  }

  const [owner, repo] = parts;
  const ref = 'main';

  info(`Searching for marketplace.json in ${ownerRepo}...`);

  let marketplace = null;
  let sourcePath = null;

  for (const candidate of MARKETPLACE_PATHS) {
    try {
      const data = await fetchJsonFile(owner, repo, ref, candidate);
      if (data && data.name) {
        marketplace = data;
        sourcePath = candidate;
        break;
      }
    } catch {
      // try next path
    }
  }

  if (!marketplace) {
    error(`Could not find marketplace.json in ${ownerRepo}`);
    info('Tried paths:');
    for (const p of MARKETPLACE_PATHS) info(`  ${p}`);
    return;
  }

  info(`Found at ${sourcePath}`);

  await setMarketplace(marketplace.name, {
    repo: ownerRepo,
    ref,
    source: sourcePath,
    installed: [],
  });

  success(`Registered marketplace: ${chalk.bold(marketplace.name)}`);

  if (marketplace.plugins?.length) {
    info(`Available plugins:`);
    for (const plugin of marketplace.plugins) {
      info(`  ${plugin.name} v${plugin.version} — ${plugin.description || ''}`);
    }
  }
}
