import type { ProjectGitCommit, ProjectHistoryNode, ProjectHistoryResponse } from "../lib/canvasightApi";

const TECHNICAL_SUMMARY = /^(?:修改|变更|新增|删除|重命名|完成讨论|任务已中断|\d+\s*(?:个)?未提交文件)/u;
const INTERNAL_PATH = /^(?:\.scatter)(?:\/|$)/u;
const GENERATED_PATH = /^(?:(?:dist|build)\/|.*\/(?:dist|build)\/|plugins\/canvasight\/mcp\/server\.mjs$)/u;
const KNOWN_WORDS = new Map([
  ["ai", "AI"],
  ["api", "API"],
  ["canvasight", "Canvasight"],
  ["codex", "Codex"],
  ["electron", "Electron"],
  ["git", "Git"],
  ["mcp", "MCP"],
  ["mvp", "MVP"],
  ["ui", "UI"],
  ["ux", "UX"],
  ["webdav", "WebDAV"]
]);
const ZH_FEATURE_WORDS = new Map([
  ["foundation", "基础"],
  ["workspace", "工作区"],
  ["core", "核心"],
  ["finance", "财务"],
  ["ledger", "账本"],
  ["sync", "同步"],
  ["assistant", "助手"],
  ["copilot", "助手"],
  ["distribution", "发布"],
  ["hardening", "加固"],
  ["offline", "离线"],
  ["search", "搜索"],
  ["note", "笔记"],
  ["notes", "笔记"],
  ["favorite", "收藏"],
  ["favorites", "收藏"],
  ["security", "安全"],
  ["desktop", "桌面端"],
  ["usable", "可用"],
  ["mvp", "MVP"]
]);

export type FeatureMapStatus = "developing" | "saved" | "integrated" | "abandoned";

export interface ProjectHistoryFeatureMapItem {
  id: string;
  nodeId: string;
  title: string;
  outcome: string;
  status: FeatureMapStatus;
  branch: string | null;
  checkpointCount: number;
  dependencyId: string | null;
  dependencyTitle: string | null;
  occurredAt: string;
  nodes: ProjectHistoryNode[];
  latestNode: ProjectHistoryNode;
  projectRoot: boolean;
}

export function checkpointSourceSummary(node: ProjectHistoryNode, language: "zh" | "en"): string {
  const workflowTitle = node.workflowTitle?.trim();
  if (workflowTitle) return language === "zh" ? `工作流：${workflowTitle}` : `Workflow: ${workflowTitle}`;
  if (node.workflowNodeId) return language === "zh" ? "来自 Canvasight 工作流" : "From a Canvasight workflow";
  if (node.source === "external" || node.taskId === "external-change") return language === "zh" ? "项目外部修改" : "External project change";
  if (node.source === "mixed") return language === "zh" ? "Codex 与其他修改" : "Codex and other changes";
  if (node.source === "portable") return language === "zh" ? "跨设备记录" : "Cross-device record";
  if (node.source === "codex") return language === "zh" ? "Codex 开发" : "Codex development";
  return language === "zh" ? "来源未记录" : "Source not recorded";
}

export function selectCurrentProjectHistoryFeature(
  items: ProjectHistoryFeatureMapItem[],
  currentBranch: string | null | undefined
): ProjectHistoryFeatureMapItem | null {
  const actionable = items.filter((item) => !item.projectRoot && item.status !== "integrated" && item.status !== "abandoned");
  const newest = (candidates: ProjectHistoryFeatureMapItem[]) => [...candidates].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0] ?? null;
  return newest(actionable.filter((item) => item.status === "developing" && item.branch === currentBranch))
    ?? newest(actionable.filter((item) => item.status === "developing"))
    ?? newest(actionable.filter((item) => item.branch === currentBranch))
    ?? newest(actionable)
    ?? newest(items.filter((item) => item.projectRoot))
    ?? newest(items.filter((item) => !item.projectRoot && item.status === "integrated"))
    ?? newest(items);
}

export function currentProjectHistoryFocusNodeIds(
  items: ProjectHistoryFeatureMapItem[],
  currentBranch: string | null | undefined
): string[] {
  const current = selectCurrentProjectHistoryFeature(items, currentBranch);
  if (!current) return [];
  const dependency = current.dependencyId ? items.find((item) => item.id === current.dependencyId) : null;
  return dependency ? [dependency.nodeId, current.nodeId] : [current.nodeId];
}

