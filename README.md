# opencode-market

CLI to discover, install, and manage opencode agent plugins from GitHub marketplaces.

## Usage

```bash
npx opencode-market add <owner/repo>
npx opencode-market install <plugin>@<marketplace>
npx opencode-market update <marketplace>
npx opencode-market list
```

## Commands

### `add <owner/repo>`

Register a marketplace from a GitHub repo. Searches for `marketplace.json` in:
1. `.claude-plugin/marketplace.json`
2. `.github/plugin/marketplace.json`
3. `marketplace.json` (root)

### `install <plugin>@<marketplace>`

Install a plugin from a registered marketplace. Downloads agents and skills into `.agents/agents/` and `.agents/skills/` in the current directory.

### `update <marketplace>`

Re-fetch the marketplace definition and re-download all installed plugins.

### `list`

Print all registered marketplaces and their installed plugins.

## Authentication

For private repos, set `GITHUB_TOKEN` env var or have `gh` CLI authenticated.

## License

MIT
