import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

function getStagedFiles() {
  if (!existsSync(".git")) {
    return [];
  }

  const raw = execSync("git diff --cached --name-only --diff-filter=ACMR", {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();

  if (!raw) {
    return [];
  }

  return raw
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

function isSourceFile(file) {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file);
}

function isBackendOrTestsFile(file) {
  return (
    file.startsWith("src/") ||
    file.startsWith("tests/") ||
    file.startsWith("scripts/")
  );
}

function run() {
  const stagedFiles = getStagedFiles();
  const relatedFiles = stagedFiles
    .filter(isSourceFile)
    .filter(isBackendOrTestsFile);

  if (relatedFiles.length === 0) {
    console.log("test:changed: no staged backend/test source files. Skipping.");
    return;
  }

  const escapedArgs = relatedFiles.map((file) => `"${file}"`).join(" ");
  const cmd = `npx vitest related --run --passWithNoTests ${escapedArgs}`;

  console.log(`test:changed: running related tests for ${relatedFiles.length} file(s).`);
  execSync(cmd, { stdio: "inherit" });
}

run();
