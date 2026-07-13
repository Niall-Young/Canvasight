import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(pluginRoot, "mcp", "server.source.mjs");
const outputPath = path.join(pluginRoot, "mcp", "server.mjs");
const checkOnly = process.argv.includes("--check");

const result = await build({
  entryPoints: [sourcePath],
  outfile: outputPath,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  // Escaped string output keeps generated dependency templates free of physical
  // trailing whitespace while preserving their runtime contents.
  supported: { "template-literal": false },
  packages: "bundle",
  banner: {
    js: "// Generated from mcp/server.source.mjs by npm run build:mcp. Do not edit directly."
  },
  legalComments: "none",
  charset: "utf8",
  sourcemap: false,
  write: false,
  logLevel: "silent"
});

const output = result.outputFiles.find((file) => path.resolve(file.path) === outputPath);
if (!output) {
  throw new Error(`esbuild did not produce ${outputPath}`);
}

if (checkOnly) {
  let committed;
  try {
    committed = await fs.readFile(outputPath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      process.stderr.write("mcp/server.mjs is missing; run npm run build:mcp\n");
      process.exitCode = 1;
      process.exit();
    }
    throw error;
  }

  if (!committed.equals(output.contents)) {
    process.stderr.write("mcp/server.mjs is stale; run npm run build:mcp and commit the result\n");
    process.exitCode = 1;
    process.exit();
  }

  process.stdout.write(`MCP bundle is current (${output.contents.byteLength} bytes)\n`);
} else {
  await fs.writeFile(outputPath, output.contents);
  process.stdout.write(`Built mcp/server.mjs (${output.contents.byteLength} bytes)\n`);
}
