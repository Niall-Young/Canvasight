import type { ProjectHistoryNode, ProjectHistoryResponse } from "../lib/canvasightApi";

function demoNode({ id, summary, occurredAt, ...node }: Partial<ProjectHistoryNode> & Pick<ProjectHistoryNode, "id" | "summary" | "occurredAt">): ProjectHistoryNode {
  return {
    id,
    kind: "snapshot",
    summary,
    status: "protected",
    source: "codex",
    featureLineId: "feature-history",
    taskId: "demo-task",
    turnId: `turn-${id}`,
    snapshotRef: `refs/canvasight/demo/${node.id}`,
    commit: `demo-${node.id}`,
    tree: `tree-${node.id}`,
    changedPaths: [],
    coverage: { complete: true },
    occurredAt,
    confirmed: false,
    merged: false,
    ...node
  };
}

export function createProjectHistoryDemo(language: "zh" | "en"): ProjectHistoryResponse {
  const zh = language === "zh";
  const gitIds = {
    start: "1111111111111111111111111111111111111111",
    foundation: "2222222222222222222222222222222222222222",
    history: "3333333333333333333333333333333333333333",
    mainAdvance: "4444444444444444444444444444444444444444",
    polish: "5555555555555555555555555555555555555555",
    merge: "6666666666666666666666666666666666666666",
    current: "7777777777777777777777777777777777777777"
  };
  const nodes: ProjectHistoryNode[] = [
    demoNode({
      id: "demo-baseline",
      kind: "baseline",
      summary: zh ? "项目保护起点" : "Project protection started",
      status: "protected",
      source: "codex",
      featureLineId: null,
      taskId: null,
      turnId: null,
      changedPaths: [],
      occurredAt: "2026-08-09T09:20:00.000Z"
    }),
    demoNode({
      id: "demo-history-structure",
      summary: zh ? "建立项目历史与功能线" : "Created project history and feature lines",
      changedPaths: [
        { status: "A", path: "src/components/HistoryWorkspace.tsx" },
        { status: "A", path: "src/components/HistoryNode.tsx" },
        { status: "M", path: "src/App.tsx" },
        { status: "M", path: "src/styles/history.css" }
      ],
      occurredAt: "2026-08-10T03:18:00.000Z",
      agentCheck: {
        status: "passed",
        requestId: "demo-agent-check-1",
        summary: zh ? "节点识别、聊天定位和隔离恢复均已通过。" : "Node recognition, chat location, and isolated recovery passed.",
        evidence: [zh ? "类型检查通过" : "Typecheck passed", zh ? "原生 Run 已回到当前任务" : "Native Run returned to the current task"],
        taskId: "demo-task",
        occurredAt: "2026-08-10T03:40:00.000Z"
      }
    }),
    demoNode({
      id: "demo-history-polish",
      summary: zh ? "优化历史卡片与节点就地操作" : "Polished history cards and in-place actions",
      source: "mixed",
      changedPaths: [
        { status: "M", path: "src/components/HistoryNode.tsx" },
        { status: "M", path: "src/components/HistoryWorkspace.tsx" },
        { status: "M", path: "src/styles/history.css" },
        { status: "A", path: "src/components/projectHistoryDemo.ts" }
      ],
      coverage: { complete: false, automaticExcludedPaths: ["dist/preview-large.mov"] },
      occurredAt: "2026-08-11T03:28:00.000Z"
    }),
    demoNode({
      id: "demo-portability-1",
      summary: zh ? "加入本地历史清单导出" : "Added local history manifest export",
      featureLineId: "feature-portability",
      changedPaths: [
        { status: "A", path: "mcp/infrastructure/project-history-portability.mjs" },
        { status: "M", path: "mcp/application/project-history-runtime.mjs" }
      ],
      occurredAt: "2026-08-10T05:45:00.000Z",
      confirmed: true,
      confirmationCommit: "demo-confirm-portability"
    }),
    demoNode({
      id: "demo-portability-2",
      summary: zh ? "合并跨设备历史清单" : "Merged the portable history manifest",
      featureLineId: "feature-portability",
      changedPaths: [
        { status: "M", path: "mcp/infrastructure/project-history-portability.mjs" },
        { status: "A", path: "tests/project-history-portability-service-smoke.mjs" }
      ],
      occurredAt: "2026-08-10T08:12:00.000Z",
      confirmed: true,
      merged: true,
      mergeCommit: "demo-merge-portability"
    }),
    demoNode({
      id: "demo-old-inspector",
      summary: zh ? "尝试右侧详情栏方案" : "Tried a right-side inspector",
      featureLineId: "feature-old-inspector",
      changedPaths: [
        { status: "M", path: "src/components/HistoryWorkspace.tsx" },
        { status: "M", path: "src/styles/history.css" }
      ],
      occurredAt: "2026-08-10T10:05:00.000Z"
    })
  ];

  return {
    status: "ready",
    enabled: true,
    git: {
      mainBranch: "main",
      mainCommit: gitIds.merge,
      currentBranch: "feature/project-history",
      headCommit: gitIds.current,
      detached: false,
      featureModel: "logical-lines",
      snapshotRefNamespace: "refs/canvasight/snapshots/"
    },
    gitTopology: {
      schemaVersion: 1,
      commits: [
        { id: gitIds.current, shortId: gitIds.current.slice(0, 8), parents: [gitIds.merge], subject: zh ? "补全项目全景的合并提示" : "Clarify merge guidance in project panorama", author: "Niall", committedAt: "2026-08-12T06:25:00.000Z", refs: [{ name: "feature/project-history", kind: "local-branch", current: true }], isHead: true, isOnMain: false, isOnMainline: false, isCanvasightGenerated: false, isMerge: false, historyNodeIds: ["demo-history-polish"] },
        { id: gitIds.merge, shortId: gitIds.merge.slice(0, 8), parents: [gitIds.mainAdvance, gitIds.polish], subject: zh ? "合并项目历史全景" : "Merge project history panorama", author: "Niall", committedAt: "2026-08-11T09:40:00.000Z", refs: [{ name: "main", kind: "local-branch", current: false }], isHead: false, isOnMain: true, isOnMainline: true, isCanvasightGenerated: false, isMerge: true, historyNodeIds: ["demo-portability-2"] },
        { id: gitIds.polish, shortId: gitIds.polish.slice(0, 8), parents: [gitIds.history], subject: zh ? "优化提交节点与恢复证据" : "Polish commit nodes and restore evidence", author: "Niall", committedAt: "2026-08-11T05:18:00.000Z", refs: [], isHead: false, isOnMain: true, isOnMainline: false, isCanvasightGenerated: false, isMerge: false, historyNodeIds: ["demo-history-structure"] },
        { id: gitIds.mainAdvance, shortId: gitIds.mainAdvance.slice(0, 8), parents: [gitIds.foundation], subject: zh ? "更新主线运行时" : "Update main runtime", author: "Niall", committedAt: "2026-08-11T03:12:00.000Z", refs: [], isHead: false, isOnMain: true, isOnMainline: true, isCanvasightGenerated: false, isMerge: false, historyNodeIds: [] },
        { id: gitIds.history, shortId: gitIds.history.slice(0, 8), parents: [gitIds.foundation], subject: zh ? "建立真实 Git 项目全景" : "Build the real Git project panorama", author: "Niall", committedAt: "2026-08-10T08:30:00.000Z", refs: [], isHead: false, isOnMain: true, isOnMainline: false, isCanvasightGenerated: false, isMerge: false, historyNodeIds: ["demo-portability-1"] },
        { id: gitIds.foundation, shortId: gitIds.foundation.slice(0, 8), parents: [gitIds.start], subject: zh ? "建立 Canvasight 项目基础" : "Establish the Canvasight foundation", author: "Niall", committedAt: "2026-08-09T12:10:00.000Z", refs: [{ name: "v0.6.10", kind: "tag", current: false }], isHead: false, isOnMain: true, isOnMainline: true, isCanvasightGenerated: false, isMerge: false, historyNodeIds: [] },
        { id: gitIds.start, shortId: gitIds.start.slice(0, 8), parents: [], subject: zh ? "初始化 Canvasight 项目" : "Initialize the Canvasight project", author: "Niall", committedAt: "2026-08-09T09:20:00.000Z", refs: [], isHead: false, isOnMain: true, isOnMainline: true, isCanvasightGenerated: false, isMerge: false, historyNodeIds: ["demo-baseline"] }
      ],
      refs: [
        { name: "refs/heads/main", shortName: "main", kind: "local-branch", commit: gitIds.merge, current: false },
        { name: "refs/heads/feature/project-history", shortName: "feature/project-history", kind: "local-branch", commit: gitIds.current, current: true },
        { name: "refs/tags/v0.6.10", shortName: "v0.6.10", kind: "tag", commit: gitIds.foundation, current: false }
      ],
      totalCommitCount: 7,
      truncated: false,
      topology: "branched",
      mergeStatus: "ready-to-merge",
      currentBranch: "feature/project-history",
      headCommit: gitIds.current,
      mainCommit: gitIds.merge,
      ahead: 1,
      behind: 0,
      workingTree: { dirty: false, changeCount: 0, stagedCount: 0, unstagedCount: 0, untrackedCount: 0 }
    },
    index: {
      schemaVersion: 1,
      revision: 6,
      protection: { enabled: true, initialized: true, healthy: true, unresolvedFailures: [] },
      nodes,
      featureLines: [
        { id: "feature-history", name: zh ? "项目历史可视化" : "Project history canvas", status: "active", classificationEdits: [] },
        { id: "feature-portability", name: zh ? "跨设备历史清单" : "Portable history manifest", status: "merged", classificationEdits: [] },
        { id: "feature-old-inspector", name: zh ? "旧版右侧详情" : "Old right-side inspector", status: "abandoned", classificationEdits: [] }
      ],
      chatActivities: [
        { observationId: "demo-chat-1", taskId: "demo-task", turnId: "demo-turn-1", status: "completed", featureLineId: "feature-history", summary: zh ? "确认聊天不单独创建 Git 节点" : "Confirmed chat-only turns do not create Git nodes", occurredAt: "2026-08-09T11:15:00.000Z" },
        { observationId: "demo-chat-2", taskId: "demo-task", turnId: "demo-turn-2", status: "completed", featureLineId: "feature-history", summary: zh ? "确定卡片就地展开，详情再用弹窗" : "Chose in-place card actions with a detail dialog", occurredAt: "2026-08-11T02:50:00.000Z" },
        { observationId: "demo-chat-3", taskId: "demo-task", turnId: "demo-turn-3", status: "completed", featureLineId: "feature-portability", summary: zh ? "远程同步改为节点确认" : "Made remote sync an explicit node confirmation", occurredAt: "2026-08-10T06:35:00.000Z" }
      ],
      coverageGaps: [],
      processGroups: []
    },
    view: {
      schemaVersion: 1,
      revision: 1,
      viewport: { x: 24, y: 90, zoom: 0.82 },
      positions: {
        "demo-baseline": { x: 80, y: 310 },
        "demo-history-structure": { x: 590, y: 60 },
        "demo-history-polish": { x: 1100, y: 60 },
        "demo-portability-1": { x: 590, y: 310 },
        "demo-portability-2": { x: 1100, y: 310 },
        "demo-old-inspector": { x: 590, y: 560 }
      },
      collapsedGroupIds: [],
      filters: { query: "", status: "all", source: "all" }
    },
    provider: {
      coverageStartedAt: "2026-08-09T09:20:00.000Z",
      observedTurnCount: 18,
      coverageComplete: true,
      coverage: { complete: true, scannedThreadCount: 4, observedTurnCount: 18 },
      navigation: "native",
      taskCreation: "native"
    },
    providerWarning: null,
    refreshedObservationCount: 0,
    externalWatcher: { status: "idle", sealed: true },
    portability: {
      projectId: "canvasight-demo",
      remotes: ["origin"],
      authorized: false,
      remote: null,
      historyRef: "refs/canvasight/history/demo",
      localCommit: "demo-manifest",
      updatedAt: "2026-08-11T03:30:00.000Z",
      importedEventCount: 0,
      missingObjectCount: 0
    }
  };
}
