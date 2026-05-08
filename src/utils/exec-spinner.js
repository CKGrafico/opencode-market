import chalk from 'chalk'
import ora from 'ora'

// ── Screen / step state ──────────────────────────────────────────────────────

const previousSteps = [];
let currentStepLines = [];
let stepSpinner = null;

export function appendLine(line) {
  currentStepLines.push(line);
}

export function stopSpinner() {
  if (stepSpinner) {
    stepSpinner.stop();
    stepSpinner = null;
  }
}

export function startSpinner(text = 'working...') {
  stopSpinner();
  stepSpinner = ora({ text: chalk.dim(text), color: 'red' }).start();
}

export function redraw() {
  if (process.stdout.isTTY) console.clear();

  for (const stepLines of previousSteps) {
    for (const line of stepLines) {
      process.stdout.write(chalk.dim(line) + '\n');
    }
    process.stdout.write('\n');
  }

  for (const line of currentStepLines) {
    process.stdout.write(line + '\n');
  }
}

export function rotateStep() {
  previousSteps.push(currentStepLines);
  if (previousSteps.length > 2) previousSteps.shift();
  currentStepLines = [];
}
