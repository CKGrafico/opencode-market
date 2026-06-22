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
  // Normalise: root plugin has pluginSource '' or '.' — both mean no prefix
  const prefix = (!pluginSource || pluginSource === '.') ? '' : pluginSource.replace(/\/+$/, '') + '/';

  if (pluginJson.agents) {
    const agentsPath = normalizePath(`${prefix}${pluginJson.agents}`);
    await downloadFolder(owner, repo, ref, agentsPath, path.join(base, 'agents'));
  }

  if (pluginJson.skills) {
    const skillsPath = normalizePath(`${prefix}${pluginJson.skills}`);
    await downloadFolder(owner, repo, ref, skillsPath, path.join(base, 'skills'));
  }

  info(`Installed to: ${base}`);
}

/**
 * Download all files from a GitHub directory into a local destination,
 * preserving the directory structure relative to the source folder.
 */
function normalizePath(p) {
  return p.replace(/\/+/g, '/').replace(/\/\.\//g, '/').replace(/\/\.$/, '').replace(/^\//, '');
}

function getAlternatePath(remotePath) {
  const normalized = remotePath.replace(/\/+$/, '');
  const lastSegment = normalized.split('/').pop();
  if (lastSegment.startsWith('.')) {
    return normalized.replace(new RegExp(`\\.${escapeRegExp(lastSegment.slice(1))}$`), lastSegment.slice(1));
  }
  return normalized.replace(new RegExp(`${escapeRegExp(lastSegment)}$`), '.' + lastSegment);
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function downloadFolder(owner, repo, ref, remotePath, localBase) {
  const normalizedRemote = remotePath.replace(/\/+$/, '');
  let items = await listGitHubDirectory(owner, repo, ref, normalizedRemote);
  let blobs = items.filter(i => i.type === 'blob');

  if (blobs.length === 0) {
    const alternate = getAlternatePath(normalizedRemote);
    if (alternate !== normalizedRemote) {
      info(`No files found in ${normalizedRemote}, trying ${alternate}...`);
      items = await listGitHubDirectory(owner, repo, ref, alternate);
      blobs = items.filter(i => i.type === 'blob');
      if (blobs.length > 0) {
        return downloadToDisk(owner, repo, ref, alternate, blobs, localBase);
      }
    }
    info(`No files found in ${normalizedRemote}`);
    return;
  }

  return downloadToDisk(owner, repo, ref, normalizedRemote, blobs, localBase);
}

async function downloadToDisk(owner, repo, ref, normalizedRemote, blobs, localBase) {

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
 * The plugin source field is resolved from the repo root first.
 * If not found, falls back to resolving relative to the marketplace.json directory.
 * @param {string} owner
 * @param {string} repo
 * @param {string} ref
 * @param {string} marketplaceSource - the source path from marketplace.json (e.g. ".github/plugin/marketplace.json")
 * @param {string} pluginSourceRelative - the plugin's source field (e.g. "./")
 * @returns {Promise<{pluginJson: object, pluginBasePath: string}|null>}
 */
export async function fetchPluginJson(owner, repo, ref, marketplaceSource, pluginSourceRelative) {
  // Normalise source: strip leading "./" so path.posix.join works cleanly
  const normalised = pluginSourceRelative.replace(/^\.\//, '').replace(/\/+$/, '') || '.';

  // 1. Try repo-root relative (canonical: source: "./" means root)
  const rootDir = normalised === '.' ? '' : normalised;
  const rootPluginJsonPath = rootDir ? `${rootDir}/plugin.json` : 'plugin.json';
  const rootResult = await fetchJsonFile(owner, repo, ref, rootPluginJsonPath);
  if (rootResult) {
    return { pluginJson: rootResult, pluginBasePath: rootDir };
  }

  // 2. Fallback: resolve relative to the directory containing marketplace.json
  const marketplaceDir = path.posix.dirname(marketplaceSource);
  const relDir = path.posix.join(marketplaceDir, normalised).replace(/\/+$/, '');
  const relPluginJsonPath = `${relDir}/plugin.json`;
  const relResult = await fetchJsonFile(owner, repo, ref, relPluginJsonPath);
  if (relResult) {
    return { pluginJson: relResult, pluginBasePath: relDir };
  }

  return null;
}
