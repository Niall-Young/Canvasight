import { describe, expect, it } from "vitest";
import type { ProjectHistoryNode, ProjectHistoryResponse } from "../lib/canvasightApi";
import { buildFeatureIntegrationPrompt, buildProjectHistoryFeatureMap, checkpointChangeSummary, checkpointProjectFileCount, checkpointSourceSummary, currentProjectHistoryFocusNodeIds, displaySemanticHistorySummary, featureTitleFromBranch, isInternalHistoryNode, selectCurrentProjectHistoryFeature, type ProjectHistoryFeatureMapItem } from "./projectHistoryFeatureMap";
import { layoutProjectHistoryFeatureMap, layoutProjectHistorySearchResults } from "./projectHistoryFeatureLayout";

function node(id: string, branch: string, summary: string, path: string, time: string): ProjectHistoryNode {
  return {
    id,
    kind: "snapshot",
    summary,
    status: "protected",
    source: "codex",
    featureLineId: "feature:task",
    taskId: "task",
    turnId: id,
    snapshotRef: `refs/${id}`,
    commit: id.padEnd(40, "0"),
    tree: id.padEnd(40, "1"),
    gitBranch: branch,
    changedPaths: [{ status: "M", path }],
    coverage: { complete: true },
    occurredAt: time,
    confirmed: false,
    merged: false
  };
}

