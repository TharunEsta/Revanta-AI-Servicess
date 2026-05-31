const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

async function main() {
  const seedPath = path.resolve(__dirname, "seed.ts");
  const source = fs.readFileSync(seedPath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Node16,
      resolveJsonModule: true
    },
    fileName: seedPath
  });

  const seedModule = new Module(seedPath, module.parent);
  seedModule.filename = seedPath;
  seedModule.paths = Module._nodeModulePaths(path.dirname(seedPath));
  seedModule._compile(compiled.outputText, seedPath);

  const exported = seedModule.exports;
  const seed = exported.default || exported;
  if (typeof seed !== "function") {
    throw new Error("Seed file did not export a default function.");
  }

  await seed();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
