import fse from 'fs-extra'
import os from 'os'
import path from 'path'
import { fetchJsonFile, fetchRawFile, listGitHubDirectory } from './github.js'
import { info, success } from './exec.js'

/**
 * Resolve the base directory for installing agents/skills.
 *
 * --opencode            →  <cwd>/.opencode/
 * --local               →  <cwd>/.agents/
 * (default, global)     →  ~/.agents/
 *
 * --opencode takes priority over --local when both are passed.
 *
 * @param {{ local?: boolean, opencode?: boolean }} options
 * @returns {string}
 */
export function resolveInstallBase(options = {}) {
  if (options.opencode) return path.join(process.cwd(), '.opencode');
  if (options.local) return path.join(process.cwd(), '.agents');
  return path.join(os.homedir(), '.agents');
}

/**
 * Install a plugin by downloading its agents and skills folders.
 * @param {string} owner - repo owner
 * @param {string} repo - repo name
 * @param {string} ref - branch or tag
 * @param {string} pluginSource - path prefix to the plugin within the repo (e.g. ".claude-plugin/")
 * @param {object} pluginJson - parsed plugin.json
 * @param {{ local?: boolean, opencode?: boolean }} options
 */
export async function installPlugin(owner, repo, ref, pluginSource, pluginJson, options = {}) {
  const base = resolveInstallBase(options);
  const basePath = pluginSource.endsWith('/') ? pluginSource : `${pluginSource}/`;

  if (pluginJson.agents) {
    const agentsPath = `${basePath}${pluginJson.agents}`.replace(/\/+/g, '/');
    await downloadFolder(owner, repo, ref, agentsPath, path.join(base, 'agents'));
  }

  if (pluginJson.skills) {
    const skillsPath = `${basePath}${pluginJson.skills}`.replace(/\/+/g, '/');
    await downloadFolder(owner, repo, ref, skillsPath, path.join(base, 'skills'));
  }

  info(`Installed to: ${base}`);
}

/**
 * Download all files from a GitHub directory into a local destination,
 * preserving the directory structure relative to the source folder.
 */
async function downloadFolder(owner, repo, ref, remotePath, localBase) {
  const normalizedRemote = remotePath.replace(/\/+$/, '');
  const items = await listGitHubDirectory(owner, repo, ref, normalizedRemote);
  const blobs = items.filter(i => i.type === 'blob');

  if (blobs.length === 0) {
    info(`No files found in ${normalizedRemote}`);
    return;
  }

  for (const blob of blobs) {
    const relativePath = blob.path.slice(normalizedRemote.length + 1);
    const localPath = path.join(localBase, relativePath);

    const content = await fetchRawFile(owner, repo, ref, blob.path);
    if (content == null) continue;

    await fse.ensureDir(path.dirname(localPath));
    await fse.writeFile(localPath, content, 'utf-8');
    info(relativePath);
  }

  success(`Downloaded ${blobs.length} file(s) from ${normalizedRemote}`);
}

/**
 * Resolve a plugin.json from its source path within the repo.
 * @param {string} owner
 * @param {string} repo
 * @param {string} ref
 * @param {string} marketplaceSource - the source path from marketplace.json (e.g. ".claude-plugin/marketplace.json")
 * @param {string} pluginSourceRelative - the plugin's source field (e.g. "./")
 * @returns {Promise<{pluginJson: object, pluginBasePath: string}|null>}
 */
export async function fetchPluginJson(owner, repo, ref, marketplaceSource, pluginSourceRelative) {
  // marketplaceSource is e.g. ".claude-plugin/marketplace.json"
  // plugin source is relative to the directory containing marketplace.json
  const marketplaceDir = path.posix.dirname(marketplaceSource);
  const pluginDir = path.posix.join(marketplaceDir, pluginSourceRelative).replace(/\/+$/, '');
  const pluginJsonPath = `${pluginDir}/plugin.json`.replace(/\/+/g, '/');

  const pluginJson = await fetchJsonFile(owner, repo, ref, pluginJsonPath);
  if (!pluginJson) return null;

  return { pluginJson, pluginBasePath: pluginDir };
}
