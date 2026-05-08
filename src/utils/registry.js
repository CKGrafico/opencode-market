import fse from 'fs-extra'
import os from 'os'
import path from 'path'

const REGISTRY_DIR = path.join(os.homedir(), '.opencode-market');
const REGISTRY_FILE = path.join(REGISTRY_DIR, 'registries.json');

/**
 * Read the full registries.json state.
 * @returns {Promise<object>}
 */
export async function readRegistries() {
  try {
    if (!await fse.pathExists(REGISTRY_FILE)) return {};
    return await fse.readJson(REGISTRY_FILE);
  } catch {
    return {};
  }
}

/**
 * Write the full registries.json state.
 * @param {object} data
 */
export async function writeRegistries(data) {
  await fse.ensureDir(REGISTRY_DIR);
  await fse.writeJson(REGISTRY_FILE, data, { spaces: 2 });
}

/**
 * Register or update a marketplace entry.
 * @param {string} name - marketplace name key
 * @param {object} entry - { repo, ref, source, installed? }
 */
export async function setMarketplace(name, entry) {
  const registries = await readRegistries();
  registries[name] = { ...registries[name], ...entry };
  await writeRegistries(registries);
}

/**
 * Get a single marketplace entry by name.
 * @param {string} name
 * @returns {Promise<object|null>}
 */
export async function getMarketplace(name) {
  const registries = await readRegistries();
  return registries[name] ?? null;
}

/**
 * Add a plugin name to a marketplace's installed list (deduplicated).
 * @param {string} marketplaceName
 * @param {string} pluginName
 */
export async function markInstalled(marketplaceName, pluginName) {
  const registries = await readRegistries();
  const entry = registries[marketplaceName];
  if (!entry) return;
  if (!Array.isArray(entry.installed)) entry.installed = [];
  if (!entry.installed.includes(pluginName)) entry.installed.push(pluginName);
  await writeRegistries(registries);
}