function humanizePart(part: string): string {
  const known = KNOWN_WORDS.get(part.toLocaleLowerCase());
  if (known) return known;
  return part.length ? `${part[0].toLocaleUpperCase()}${part.slice(1)}` : part;
}

export function featureTitleFromBranch(branch: string, language: "zh" | "en" = "en"): string {
  const leaf = branch
    .replace(/^refs\/heads\//u, "")
    .replace(/^codex\//iu, "")
    .replace(/^(?:feat|feature|fix|chore|refactor|release)\//u, "")
    .replace(/^\d+[._-]*/u, "");
  const parts = leaf.split(/[\s._-]+/u).filter(Boolean);
  if (language === "en") return parts.map(humanizePart).join(" ") || branch;
  return parts
    .map((part) => ZH_FEATURE_WORDS.get(part.toLocaleLowerCase()) ?? humanizePart(part))
    .reduce((title, part) => `${title}${title && (/[a-z0-9]$/iu.test(title) || /^[a-z0-9]/iu.test(part)) ? " " : ""}${part}`, "")
    || branch;
}

export function isInternalHistoryNode(node: ProjectHistoryNode): boolean {
  return node.kind !== "baseline"
    && node.changedPaths.length > 0
    && node.changedPaths.every((change) => INTERNAL_PATH.test(change.path.replaceAll("\\", "/")));
}

function branchKey(node: ProjectHistoryNode, mainBranch: string | null | undefined): string | null {
  const branch = node.gitBranch?.trim();
  if (!branch || branch === mainBranch || branch === "main" || branch === "master") return null;
  return `branch:${branch}`;
}

function featureKey(node: ProjectHistoryNode, response: ProjectHistoryResponse): string {
  return branchKey(node, response.git?.mainBranch) ?? (node.featureLineId ? `feature:${node.featureLineId}` : `task:${node.taskId ?? node.id}`);
}

function commitForBranch(response: ProjectHistoryResponse, branch: string | null): ProjectGitCommit | null {
  if (!branch || !response.gitTopology) return null;
  const ref = response.gitTopology.refs.find((candidate) => candidate.kind === "local-branch" && candidate.shortName === branch);
  return ref ? response.gitTopology.commits.find((commit) => commit.id === ref.commit) ?? null : null;
}

function commitForNodes(response: ProjectHistoryResponse, nodes: ProjectHistoryNode[], branch: string | null): ProjectGitCommit | null {
  const branchCommit = commitForBranch(response, branch);
  if (branchCommit) return branchCommit;
  const commits = response.gitTopology?.commits ?? [];
  for (const node of [...nodes].reverse()) {
    const commit = commits.find((candidate) => candidate.id === node.headCommit || candidate.id === node.commit);
    if (commit) return commit;
  }
  return null;
}

export function isSemanticHistorySummary(summary: string): boolean {
  const normalized = displaySemanticHistorySummary(summary);
  return Boolean(normalized) && !TECHNICAL_SUMMARY.test(normalized) && !/[\\/][^\s，、]+\.[a-z0-9]{1,8}(?:[，、:]|$)/iu.test(normalized);
}

export function displaySemanticHistorySummary(summary: string): string {
  return summary
    .trim()
    .replace(/^(?:feat|fix|refactor|perf|docs|test|chore|build|ci)(?:\([^)]*\))?!?:\s*/iu, "")
    .trim();
}

function projectPaths(node: ProjectHistoryNode): string[] {
  return node.changedPaths
    .map((change) => change.path.replaceAll("\\", "/"))
    .filter((filePath) => !INTERNAL_PATH.test(filePath));
}

function semanticProjectPaths(node: ProjectHistoryNode): string[] {
  return projectPaths(node).filter((filePath) => !GENERATED_PATH.test(filePath));
}

function historyStateKeys(node: ProjectHistoryNode): string[] {
  return [node.tree, node.headCommit, node.commit].filter((value): value is string => Boolean(value));
}

function dedupeFeatureCheckpoints(nodes: ProjectHistoryNode[]): ProjectHistoryNode[] {
  const byState = new Map<string, ProjectHistoryNode>();
  for (const node of [...nodes].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))) {
    const key = node.tree || node.headCommit || node.commit || node.id;
    const current = byState.get(key);
    if (!current || projectPaths(node).length > projectPaths(current).length) byState.set(key, node);
  }
  return [...byState.values()].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

function joinAreas(areas: string[], language: "zh" | "en"): string {
  if (areas.length <= 1) return areas[0] ?? "";
  if (language === "en") return areas.length === 2 ? areas.join(" and ") : `${areas.slice(0, -1).join(", ")}, and ${areas.at(-1)}`;
  return areas.join("、");
}

export function checkpointProjectFileCount(node: ProjectHistoryNode): number {
  return projectPaths(node).length;
}

export function checkpointChangeSummary(node: ProjectHistoryNode, language: "zh" | "en" = "zh"): string {
  const summary = displaySemanticHistorySummary(node.summary);
  const paths = projectPaths(node);
  const searchable = paths.join(" ").toLocaleLowerCase();
  const has = (pattern: RegExp) => pattern.test(searchable);
  const semanticInDisplayLanguage = isSemanticHistorySummary(summary)
    && (language === "en" || /[\u3400-\u9fff]/u.test(summary));
  if (semanticInDisplayLanguage) return summary;
  if (!paths.length) return semanticInDisplayLanguage
    ? summary
    : language === "zh" ? "保存这一阶段的项目进度" : "Saved this stage of project progress";

  const desktop = has(/(?:^|[\/_.-])(?:desktop|electron|forge)(?:[\/_.-]|$)/u);
  const planning = has(/(?:development[-_. ]?plan|roadmap|规划|方案)/u);
  if (planning && desktop) return language === "zh" ? "整理 Electron 桌面端开发规划" : "Outlined the Electron desktop development plan";

  const packageOnly = paths.every((filePath) => /(?:^|\/)package(?:-lock)?\.json$/u.test(filePath));
  if (packageOnly) {
    if (desktop) return language === "zh" ? "调整 Electron 桌面端的依赖与运行配置" : "Adjusted Electron desktop dependencies and runtime configuration";
    return language === "zh" ? "调整项目依赖与运行配置" : "Adjusted project dependencies and runtime configuration";
  }

  const labels = language === "zh" ? {
    webdav: "WebDAV 同步",
    ai: "AI 能力",
    finance: "财务功能",
    workspace: "工作区",
    desktop: "Electron 桌面端",
    security: "安全防护",
    ui: "界面交互",
    backend: "后端/API",
    package: "自动打包流程",
    tests: "自动测试",
    docs: "使用说明",
    config: "项目配置",
    grouping: "分组和画布操作"
  } : {
    webdav: "WebDAV sync",
    ai: "AI capabilities",
    finance: "finance features",
    workspace: "the workspace",
    desktop: "the Electron desktop app",
    security: "security safeguards",
    ui: "interface and interactions",
    backend: "backend and APIs",
    package: "automated packaging",
    tests: "automated tests",
    docs: "usage documentation",
    config: "project configuration",
    grouping: "grouping and canvas interactions"
  };
  const areas: string[] = [];
  const add = (condition: boolean, label: string) => { if (condition && !areas.includes(label)) areas.push(label); };
  add(has(/(?:webdav|(?:^|[\/_.-])sync(?:[\/_.-]|$))/u), labels.webdav);
  add(has(/(?:^|[\/_.-])ai(?:[\/_.-]|$)|assistant|llm/u), labels.ai);
  add(has(/finance|ledger|budget|accounting/u), labels.finance);
  add(has(/workspace|projects?|tasks?|schedule/u), labels.workspace);
  add(has(/(?:canvasGraph|GroupNode|groupAction)/iu), labels.grouping);
  add(desktop, labels.desktop);
  add(has(/security|secure|permission|sandbox|credential|encrypt/u), labels.security);
  add(has(/(?:^|\/)(?:ui|components?|pages?)(?:\/|$)|(?:^|\/)app\/(?:page|layout)\.[^/]+$|\.(?:css|scss|less)$/u), labels.ui);
  add(has(/(?:^|[\/_.-])(?:server|backend|api)(?:[\/_.-]|$)/u), labels.backend);
  add(has(/(?:^|\/)\.github\/workflows\/|(?:^|[\/_.-])(?:packag|release|publish)(?:[\/_.-]|$)/u), labels.package);
  add(has(/(?:^|[\/_.-])(?:tests?|spec)(?:[\/_.-]|$)/u), labels.tests);
  add(has(/(?:^|\/)(?:readme(?:\.[^/]*)?|docs?)(?:\/|$)/u), labels.docs);
  add(has(/(?:^|\/)(?:package(?:-lock)?\.json|tsconfig[^/]*\.json|eslint[^/]*|vite[^/]*|\.gitignore)$/u), labels.config);

  const visibleAreas = areas.slice(0, 3);
  if (!visibleAreas.length) {
    return language === "zh" ? "完善这一阶段的项目功能" : "Improved this stage of the project";
  }
  const joinedAreas = joinAreas(visibleAreas, language);
  return language === "zh"
    ? `完善${/^[a-z0-9]/iu.test(joinedAreas) ? " " : ""}${joinedAreas}`
    : `Improved ${joinedAreas}`;
}

function featureCheckpointSummary(nodes: ProjectHistoryNode[], language: "zh" | "en"): string {
  const latest = nodes.at(-1)!;
  return checkpointChangeSummary({
    ...latest,
    summary: "",
    changedPaths: nodes.flatMap((node) => node.changedPaths)
  }, language);
}

function chineseFeatureOutcomeFromPaths(branch: string, nodes: ProjectHistoryNode[]): string | null {
  const paths = nodes.flatMap(projectPaths);
  if (!paths.length) return null;
  const isTest = (filePath: string) => /(?:^|[\/_.-])(?:tests?|spec)(?:[\/_.-]|$)/u.test(filePath);
  const isDocumentation = (filePath: string) => /(?:^|\/)(?:readme(?:\.[^/]*)?|docs?)(?:\/|$)/iu.test(filePath);
  const isConfiguration = (filePath: string) => /(?:^|\/)(?:package(?:-lock)?\.json|tsconfig[^/]*\.json|eslint[^/]*|vite[^/]*|\.gitignore)$/u.test(filePath);
  const title = featureTitleFromBranch(branch, "zh");
  const spacedTitle = `${/^[a-z0-9]/iu.test(title) ? " " : ""}${title}`;
  const hasCapabilityChange = paths.some((filePath) => !isTest(filePath) && !isDocumentation(filePath) && !isConfiguration(filePath));
  if (hasCapabilityChange) return `已实现${spacedTitle}`;
  const safeguards: string[] = [];
  if (paths.some(isTest)) safeguards.push("自动测试");
  if (paths.some(isDocumentation)) safeguards.push("使用说明");
  if (paths.some(isConfiguration)) safeguards.push("项目配置");
  return safeguards.length ? `完善${spacedTitle}的${joinAreas(safeguards, "zh")}` : null;
}

function outcomeFor(response: ProjectHistoryResponse, nodes: ProjectHistoryNode[], branch: string | null, language: "zh" | "en"): string {
  const commit = commitForNodes(response, nodes, branch);
  if (
    commit
    && !commit.isCanvasightGenerated
    && isSemanticHistorySummary(commit.subject)
    && (language === "en" || /[\u3400-\u9fff]/u.test(commit.subject))
  ) return displaySemanticHistorySummary(commit.subject);
  const semantic = [...nodes].reverse().find((node) => (
    isSemanticHistorySummary(node.summary)
    && (language === "en" || /[\u3400-\u9fff]/u.test(node.summary))
  ));
  if (semantic) return displaySemanticHistorySummary(semantic.summary);
  if (language === "zh" && branch && nodes.every((node) => projectPaths(node).length === 0)) {
    const featureTitle = featureTitleFromBranch(branch, language);
    return /\b(?:merge|integrat(?:e|ed|ion))\b/iu.test(commit?.subject ?? nodes.at(-1)!.summary)
      ? `完成${featureTitle}阶段整合`
      : `推进${featureTitle}功能`;
  }
  if (language === "zh" && branch) {
    const functionalOutcome = chineseFeatureOutcomeFromPaths(branch, nodes);
    if (functionalOutcome) return functionalOutcome;
  }
  const inferred = featureCheckpointSummary(nodes, language);
  return inferred;
}

function featureName(response: ProjectHistoryResponse, node: ProjectHistoryNode): string | null {
  return response.index?.featureLines.find((feature) => feature.id === node.featureLineId)?.name ?? null;
}

function projectRootOutcome(nodes: ProjectHistoryNode[], language: "zh" | "en"): string {
  const latestSemanticNode = [...nodes].reverse().find((node) => semanticProjectPaths(node).length > 0);
  if (!latestSemanticNode) return language === "zh" ? "项目主线已更新" : "Project mainline updated";
  const summaryInDisplayLanguage = isSemanticHistorySummary(latestSemanticNode.summary)
    && (language === "en" || /[\u3400-\u9fff]/u.test(latestSemanticNode.summary));
  const summary = summaryInDisplayLanguage
    ? displaySemanticHistorySummary(latestSemanticNode.summary)
    : checkpointChangeSummary({
      ...latestSemanticNode,
      summary: "",
      changedPaths: latestSemanticNode.changedPaths.filter((change) => !GENERATED_PATH.test(change.path.replaceAll("\\", "/")))
    }, language);
  return language === "zh" ? `最近完成：${summary}` : `Latest: ${summary}`;
}

function branchAncestorDistances(commits: Map<string, ProjectGitCommit>, start: string): Map<string, number> {
  const distances = new Map<string, number>();
  const queue = (commits.get(start)?.parents ?? []).map((id) => ({ id, distance: 1 }));
  while (queue.length) {
    const current = queue.shift()!;
    const knownDistance = distances.get(current.id);
    if (knownDistance !== undefined && knownDistance <= current.distance) continue;
    distances.set(current.id, current.distance);
    for (const parent of commits.get(current.id)?.parents ?? []) {
      queue.push({ id: parent, distance: current.distance + 1 });
    }
  }
  return distances;
}

function dependencyFor(response: ProjectHistoryResponse, item: ProjectHistoryFeatureMapItem, items: ProjectHistoryFeatureMapItem[]): ProjectHistoryFeatureMapItem | null {
  if (!item.branch || !response.gitTopology) return null;
  const commits = new Map(response.gitTopology.commits.map((commit) => [commit.id, commit] as const));
  const tip = commitForNodes(response, item.nodes, item.branch);
  if (!tip) return null;
  const ancestors = branchAncestorDistances(commits, tip.id);
  let nearest: { item: ProjectHistoryFeatureMapItem; distance: number } | null = null;
  for (const candidate of items) {
    if (candidate.id === item.id || !candidate.branch) continue;
    const candidateTip = commitForNodes(response, candidate.nodes, candidate.branch);
    const distance = candidateTip ? ancestors.get(candidateTip.id) : undefined;
    if (distance !== undefined && (
      !nearest
      || distance < nearest.distance
      || (distance === nearest.distance && nearest.item.projectRoot && !candidate.projectRoot)
    )) nearest = { item: candidate, distance };
  }
  return nearest?.item ?? null;
}

function mainlineOrder(response: ProjectHistoryResponse, item: ProjectHistoryFeatureMapItem): string {
  const commit = commitForNodes(response, item.nodes, item.branch);
  return commit?.committedAt || item.occurredAt;
}

function resolvedStatus(response: ProjectHistoryResponse, latestNode: ProjectHistoryNode, branch: string | null): FeatureMapStatus {
  const logicalStatus = response.index?.featureLines.find((feature) => feature.id === latestNode.featureLineId)?.status;
  if (logicalStatus === "abandoned") return "abandoned";
  if (latestNode.merged || logicalStatus === "merged" || commitForNodes(response, [latestNode], branch)?.isOnMain) return "integrated";
  if (branch && branch === response.gitTopology?.currentBranch && response.gitTopology.workingTree.dirty) return "developing";
  return "saved";
}

export function buildProjectHistoryFeatureMap(response: ProjectHistoryResponse, language: "zh" | "en" = "zh"): ProjectHistoryFeatureMapItem[] {
  if (!response.index) return [];
  const projectStartStates = new Set(response.index.nodes
    .filter((node) => node.kind === "baseline")
    .flatMap(historyStateKeys));
  const groups = new Map<string, ProjectHistoryNode[]>();
  for (const node of response.index.nodes) {
    if (node.kind === "baseline" || isInternalHistoryNode(node)) continue;
    if (branchKey(node, response.git?.mainBranch) && historyStateKeys(node).some((key) => projectStartStates.has(key))) continue;
    const key = featureKey(node, response);
    const list = groups.get(key) ?? [];
    list.push(node);
    groups.set(key, list);
  }
  const rawItems = [...groups.entries()].map(([id, unsortedNodes]): ProjectHistoryFeatureMapItem => {
    const nodes = dedupeFeatureCheckpoints(unsortedNodes);
    const latestNode = nodes.at(-1)!;
    const branch = latestNode.gitBranch?.trim() || null;
    const branchTitle = branchKey(latestNode, response.git?.mainBranch) ? featureTitleFromBranch(branch!, language) : null;
    const logicalName = featureName(response, latestNode);
    const projectRoot = Boolean(
      branch
      && (branch === response.git?.mainBranch || branch === "main" || branch === "master")
      && commitForNodes(response, nodes, branch)?.isOnMain
      && (logicalName === "外部变化" || logicalName === "External changes")
    );
    const outcome = projectRoot ? projectRootOutcome(nodes, language) : outcomeFor(response, nodes, branch, language);
    const title = projectRoot
      ? (language === "zh" ? "项目主线" : "Project mainline")
      : branchTitle || logicalName || (language === "zh" ? "待归类功能" : "Unclassified feature");
    return {
      id,
      nodeId: latestNode.id,
      title,
      outcome,
      status: resolvedStatus(response, latestNode, branch),
      branch,
      checkpointCount: nodes.length,
      dependencyId: null,
      dependencyTitle: null,
      occurredAt: latestNode.occurredAt,
      nodes,
      latestNode,
      projectRoot
    };
  });
  const featureCommitIds = new Set(rawItems
    .filter((item) => !item.projectRoot)
    .map((item) => commitForNodes(response, item.nodes, item.branch)?.id)
    .filter((id): id is string => Boolean(id)));
  const items = rawItems.filter((item) => !item.projectRoot || !featureCommitIds.has(commitForNodes(response, item.nodes, item.branch)?.id ?? ""));
  for (const item of items.filter((candidate) => candidate.status !== "integrated")) {
    const dependency = dependencyFor(response, item, items);
    if (dependency) {
      item.dependencyId = dependency.id;
      item.dependencyTitle = dependency.title;
    }
  }
  const integrated = items
    .filter((item) => item.status === "integrated")
    .sort((a, b) => Number(b.projectRoot) - Number(a.projectRoot) || mainlineOrder(response, a).localeCompare(mainlineOrder(response, b)));
  for (let index = 0; index < integrated.length; index += 1) {
    const previous = integrated[index - 1];
    integrated[index].dependencyId = previous?.id ?? null;
    integrated[index].dependencyTitle = previous?.title ?? null;
  }
  return items.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}

export function buildFeatureIntegrationPrompt({
  item,
  projectPath,
  language = "zh"
}: {
  item: ProjectHistoryFeatureMapItem;
  projectPath: string;
  language?: "zh" | "en";
}): string {
  const node = item.latestNode;
  if (language === "en") return `The user explicitly chose to integrate “${item.title}” into local main from the Canvasight feature map.\n\nProject path: ${projectPath}\nFeature outcome: ${item.outcome}\nFeature branch: ${item.branch ?? "not separately named"}\nLatest restore point: ${node.id}\nSnapshot commit: ${node.commit}\n${item.dependencyTitle ? `Depends on: ${item.dependencyTitle}\n` : ""}\nInspect the actual project and feature state first and run relevant checks. Integrate into local main only when safe. If there are conflicts, unfinished work, or the result does not satisfy the feature goal, stop and explain the problem. Do not push, rewrite history, or modify unrelated branches. Report the result in ordinary-user language.`;
  return `用户在 Canvasight 功能地图中明确选择将“${item.title}”整合到本地 main。\n\n项目路径：${projectPath}\n功能结果：${item.outcome}\n功能分支：${item.branch ?? "未单独命名"}\n最新恢复点：${node.id}\n恢复提交：${node.commit}\n${item.dependencyTitle ? `依赖功能：${item.dependencyTitle}\n` : ""}\n请先检查当前项目与该功能的实际状态，运行相关测试；确认安全后再整合到本地 main。若存在冲突、未完成工作或结果不符合功能目标，请停止合并并直接说明问题。不要 push，不要改写历史，不要修改无关分支。完成后用普通用户能理解的语言说明这个功能是否已整合、验证了什么、还需要什么。`;
}
