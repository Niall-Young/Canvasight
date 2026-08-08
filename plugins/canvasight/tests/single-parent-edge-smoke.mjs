#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const pluginRoot = path.resolve(import.meta.dirname, "..");
const appPath = path.join(pluginRoot, "src", "App.tsx");
const appSource = fs.readFileSync(appPath, "utf8");
const sourceFile = ts.createSourceFile(appPath, appSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const graphPath = path.join(pluginRoot, "src", "domain", "canvasGraph.ts");
const graphSource = fs.readFileSync(graphPath, "utf8");
const graphFile = ts.createSourceFile(graphPath, graphSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const functionNode = graphFile.statements.find(
  (statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === "isConnectionAllowed"
);

assert.ok(functionNode, "the graph domain module must define the shared manual-connection rule");

const compiled = ts.transpileModule(`export ${functionNode.getText(graphFile)}`, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  fileName: "connection-rule.ts"
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module }, { filename: "connection-rule.cjs" });
const { isConnectionAllowed } = module.exports;

const nodes = [
  { id: "parent-a", type: "task" },
  { id: "parent-b", type: "task" },
  { id: "child", type: "asset" }
];
const existingEdges = [{ id: "a-child", source: "parent-a", target: "child" }];

assert.equal(
  isConnectionAllowed({ source: "parent-b", target: "child" }, existingEdges, nodes),
  false,
  "a connected Task/Asset target must reject a second parent"
);
assert.equal(
  isConnectionAllowed({ source: "parent-a", target: "child" }, existingEdges, nodes),
  false,
  "the same directed Edge must remain invalid"
);
assert.equal(
  isConnectionAllowed({ source: "parent-a", target: "parent-b" }, existingEdges, nodes),
  true,
  "a Task/Asset root may accept its first incoming Edge"
);
assert.equal(
  isConnectionAllowed({ source: "parent-a", target: "parent-b" }, [], [...nodes, { id: "group", type: "group" }]),
  true,
  "unrelated Groups do not block valid Task/Asset connections"
);
assert.equal(
  isConnectionAllowed({ source: "group", target: "parent-b" }, [], [...nodes, { id: "group", type: "group" }]),
  false,
  "Groups cannot be Edge endpoints"
);

assert.match(appSource, /persistentChanges\.forEach\(\(change\) => \{/u, "onEdgesChange must validate batched changes one by one");
assert.match(appSource, /applyEdgeChanges\(\[change\], candidateEdges\)/u, "batched Edge validation must use the incrementally accepted graph");

let handleConnectStartNode = null;
function visit(node) {
  if (
    ts.isVariableDeclaration(node)
    && ts.isIdentifier(node.name)
    && node.name.text === "handleConnectStart"
  ) {
    handleConnectStartNode = node;
    return;
  }
  ts.forEachChild(node, visit);
}
visit(sourceFile);
assert.ok(handleConnectStartNode?.initializer, "App must define handleConnectStart");
const handleConnectStartSource = handleConnectStartNode.initializer.getText(sourceFile);
assert.doesNotMatch(handleConnectStartSource, /setSelectedNodeId/u, "starting a connection must not change selection before validation succeeds");
assert.doesNotMatch(handleConnectStartSource, /replaceCanvasLive/u, "starting a connection must not mutate selected node flags");

for (const componentName of ["TaskNode", "AssetNode"]) {
  const componentPath = path.join(pluginRoot, "src", "components", `${componentName}.tsx`);
  const componentSource = fs.readFileSync(componentPath, "utf8");
  assert.match(
    componentSource,
    /type="target"[\s\S]*?position=\{Position\.Left\}[\s\S]*?isConnectable=\{!hasParent\}[\s\S]*?isConnectableStart=\{!hasParent\}[\s\S]*?isConnectableEnd=\{!hasParent\}/u,
    `${componentName} must make its occupied target Handle non-connectable`
  );
  assert.match(
    componentSource,
    /\{!hasParent \? \(/u,
    `${componentName} must hide its add-parent button while an incoming Edge exists`
  );
  assert.match(
    componentSource,
    /<Handle type="source" position=\{Position\.Right\} className="node-handle">/u,
    `${componentName} source Handle must remain connectable`
  );
}

const storePath = path.join(pluginRoot, "src", "store", "scatterStore.ts");
const storeSource = fs.readFileSync(storePath, "utf8");
const storeFile = ts.createSourceFile(storePath, storeSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const storeFunctions = storeFile.statements.filter(
  (statement) => ts.isFunctionDeclaration(statement) && ["incomingEdgeCounts", "canApplyEdgeMutation"].includes(statement.name?.text)
);
assert.equal(storeFunctions.length, 2, "store must define the Edge mutation backstop");
const compiledStore = ts.transpileModule(
  `${storeFunctions.map((statement) => statement.getText(storeFile)).join("\n")}\nmodule.exports = { canApplyEdgeMutation };`,
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, fileName: "store-edge-rule.ts" }
).outputText;
const storeModule = { exports: {} };
vm.runInNewContext(compiledStore, { exports: storeModule.exports, module: storeModule }, { filename: "store-edge-rule.cjs" });
const { canApplyEdgeMutation } = storeModule.exports;
assert.equal(
  canApplyEdgeMutation(existingEdges, [...existingEdges, { id: "b-child", source: "parent-b", target: "child" }], nodes),
  false,
  "store backstop rejects a second parent"
);
const legacyEdges = [...existingEdges, { id: "b-child", source: "parent-b", target: "child" }];
assert.equal(canApplyEdgeMutation(legacyEdges, legacyEdges, nodes), true, "legacy dirty Edges remain loadable and editable");
assert.equal(canApplyEdgeMutation(legacyEdges, existingEdges, nodes), true, "legacy dirty Edges can be repaired");
assert.equal(
  canApplyEdgeMutation(legacyEdges, [...legacyEdges, { id: "third-child", source: "third", target: "child" }], nodes),
  false,
  "legacy dirty cardinality cannot increase"
);

console.log("Single-parent Edge smoke test passed");
