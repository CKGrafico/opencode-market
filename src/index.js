#!/usr/bin/env node
import chalk from 'chalk'
import { createRequire } from 'node:module'
import { runAdd } from './commands/add.js'
import { runInstall } from './commands/install.js'
import { runUpdate } from './commands/update.js'
import { runList } from './commands/list.js'

function printHelp(version) {
  console.log(`opencode-market v${version}`);
  console.log();
  console.log('Usage:');
  console.log('  npx opencode-market <command> [args]');
  console.log();
  console.log('Commands:');
  console.log('  add <owner/repo>          Register a marketplace from a GitHub repo');
  console.log('  install <plugin>@<market>  Install a plugin from a registered marketplace');
  console.log('  update <marketplace>       Re-fetch and update all installed plugins');
  console.log('  list                       List registered marketplaces and installed plugins');
  console.log();
  console.log('Options:');
  console.log('  -h, --help                Show this help message');
}

const require = createRequire(import.meta.url);
const { version } = require('../package.json');
const args = process.argv.slice(2);

if (args.includes('-h') || args.includes('--help') || args.length === 0) {
  printHelp(version);
  process.exit(0);
}

const command = args[0];
const arg = args[1];

try {
  switch (command) {
    case 'add':
      if (!arg) {
        console.log(chalk.red('Missing argument: owner/repo'));
        console.log('Usage: npx opencode-market add <owner/repo>');
        process.exit(1);
      }
      await runAdd(arg);
      break;

    case 'install':
      if (!arg) {
        console.log(chalk.red('Missing argument: plugin@marketplace'));
        console.log('Usage: npx opencode-market install <plugin>@<marketplace>');
        process.exit(1);
      }
      await runInstall(arg);
      break;

    case 'update':
      if (!arg) {
        console.log(chalk.red('Missing argument: marketplace name'));
        console.log('Usage: npx opencode-market update <marketplace>');
        process.exit(1);
      }
      await runUpdate(arg);
      break;

    case 'list':
      await runList();
      break;

    default:
      console.log(chalk.red(`Unknown command: ${command}`));
      console.log();
      printHelp(version);
      process.exit(1);
  }
} catch (err) {
  if (err.name === 'ExitPromptError') {
    console.log();
    console.log(chalk.yellow('Cancelled.'));
  } else {
    console.error(chalk.red('\nUnexpected error:'), err.message);
    process.exit(1);
  }
}