describe("Project History feature map", () => {
  it("focuses the newest actionable feature instead of the main project root", () => {
    const root = { id: "root", nodeId: "node-root", title: "Project", status: "integrated", projectRoot: true, occurredAt: "2026-08-12T09:00:00.000Z", dependencyId: null } as ProjectHistoryFeatureMapItem;
    const integrated = { id: "done", nodeId: "node-done", title: "Electron", status: "integrated", projectRoot: false, occurredAt: "2026-08-12T10:00:00.000Z", dependencyId: root.id } as ProjectHistoryFeatureMapItem;
    const current = { id: "current", nodeId: "node-current", title: "Distribution", status: "saved", projectRoot: false, branch: "feat/distribution", occurredAt: "2026-08-12T12:00:00.000Z", dependencyId: integrated.id } as ProjectHistoryFeatureMapItem;
    const items = [root, integrated, current];
    expect(selectCurrentProjectHistoryFeature(items, "main")?.id).toBe("current");
    expect(currentProjectHistoryFocusNodeIds(items, "main")).toEqual(["node-done", "node-current"]);
  });

  it("keeps active development ahead of a newer saved branch", () => {
    const active = { id: "active", nodeId: "node-active", status: "developing", projectRoot: false, branch: "feat/active", occurredAt: "2026-08-12T10:00:00.000Z" } as ProjectHistoryFeatureMapItem;
    const newer = { id: "newer", nodeId: "node-newer", status: "saved", projectRoot: false, branch: "feat/newer", occurredAt: "2026-08-12T12:00:00.000Z" } as ProjectHistoryFeatureMapItem;
    expect(selectCurrentProjectHistoryFeature([active, newer], "main")?.id).toBe("active");
  });

  it("focuses the project mainline when no feature still needs action", () => {
    const root = { id: "root", nodeId: "node-root", status: "integrated", projectRoot: true, occurredAt: "2026-08-12T09:00:00.000Z" } as ProjectHistoryFeatureMapItem;
    const completed = { id: "completed", nodeId: "node-completed", status: "integrated", projectRoot: false, occurredAt: "2026-08-12T12:00:00.000Z" } as ProjectHistoryFeatureMapItem;
    expect(selectCurrentProjectHistoryFeature([root, completed], "main")?.id).toBe("root");
    expect(currentProjectHistoryFocusNodeIds([root, completed], "main")).toEqual(["node-root"]);
  });

  it("explains checkpoint provenance without exposing task ids", () => {
    const fromWorkflow = node("workflow", "feat/search", "Add search", "src/search.ts", "2026-08-12T10:00:00.000Z");
    fromWorkflow.workflowNodeId = "node-opaque-id";
    fromWorkflow.workflowTitle = "离线搜索";
    expect(checkpointSourceSummary(fromWorkflow, "zh")).toBe("工作流：离线搜索");
    expect(checkpointSourceSummary(fromWorkflow, "en")).toBe("Workflow: 离线搜索");
    const external = node("external", "main", "External change", "src/app.ts", "2026-08-12T11:00:00.000Z");
    external.source = "external";
    external.taskId = "external-change";
    expect(checkpointSourceSummary(external, "zh")).toBe("项目外部修改");
  });

  it("removes conventional-commit syntax from user-facing outcomes", () => {
    expect(displaySemanticHistorySummary("fix(history): 加固原生宿主 Node 发现")).toBe("加固原生宿主 Node 发现");
    const checkpoint = node("semantic", "main", "feat: 说明版本记录来自哪个工作流", "src/history.ts", "2026-08-12T12:00:00.000Z");
    expect(checkpointChangeSummary(checkpoint, "zh")).toBe("说明版本记录来自哪个工作流");
  });

  it("lays filtered results on one compact readable row", () => {
    const items = ["a", "b", "c"].map((id, index) => ({ id, occurredAt: `2026-08-12T0${index + 1}:00:00.000Z`, status: index === 0 ? "integrated" : "saved" })) as unknown as ProjectHistoryFeatureMapItem[];
    const positions = layoutProjectHistorySearchResults(items);
    expect([...positions.values()].map((position) => position.y)).toEqual([100, 100, 100]);
    expect(positions.get("c")!.x - positions.get("a")!.x).toBe(1020);
  });

  it("reserves the first mainline position for the project start", () => {
    const integrated = { id: "done", status: "integrated", projectRoot: false, occurredAt: "2026-08-12T10:00:00.000Z", dependencyId: null } as ProjectHistoryFeatureMapItem;
    expect(layoutProjectHistoryFeatureMap([integrated], { includeProjectStart: true }).get("done")).toMatchObject({ x: 590, y: 100, path: "mainline" });
  });

  it("turns stacked Git branches into separate functional workstreams with a dependency", () => {
    const first = node("a", "feat/01-electron-foundation", "修改 2 个文件：main.ts", "apps/main.ts", "2026-08-12T09:00:00.000Z");
    const second = node("b", "feat/05-webdav-sync", "修改 1 个文件：webdav.ts", "apps/webdav.ts", "2026-08-12T10:00:00.000Z");
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: {
        nodes: [first, second],
        featureLines: [{ id: "feature:task", name: "Explore Canvasight capabilities", status: "active" }]
      },
      gitTopology: {
        currentBranch: "feat/05-webdav-sync",
        workingTree: { dirty: false },
        refs: [
          { kind: "local-branch", shortName: "feat/01-electron-foundation", commit: "1".repeat(40) },
          { kind: "local-branch", shortName: "feat/05-webdav-sync", commit: "2".repeat(40) }
        ],
        commits: [
          { id: "2".repeat(40), parents: ["1".repeat(40)], subject: "Add secure WebDAV workspace sync", isCanvasightGenerated: false, isOnMain: false },
          { id: "1".repeat(40), parents: ["0".repeat(40)], subject: "Build secure Electron desktop foundation", isCanvasightGenerated: false, isOnMain: false }
        ]
      }
    } as unknown as ProjectHistoryResponse;
    const result = buildProjectHistoryFeatureMap(response, "en");
    expect(result.map((item) => item.title)).toEqual(["Electron Foundation", "WebDAV Sync"]);
    expect(result[0].outcome).toBe("Build secure Electron desktop foundation");
    expect(result[1]).toMatchObject({ outcome: "Add secure WebDAV workspace sync", dependencyId: result[0].id, dependencyTitle: "Electron Foundation" });
  });

  it("keeps Canvasight metadata out of the functional map", () => {
    const internal = node("internal", "main", "修改 2 个文件", ".scatter/scatter.json", "2026-08-12T09:00:00.000Z");
    expect(isInternalHistoryNode(internal)).toBe(true);
    expect(buildProjectHistoryFeatureMap({ status: "ready", enabled: true, index: { nodes: [internal], featureLines: [] } } as unknown as ProjectHistoryResponse)).toEqual([]);
  });

  it("does not repeat a feature as a project node after the same commit reaches main", () => {
    const feature = node("feature", "feat/05-webdav-sync", "Recover interrupted synchronized bundle applies", "packages/sync/src/webdav.ts", "2026-08-12T10:00:00.000Z");
    feature.headCommit = "5".repeat(40);
    feature.featureLineId = "feature:webdav";
    const main = node("main-copy", "main", "Recover interrupted synchronized bundle applies", "packages/sync/src/webdav.ts", "2026-08-12T11:00:00.000Z");
    main.headCommit = "5".repeat(40);
    main.featureLineId = "feature:external";
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: {
        nodes: [feature, main],
        featureLines: [
          { id: "feature:webdav", name: "WebDAV Sync", status: "active" },
          { id: "feature:external", name: "外部变化", status: "active" }
        ]
      },
      gitTopology: {
        currentBranch: "main",
        workingTree: { dirty: false },
        refs: [
          { kind: "local-branch", shortName: "main", commit: "5".repeat(40) },
          { kind: "local-branch", shortName: "feat/05-webdav-sync", commit: "5".repeat(40) }
        ],
        commits: [{ id: "5".repeat(40), parents: ["4".repeat(40)], subject: "Recover interrupted synchronized bundle applies", isCanvasightGenerated: false, isOnMain: true }]
      }
    } as unknown as ProjectHistoryResponse;
    const result = buildProjectHistoryFeatureMap(response, "en");
    expect(result.map((item) => item.title)).toEqual(["WebDAV Sync"]);
    expect(result[0].status).toBe("integrated");
  });

  it("describes direct main development as project progress instead of a feature named Main", () => {
    const source = node("source", "main", "修改 3 个文件", "plugins/canvasight/src/domain/canvasGraph.ts", "2026-08-13T08:50:00.000Z");
    source.changedPaths.push({ status: "M", path: "plugins/canvasight/src/domain/canvasGraph.test.ts" });
    source.headCommit = "8".repeat(40);
    source.featureLineId = "feature:external";
    const generated = node("generated", "main", "fix: extend existing groups without empty duplicates", "plugins/canvasight/dist/assets/index.js", "2026-08-13T08:57:00.000Z");
    generated.headCommit = "9".repeat(40);
    generated.featureLineId = "feature:external";
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: { nodes: [source, generated], featureLines: [{ id: "feature:external", name: "外部变化", status: "active" }] },
      gitTopology: {
        currentBranch: "main",
        workingTree: { dirty: false },
        refs: [{ kind: "local-branch", shortName: "main", commit: "9".repeat(40) }],
        commits: [
          { id: "9".repeat(40), parents: ["8".repeat(40)], subject: generated.summary, isCanvasightGenerated: false, isOnMain: true },
          { id: "8".repeat(40), parents: [], subject: "work in progress", isCanvasightGenerated: false, isOnMain: true }
        ]
      }
    } as unknown as ProjectHistoryResponse;

    expect(buildProjectHistoryFeatureMap(response, "zh")[0]).toMatchObject({
      title: "项目主线",
      outcome: "最近完成：完善分组和画布操作、自动测试",
      projectRoot: true,
      status: "integrated"
    });
  });

  it("humanizes common branch names for ordinary users", () => {
    expect(featureTitleFromBranch("feat/05-webdav-sync")).toBe("WebDAV Sync");
    expect(featureTitleFromBranch("feature/01-electron-foundation")).toBe("Electron Foundation");
    expect(featureTitleFromBranch("codex/canvasight-usable-mvp", "zh")).toBe("Canvasight 可用 MVP");
    expect(featureTitleFromBranch("feat/04-finance-ledger", "zh")).toBe("财务账本");
    expect(featureTitleFromBranch("feat/07-distribution-hardening", "zh")).toBe("发布加固");
    expect(featureTitleFromBranch("feat/02-favorite-notes", "zh")).toBe("收藏笔记");
  });

  it("describes an English-coded branch as a Chinese feature outcome", () => {
    const checkpoint = node("sync", "feat/05-webdav-sync", "Add secure WebDAV workspace sync", "packages/sync/src/webdav.ts", "2026-08-12T10:00:00.000Z");
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: { nodes: [checkpoint], featureLines: [] },
      gitTopology: {
        currentBranch: "feat/05-webdav-sync",
        workingTree: { dirty: false },
        refs: [{ kind: "local-branch", shortName: "feat/05-webdav-sync", commit: "5".repeat(40) }],
        commits: [{ id: "5".repeat(40), parents: [], subject: "Add secure WebDAV workspace sync", isCanvasightGenerated: false, isOnMain: false }]
      }
    } as unknown as ProjectHistoryResponse;
    expect(buildProjectHistoryFeatureMap(response, "zh")[0]).toMatchObject({
      title: "WebDAV 同步",
      outcome: "已实现 WebDAV 同步"
    });
  });

  it("describes a fileless merge checkpoint as a feature result", () => {
    const checkpoint = node("release", "feat/07-distribution-hardening", "Merge hardened feature stack into distribution", "placeholder", "2026-08-12T11:00:00.000Z");
    checkpoint.changedPaths = [];
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: { nodes: [checkpoint], featureLines: [] },
      gitTopology: {
        currentBranch: "feat/07-distribution-hardening",
        workingTree: { dirty: false },
        refs: [{ kind: "local-branch", shortName: "feat/07-distribution-hardening", commit: "7".repeat(40) }],
        commits: [{ id: "7".repeat(40), parents: [], subject: "Merge hardened feature stack into distribution", isCanvasightGenerated: false, isOnMain: false }]
      }
    } as unknown as ProjectHistoryResponse;
    expect(buildProjectHistoryFeatureMap(response, "zh")[0]).toMatchObject({
      title: "发布加固",
      outcome: "完成发布加固阶段整合"
    });
  });

  it("summarizes the whole feature instead of only its final checkpoint", () => {
    const capability = node("ai-capability", "feat/06-ai-copilot", "修改 1 个文件", "packages/ai/src/provider.ts", "2026-08-12T10:00:00.000Z");
    const verification = node("ai-test", "feat/06-ai-copilot", "修改 1 个文件", "apps/desktop/tests/ai.test.ts", "2026-08-12T11:00:00.000Z");
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: { nodes: [capability, verification], featureLines: [] }
    } as unknown as ProjectHistoryResponse;
    expect(buildProjectHistoryFeatureMap(response, "zh")[0]).toMatchObject({
      title: "AI 助手",
      outcome: "已实现 AI 助手"
    });
  });

  it("keeps the user-facing capability ahead of later test and documentation checkpoints", () => {
    const capability = node("favorite-capability", "feat/02-favorite-notes", "Add favorite notes filter", "app.js", "2026-08-13T06:00:00.000Z");
    const verification = node("favorite-verification", "feat/02-favorite-notes", "Verify favorite notes behavior", "app.test.js", "2026-08-13T06:05:00.000Z");
    verification.changedPaths.push({ status: "M", path: "README.md" });
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: { nodes: [capability, verification], featureLines: [] }
    } as unknown as ProjectHistoryResponse;
    expect(buildProjectHistoryFeatureMap(response, "zh")[0]).toMatchObject({
      title: "收藏笔记",
      outcome: "已实现收藏笔记"
    });
  });

  it("describes verification-only progress without pretending it added another feature", () => {
    const verification = node("favorite-verification", "feat/02-favorite-notes", "Verify favorite notes behavior", "app.test.js", "2026-08-13T06:05:00.000Z");
    verification.changedPaths.push({ status: "M", path: "README.md" });
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: { nodes: [verification], featureLines: [] }
    } as unknown as ProjectHistoryResponse;
    expect(buildProjectHistoryFeatureMap(response, "zh")[0].outcome).toBe("完善收藏笔记的自动测试、使用说明");
  });

  it("does not count the project start or the same saved state as feature checkpoints", () => {
    const projectStart = node("start", "main", "项目保护起点", "README.md", "2026-08-12T09:00:00.000Z");
    projectStart.kind = "baseline";
    projectStart.tree = "1".repeat(40);
    projectStart.headCommit = "1".repeat(40);
    const inherited = node("inherited", "feat/01-offline-search", "Create project", "README.md", "2026-08-12T09:01:00.000Z");
    inherited.tree = projectStart.tree;
    inherited.headCommit = projectStart.headCommit;
    const commit = node("commit", "feat/01-offline-search", "Add offline search", "src/search.js", "2026-08-12T10:00:00.000Z");
    commit.tree = "2".repeat(40);
    commit.headCommit = "2".repeat(40);
    const sameState = node("snapshot", "feat/01-offline-search", "Add offline search", "placeholder", "2026-08-12T10:01:00.000Z");
    sameState.changedPaths = [];
    sameState.tree = commit.tree;
    sameState.headCommit = commit.headCommit;
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: { nodes: [inherited, projectStart, commit, sameState], featureLines: [] }
    } as unknown as ProjectHistoryResponse;
    expect(buildProjectHistoryFeatureMap(response, "zh")[0]).toMatchObject({
      title: "离线搜索",
      checkpointCount: 1,
      outcome: "已实现离线搜索"
    });
  });

  it("explains technical auto checkpoints in ordinary-user language", () => {
    const checkpoint = node("desktop", "feat/01-electron-foundation", "修改 等 6 个文件：.github/workflows/desktop-package.yml、README.md", ".github/workflows/desktop-package.yml", "2026-08-12T09:50:00.000Z");
    checkpoint.changedPaths = [
      { status: "A", path: ".github/workflows/desktop-package.yml" },
      { status: "M", path: "README.md" },
      { status: "M", path: "apps/desktop/forge.config.ts" },
      { status: "M", path: "apps/desktop/src/main.ts" },
      { status: "M", path: "apps/desktop/tests/security.test.mjs" },
      { status: "M", path: ".scatter/scatter.json" }
    ];
    expect(checkpointChangeSummary(checkpoint, "zh")).toBe("完善 Electron 桌面端、安全防护、自动打包流程");
    expect(checkpointProjectFileCount(checkpoint)).toBe(5);
  });

  it("turns a desktop planning checkpoint into a Chinese outcome", () => {
    const checkpoint = node("plan", "feat/01-electron-foundation", "Plan Electron desktop feature branches", "docs/desktop-development-plan.md", "2026-08-12T09:26:00.000Z");
    expect(checkpointChangeSummary(checkpoint, "zh")).toBe("整理 Electron 桌面端开发规划");
    expect(checkpointChangeSummary(checkpoint, "en")).toBe("Plan Electron desktop feature branches");
  });

  it("keeps a human-written summary instead of replacing it with path inference", () => {
    const checkpoint = node("human", "feat/01-electron-foundation", "完成桌面端窗口安全加固", "apps/desktop/src/main.ts", "2026-08-12T09:40:00.000Z");
    expect(checkpointChangeSummary(checkpoint, "zh")).toBe("完成桌面端窗口安全加固");
  });

  it("builds a bounded Codex integration request from the functional card", () => {
    const latestNode = node("webdav", "feat/05-webdav-sync", "Add secure WebDAV workspace sync", "packages/sync/src/webdav.ts", "2026-08-12T10:00:00.000Z");
    const prompt = buildFeatureIntegrationPrompt({
      projectPath: "/projects/ark",
      item: {
        id: "branch:webdav",
        nodeId: latestNode.id,
        title: "WebDAV Sync",
        outcome: "Add secure WebDAV workspace sync",
        status: "saved",
        branch: "feat/05-webdav-sync",
        checkpointCount: 2,
        dependencyId: "branch:electron",
        dependencyTitle: "Electron Foundation",
        occurredAt: latestNode.occurredAt,
        nodes: [latestNode],
        latestNode,
        projectRoot: false
      }
    });
    expect(prompt).toContain("WebDAV Sync");
    expect(prompt).toContain("feat/05-webdav-sync");
    expect(prompt).toContain("依赖功能：Electron Foundation");
    expect(prompt).toContain("不要 push");
    expect(prompt).toContain("存在冲突");
  });

  it("keeps a semantic outcome when a completed branch ref was deleted", () => {
    const completed = node("deleted", "feat/09-ai-assistant", "修改 3 个文件", "packages/ai/index.ts", "2026-08-12T11:00:00.000Z");
    completed.headCommit = "9".repeat(40);
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: { nodes: [completed], featureLines: [{ id: "feature:task", name: "原任务", status: "active" }] },
      gitTopology: {
        currentBranch: "main",
        workingTree: { dirty: false },
        refs: [],
        commits: [{ id: "9".repeat(40), parents: [], subject: "Add private AI assistant", isCanvasightGenerated: false, isOnMain: true }]
      }
    } as unknown as ProjectHistoryResponse;
    expect(buildProjectHistoryFeatureMap(response, "en")[0]).toMatchObject({ title: "AI Assistant", outcome: "Add private AI assistant", status: "integrated" });
  });

  it("returns merged features to one main path and keeps later work on a branch lane", () => {
    const electron = node("electron", "feat/01-electron", "Electron", "electron.ts", "2026-08-12T09:00:00.000Z");
    const workspace = node("workspace", "feat/03-workspace", "Workspace", "workspace.ts", "2026-08-12T10:00:00.000Z");
    const webdav = node("webdav", "feat/05-webdav", "WebDAV", "webdav.ts", "2026-08-12T11:00:00.000Z");
    const ai = node("ai", "feat/06-ai", "AI", "ai.ts", "2026-08-12T12:00:00.000Z");
    electron.headCommit = "1".repeat(40);
    workspace.headCommit = "2".repeat(40);
    webdav.headCommit = "3".repeat(40);
    ai.headCommit = "4".repeat(40);
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: { nodes: [electron, workspace, webdav, ai], featureLines: [] },
      gitTopology: {
        currentBranch: "feat/06-ai",
        workingTree: { dirty: false },
        refs: [
          { kind: "local-branch", shortName: "feat/01-electron", commit: "1".repeat(40) },
          { kind: "local-branch", shortName: "feat/03-workspace", commit: "2".repeat(40) },
          { kind: "local-branch", shortName: "feat/05-webdav", commit: "3".repeat(40) },
          { kind: "local-branch", shortName: "feat/06-ai", commit: "4".repeat(40) }
        ],
        commits: [
          { id: "4".repeat(40), parents: ["3".repeat(40)], subject: "AI", committedAt: "2026-08-12T12:00:00.000Z", isCanvasightGenerated: false, isOnMain: false },
          { id: "3".repeat(40), parents: ["2".repeat(40)], subject: "WebDAV", committedAt: "2026-08-12T11:00:00.000Z", isCanvasightGenerated: false, isOnMain: true },
          { id: "2".repeat(40), parents: ["1".repeat(40)], subject: "Workspace", committedAt: "2026-08-12T10:00:00.000Z", isCanvasightGenerated: false, isOnMain: true },
          { id: "1".repeat(40), parents: [], subject: "Electron", committedAt: "2026-08-12T09:00:00.000Z", isCanvasightGenerated: false, isOnMain: true }
        ]
      }
    } as unknown as ProjectHistoryResponse;
    const items = buildProjectHistoryFeatureMap(response, "en");
    expect(items.map((item) => ({ title: item.title, dependency: item.dependencyTitle }))).toEqual([
      { title: "Electron", dependency: null },
      { title: "Workspace", dependency: "Electron" },
      { title: "WebDAV", dependency: "Workspace" },
      { title: "AI", dependency: "WebDAV" }
    ]);
    const positions = layoutProjectHistoryFeatureMap(items);
    expect(positions.get(items[0].id)).toMatchObject({ x: 80, y: 100, path: "mainline" });
    expect(positions.get(items[2].id)).toMatchObject({ x: 1100, y: 100, path: "mainline" });
    expect(positions.get(items[3].id)).toMatchObject({ x: 1610, y: 370, path: "branch" });
  });

  it("lays out the integrated dependency chain instead of relying on checkpoint timestamps", () => {
    const root = node("root", "main", "Root", "root.ts", "2026-08-12T13:00:00.000Z");
    const first = node("first", "feat/first", "First", "first.ts", "2026-08-12T11:00:00.000Z");
    const second = node("second", "feat/second", "Second", "second.ts", "2026-08-12T10:00:00.000Z");
    const items = [root, first, second].map((latestNode, index): ReturnType<typeof buildProjectHistoryFeatureMap>[number] => ({
      id: latestNode.id,
      nodeId: latestNode.id,
      title: latestNode.summary,
      outcome: latestNode.summary,
      status: "integrated",
      branch: latestNode.gitBranch ?? null,
      checkpointCount: 1,
      dependencyId: index ? [root.id, first.id][index - 1] : null,
      dependencyTitle: index ? [root.summary, first.summary][index - 1] : null,
      occurredAt: latestNode.occurredAt,
      nodes: [latestNode],
      latestNode,
      projectRoot: index === 0
    }));
    const positions = layoutProjectHistoryFeatureMap(items);
    expect([positions.get(root.id)?.x, positions.get(first.id)?.x, positions.get(second.id)?.x]).toEqual([80, 590, 1100]);
  });

  it("prefers the merged feature over the project card when both point at the same main commit", () => {
    const project = node("project", "main", "Project", "README.md", "2026-08-12T13:00:00.000Z");
    const webdav = node("webdav", "feat/05-webdav", "WebDAV", "webdav.ts", "2026-08-12T11:00:00.000Z");
    const ai = node("ai", "feat/06-ai", "AI", "ai.ts", "2026-08-12T12:00:00.000Z");
    project.featureLineId = "feature:external";
    project.headCommit = "3".repeat(40);
    webdav.headCommit = "3".repeat(40);
    ai.headCommit = "4".repeat(40);
    const response = {
      status: "ready",
      enabled: true,
      git: { mainBranch: "main" },
      index: { nodes: [project, webdav, ai], featureLines: [{ id: "feature:external", name: "外部变化", status: "active" }] },
      gitTopology: {
        currentBranch: "feat/06-ai",
        workingTree: { dirty: false },
        refs: [
          { kind: "local-branch", shortName: "main", commit: "3".repeat(40) },
          { kind: "local-branch", shortName: "feat/05-webdav", commit: "3".repeat(40) },
          { kind: "local-branch", shortName: "feat/06-ai", commit: "4".repeat(40) }
        ],
        commits: [
          { id: "4".repeat(40), parents: ["3".repeat(40)], subject: "AI", committedAt: "2026-08-12T12:00:00.000Z", isCanvasightGenerated: false, isOnMain: false },
          { id: "3".repeat(40), parents: [], subject: "WebDAV", committedAt: "2026-08-12T11:00:00.000Z", isCanvasightGenerated: false, isOnMain: true }
        ]
      }
    } as unknown as ProjectHistoryResponse;
    const items = buildProjectHistoryFeatureMap(response);
    expect(items.find((item) => item.title === "AI")?.dependencyTitle).toBe("WebDAV");
  });
});
