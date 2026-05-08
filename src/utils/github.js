import { execa } from 'execa'

/**
 * Get a GitHub auth token.
 * Checks GITHUB_TOKEN env var first, then falls back to `gh auth token`.
 * Returns null if neither is available (public repos work without auth).
 */
async function getToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;

  try {
    const result = await execa('gh', ['auth', 'token'], { reject: false });
    if (result.exitCode === 0 && result.stdout.trim()) return result.stdout.trim();
  } catch {
    // gh not installed or not authenticated
  }

  return null;
}

/**
 * Fetch a file from GitHub raw content API.
 * @param {string} owner - repo owner
 * @param {string} repo - repo name
 * @param {string} ref - branch or tag (e.g. "main")
 * @param {string} filePath - path within the repo
 * @returns {Promise<string|null>} file contents or null if not found
 */
export async function fetchRawFile(owner, repo, ref, filePath) {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${filePath}`;
  const token = await getToken();

  const headers = {};
  if (token) headers.Authorization = `token ${token}`;

  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  return res.text();
}

/**
 * Fetch and parse a JSON file from GitHub.
 * @returns {Promise<object|null>}
 */
export async function fetchJsonFile(owner, repo, ref, filePath) {
  const text = await fetchRawFile(owner, repo, ref, filePath);
  if (text == null) return null;
  return JSON.parse(text);
}

/**
 * List files in a GitHub directory using the Trees API.
 * Returns an array of { path, type } relative to the directory.
 * @param {string} owner
 * @param {string} repo
 * @param {string} ref
 * @param {string} dirPath - directory path within the repo (no trailing slash)
 * @returns {Promise<Array<{path: string, type: string}>>}
 */
export async function listGitHubDirectory(owner, repo, ref, dirPath) {
  const token = await getToken();
  const headers = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `token ${token}`;

  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

  const data = await res.json();
  const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;

  return data.tree
    .filter(item => item.path.startsWith(prefix))
    .map(item => ({
      path: item.path,
      type: item.type, // "blob" or "tree"
    }));
}
