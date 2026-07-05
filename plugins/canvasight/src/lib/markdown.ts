import type { Attachment, CodexMode, LanguagePreference, RunMode, ScatterEdge, ScatterNode } from "../../shared/types";

export interface MarkdownResult {
  markdown: string;
  nodes: ScatterNode[];
  attachments: Attachment[];
  imagePaths: string[];
  codexMode: CodexMode;
  planMode: boolean;
  hasCycle: boolean;
}

function downstreamNodeIds(startId: string, edges: ScatterEdge[]): { ids: Set<string>; hasCycle: boolean } {
  const ids = new Set<string>([startId]);
  const visiting = new Set<string>();
  const visited = new Set<string>();
  let hasCycle = false;

  const visit = (nodeId: string): void => {
    if (visiting.has(nodeId)) {
      hasCycle = true;
      return;
    }
    if (visited.has(nodeId)) return;
    visiting.add(nodeId);

    for (const edge of edges.filter((item) => item.source === nodeId)) {
      ids.add(edge.target);
      visit(edge.target);
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
  };

  visit(startId);
  return { ids, hasCycle };
}

function sortFlow(nodes: ScatterNode[], edges: ScatterEdge[], startId: string): ScatterNode[] {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const included = new Set(nodes.map((node) => node.id));
  const ordered: ScatterNode[] = [];
  const visited = new Set<string>();

  const visit = (nodeId: string): void => {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    const node = nodeById.get(nodeId);
    if (node) ordered.push(node);
    const children = edges
      .filter((edge) => edge.source === nodeId && included.has(edge.target))
      .sort((a, b) => {
        const left = nodeById.get(a.target);
        const right = nodeById.get(b.target);
        return (left?.position.y ?? 0) - (right?.position.y ?? 0) || (left?.position.x ?? 0) - (right?.position.x ?? 0);
      });
    for (const edge of children) visit(edge.target);
  };

  visit(startId);
  const remaining = nodes
    .filter((node) => !visited.has(node.id))
    .sort((a, b) => a.position.y - b.position.y || a.position.x - b.position.x);
  return [...ordered, ...remaining];
}

interface MarkdownText {
  absolutePath: string;
  allAttachments: string;
  attachmentFile: string;
  attachmentImage: string;
  attachments: string;
  connectionMap: string;
  codexMode: string;
  codexModeChat: string;
  codexModeGoal: string;
  codexModePlan: string;
  executionRequest: string;
  executionRequestBody: string;
  goalModeRequested: string;
  goalModeRequestedNo: string;
  goalModeRequestedYes: string;
  includedNodes: string;
  noConnections: string;
  noPrompt: string;
  none: string;
  nodeId: string;
  planMode: string;
  planModeDisabled: string;
  planModeEnabled: string;
  planModeRequested: string;
  planModeRequestedNo: string;
  planModeRequestedYes: string;
  project: string;
  projectPath: string;
  prompt: string;
  relativePath: string;
  runMode: string;
  runModeFlow: string;
  runModeNode: string;
  source: string;
  taskTitle: string;
  untitledTask: (index: number) => string;
  warningCycle: string;
}

const markdownTexts: Record<LanguagePreference, MarkdownText> = {
  zh: {
    absolutePath: "绝对路径",
    allAttachments: "所有附件",
    attachmentFile: "文件",
    attachmentImage: "图片",
    attachments: "附件",
    connectionMap: "连接关系",
    codexMode: "Codex 模式",
    codexModeChat: "Chat",
    codexModeGoal: "Goal",
    codexModePlan: "Plan",
    executionRequest: "执行请求",
    executionRequestBody: "请把以下 Canvasight 画布上下文作为事实来源。需要时检查引用文件，并在这个项目中执行请求的工作。",
    goalModeRequested: "请求 Goal 模式",
    goalModeRequestedNo: "否",
    goalModeRequestedYes: "是",
    includedNodes: "包含的节点",
    noConnections: "- 当前范围内没有下游连接。",
    noPrompt: "_未提供提示词正文。_",
    none: "- 无",
    nodeId: "节点 ID",
    planMode: "计划模式",
    planModeDisabled: "关闭",
    planModeEnabled: "开启",
    planModeRequested: "请求计划模式",
    planModeRequestedNo: "否",
    planModeRequestedYes: "是",
    project: "项目",
    projectPath: "项目路径",
    prompt: "提示词",
    relativePath: "相对路径",
    runMode: "运行模式",
    runModeFlow: "当前节点及下游流程",
    runModeNode: "仅当前节点",
    source: "来源",
    taskTitle: "Canvasight 任务",
    untitledTask: (index) => `未命名任务 ${index + 1}`,
    warningCycle: "> 警告：这个流程包含环。节点已按遍历顺序和画布位置排序。\n"
  },
  en: {
    absolutePath: "Absolute path",
    allAttachments: "All Attachments",
    attachmentFile: "File",
    attachmentImage: "Image",
    attachments: "Attachments",
    connectionMap: "Connection Map",
    codexMode: "Codex mode",
    codexModeChat: "Chat",
    codexModeGoal: "Goal",
    codexModePlan: "Plan",
    executionRequest: "Execution Request",
    executionRequestBody: "Use the following Canvasight canvas context as the source of truth. Analyze the task structure, inspect referenced files when needed, and execute the requested work in this project.",
    goalModeRequested: "Goal mode requested",
    goalModeRequestedNo: "no",
    goalModeRequestedYes: "yes",
    includedNodes: "Included Nodes",
    noConnections: "- No downstream connections included.",
    noPrompt: "_No prompt text provided._",
    none: "- None",
    nodeId: "Node ID",
    planMode: "Plan mode",
    planModeDisabled: "disabled",
    planModeEnabled: "enabled",
    planModeRequested: "Plan mode requested",
    planModeRequestedNo: "no",
    planModeRequestedYes: "yes",
    project: "Project",
    projectPath: "Project path",
    prompt: "Prompt",
    relativePath: "Relative path",
    runMode: "Run mode",
    runModeFlow: "Current node and downstream flow",
    runModeNode: "Current node only",
    source: "Source",
    taskTitle: "Canvasight Task",
    untitledTask: (index) => `Untitled task ${index + 1}`,
    warningCycle: "> Warning: This flow contains a cycle. Nodes were ordered by traversal and canvas position.\n"
  }
};

function markdownText(language: LanguagePreference): MarkdownText {
  return markdownTexts[language] ?? markdownTexts.zh;
}

function attachmentLine(attachment: Attachment, text: MarkdownText): string {
  return `- ${attachment.kind === "image" ? text.attachmentImage : text.attachmentFile}: ${attachment.originalName}
  - ${text.relativePath}: \`${attachment.relativePath}\`
  - ${text.absolutePath}: \`${attachment.storedPath}\`
  - ${text.source}: ${attachment.source}`;
}

function normalizeCodexMode(value: unknown, legacyPlanMode = false): CodexMode {
  return value === "chat" || value === "plan" || value === "goal" ? value : legacyPlanMode ? "plan" : "chat";
}

function codexModeLabel(mode: CodexMode, text: MarkdownText): string {
  if (mode === "plan") return text.codexModePlan;
  if (mode === "goal") return text.codexModeGoal;
  return text.codexModeChat;
}

function nodeBlock(node: ScatterNode, index: number, text: MarkdownText): string {
  const title = node.data.title?.trim() || text.untitledTask(index);
  const body = node.data.body?.trim() || text.noPrompt;
  const codexMode = normalizeCodexMode(node.data.codexMode, node.data.planMode);
  const attachments = node.data.attachments.length
    ? node.data.attachments.map((attachment) => attachmentLine(attachment, text)).join("\n")
    : text.none;

  return `## ${index + 1}. ${title}

${text.nodeId}: \`${node.id}\`
${text.codexMode}: ${codexModeLabel(codexMode, text)}

### ${text.prompt}
${body}

### ${text.attachments}
${attachments}`;
}

export function buildMarkdown(
  allNodes: ScatterNode[],
  allEdges: ScatterEdge[],
  startNodeId: string | null,
  runMode: RunMode,
  projectName: string,
  projectPath: string,
  language: LanguagePreference = "zh"
): MarkdownResult {
  const text = markdownText(language);
  const startNode = startNodeId ? allNodes.find((node) => node.id === startNodeId) : null;
  const nodeIds =
    startNode && runMode === "flow"
      ? downstreamNodeIds(startNode.id, allEdges)
      : { ids: new Set(startNode ? [startNode.id] : allNodes.map((node) => node.id)), hasCycle: false };

  const selectedNodes = allNodes.filter((node) => nodeIds.ids.has(node.id));
  const orderedNodes = startNode ? sortFlow(selectedNodes, allEdges, startNode.id) : selectedNodes;
  const selectedIds = new Set(orderedNodes.map((node) => node.id));
  const selectedEdges = allEdges.filter((edge) => selectedIds.has(edge.source) && selectedIds.has(edge.target));
  const attachments = orderedNodes.flatMap((node) => node.data.attachments);
  const imagePaths = attachments.filter((attachment) => attachment.kind === "image").map((attachment) => attachment.storedPath);
  const codexMode = normalizeCodexMode(startNode?.data.codexMode, startNode?.data.planMode);
  const planMode = codexMode === "plan";
  const goalMode = codexMode === "goal";
  const title = startNode?.data.title?.trim() || projectName || "Scatter Flow";
  const modeLabel = runMode === "flow" ? text.runModeFlow : text.runModeNode;

  const connectionMap = selectedEdges.length
    ? selectedEdges
        .map((edge) => {
          const source = allNodes.find((node) => node.id === edge.source);
          const target = allNodes.find((node) => node.id === edge.target);
          return `- ${source?.data.title || edge.source} -> ${target?.data.title || edge.target}`;
        })
        .join("\n")
    : text.noConnections;

  const markdown = `# ${text.taskTitle}: ${title}

${text.project}: ${projectName}
${text.projectPath}: \`${projectPath}\`
${text.runMode}: ${modeLabel}
${text.codexMode}: ${codexModeLabel(codexMode, text)}
${text.planModeRequested}: ${planMode ? text.planModeRequestedYes : text.planModeRequestedNo}
${text.goalModeRequested}: ${goalMode ? text.goalModeRequestedYes : text.goalModeRequestedNo}

${nodeIds.hasCycle ? text.warningCycle : ""}## ${text.executionRequest}
${text.executionRequestBody}

## ${text.includedNodes}
${orderedNodes.map((node, index) => nodeBlock(node, index, text)).join("\n\n")}

## ${text.connectionMap}
${connectionMap}

## ${text.allAttachments}
${attachments.length ? attachments.map((attachment) => attachmentLine(attachment, text)).join("\n") : text.none}
`;

  return {
    markdown,
    nodes: orderedNodes,
    attachments,
    imagePaths,
    codexMode,
    planMode,
    hasCycle: nodeIds.hasCycle
  };
}

export function childCount(nodeId: string, edges: ScatterEdge[]): number {
  return downstreamNodeIds(nodeId, edges).ids.size - 1;
}
