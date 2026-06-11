import { spawn } from "node:child_process";

const sourceRoot = process.env.READING_SOURCE_ROOT;

if (!sourceRoot) {
  throw new Error("READING_SOURCE_ROOT is required");
}

const steps = [
  {
    label: "Import reading articles and split sentences",
    command: "node",
    args: ["scripts/import-reading-articles.mjs"],
    env: { READING_SOURCE_ROOT: sourceRoot },
  },
  {
    label: "Generate missing sentence translations",
    command: "node",
    args: ["scripts/translate-article-sentences.mjs"],
  },
  {
    label: "Validate article translations",
    command: "node",
    args: ["scripts/validate-article-translations.mjs"],
  },
];

function runStep(step) {
  return new Promise((resolve, reject) => {
    console.log(`\n== ${step.label} ==`);

    const child = spawn(step.command, step.args, {
      cwd: new URL("..", import.meta.url),
      env: {
        ...process.env,
        ...(step.env || {}),
      },
      stdio: "inherit",
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${step.label} failed with exit code ${code}`));
      }
    });
  });
}

for (const step of steps) {
  await runStep(step);
}

console.log("\nReading content is ready for offline use.");
