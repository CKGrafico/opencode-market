# opencode-market

CLI to discover, install, and manage opencode agent plugins from GitHub marketplaces.

## Usage

```bash
npx opencode-market add <owner/repo>
npx opencode-market install <plugin>@<marketplace> [--local] [--opencode]
npx opencode-market update <marketplace> [--local] [--opencode]
npx opencode-market list
```

## Commands

### `add <owner/repo>`

Register a marketplace from a GitHub repo. Searches for `marketplace.json` in:
1. `.claude-plugin/marketplace.json`
2. `.github/plugin/marketplace.json`
3. `marketplace.json` (root)

### `install <plugin>@<marketplace>`

Install a plugin from a registered marketplace. By default installs globally to `~/.agents/`.

```bash
# Global (default) — available to all projects
npx opencode-market install proposals@plainpresales

# Project-local — installs to ./.agents/
npx opencode-market install proposals@plainpresales --local

# OpenCode project folder — installs to ./.opencode/
npx opencode-market install proposals@plainpresales --opencode
```

### `update <marketplace>`

Re-fetch the marketplace definition and re-download all installed plugins. Accepts the same `--local` and `--opencode` flags as `install`.

### `list`

Print all registered marketplaces and their installed plugins.

## Install destinations

| Flag | Agents | Skills |
|------|--------|--------|
| *(default)* | `~/.agents/agents/` | `~/.agents/skills/` |
| `--local` | `./.agents/agents/` | `./.agents/skills/` |
| `--opencode` | `./.opencode/agents/` | `./.opencode/skills/` |

## Authentication

For private repos, set `GITHUB_TOKEN` env var or have `gh` CLI authenticated.

## License

MIT
