import chalk from 'chalk'
import { appendLine, redraw, rotateStep, startSpinner, stopSpinner } from './exec-spinner.js'

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Print a section header, clears screen, shows previous step dimmed, starts new step.
 */
export function header(text) {
  rotateStep();

  const line1 = '';
  const line2 = chalk.bold.hex('#fe3d57')(`━━ ${text}`);
  const line3 = '';

  appendLine(line1);
  appendLine(line2);
  appendLine(line3);

  redraw();

  startSpinner('working...');
}

/**
 * Print a success line.
 */
export function success(text) {
  stopSpinner();
  const line = chalk.green('✓ ') + text;
  appendLine(line);
  console.log(line);
}

/**
 * Print a warning line.
 */
export function warn(text) {
  stopSpinner();
  const line = chalk.yellow('⚠ ') + text;
  appendLine(line);
  console.log(line);
}

/**
 * Print an error line.
 */
export function error(text) {
  stopSpinner();
  const line = chalk.red('✗ ') + text;
  appendLine(line);
  console.log(line);
}

/**
 * Print an info line.
 */
export function info(text) {
  stopSpinner();
  const line = chalk.dim('  ' + text);
  appendLine(line);
  console.log(line);
}
