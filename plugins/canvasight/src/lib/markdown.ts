import type {
  AgentTeamRoleId,
  AgentTeamRunConfig,
  Attachment,
  CodexMode,
  LanguagePreference,
  RunMode,
  ScatterEdge,
  ScatterNode
} from "../../shared/types";

export interface MarkdownResult {
  markdown: string;
  nodes: ScatterNode[];
  attachments: Attachment[];
  imagePaths: string[];
  codexMode: CodexMode;
  planMode: boolean;
  hasCycle: boolean;
  agentTeam: AgentTeamRunConfig;
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
  agentTeam: string;
  agentTeamEnabled: string;
  agentTeamInstruction: string;
  agentTeamRecommendedRoles: string;
  agentTeamReportProtocol: string;
  agentTeamSkill: string;
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
    agentTeam: "Agent Team",
    agentTeamEnabled: "已开启",
    agentTeamInstruction:
      "先判断这次任务实际需要哪些固定角色。若实际启用 Agent Team 且项目缺少 AGENTS.md，或 AGENTS.md 未记录固定 roster / report 协议，先交给 Development Standards Lead 检查；只有用户要求或项目规则允许落地协作规则时才创建或最小更新 AGENTS.md，否则记录限制或先询问。优先复用或恢复项目已有的同角色 agent；只有缺少必要角色时才创建新的固定角色 agent，不要为一次任务创建临时或重复 agent。跨角色沟通必须通过带状态的 agent report 记录；角色接活、阻塞、解决或转交时都要回写 report 状态和队列。",
    agentTeamRecommendedRoles: "建议角色",
    agentTeamReportProtocol: "Report 协议",
    agentTeamSkill: "Skill",
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
    agentTeam: "Agent Team",
    agentTeamEnabled: "enabled",
    agentTeamInstruction:
      "Classify the task first. If Agent Team work is actually used and the project lacks AGENTS.md, or AGENTS.md does not define the fixed roster / report protocol, route that gap to Development Standards Lead first. Create or minimally update AGENTS.md only when the user requested durable collaboration rules or the project rules allow that edit; otherwise record the limitation or ask before writing. Then reuse or resume existing fixed role agents for the project. Create a new fixed role agent only when a needed role is missing, and never create temporary or duplicate one-task agents. Cross-role communication must go through status-bearing agent reports; role agents must update report status and the queue when they accept, block, solve, or hand off work.",
    agentTeamRecommendedRoles: "Recommended roles",
    agentTeamReportProtocol: "Report protocol",
    agentTeamSkill: "Skill",
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

const reportProtocol = {
  root: "agent-reports",
  statuses: ["open", "assigned", "resolved", "archived"]
} satisfies AgentTeamRunConfig["reportProtocol"];

const agentTeamRoleTexts: Record<LanguagePreference, Record<AgentTeamRoleId, { label: string; reason: string }>> = {
  zh: {
    "product-agent": {
      label: "产品 Agent",
      reason: "收束目标、范围、用户流程、验收标准和任务边界。"
    },
    "design-agent": {
      label: "设计 Agent",
      reason: "审查交互、布局、视觉密度、组件语言和可用性。"
    },
    "design-standards-agent": {
      label: "设计规范专家",
      reason: "维护 design.md，沉淀产品和 UI 设计基线。"
    },
    "development-agent": {
      label: "开发 Agent",
      reason: "实现代码、数据结构、MCP/API、持久化和运行时行为。"
    },
    "development-standards-agent": {
      label: "开发规范组长",
      reason: "维护 AGENTS.md、项目命令、工程规则和协作边界。"
    },
    "test-supervisor-agent": {
      label: "测试监督 Agent",
      reason: "维护测试矩阵、构建检查、smoke test 和浏览器可见验证。"
    },
    "customer-support-agent": {
      label: "客服 Agent",
      reason: "维护中英文 README、用户用法、功能说明和排障文档。"
    },
    "project-management-agent": {
      label: "项目管理 Agent",
      reason: "检查 git 状态、提交范围、版本记录和中文规范提交。"
    },
    "skill-expert-agent": {
      label: "Skill 专家",
      reason: "维护 skill 触发边界、SKILL.md 精简度、reference 拆分和校验。"
    }
  },
  en: {
    "product-agent": {
      label: "Product Agent",
      reason: "Clarify goals, scope, user flows, acceptance criteria, and task boundaries."
    },
    "design-agent": {
      label: "Design Agent",
      reason: "Review interaction, layout, visual density, component language, and usability."
    },
    "design-standards-agent": {
      label: "Design Standards Expert",
      reason: "Maintain design.md as the product and UI design baseline."
    },
    "development-agent": {
      label: "Development Agent",
      reason: "Implement code, data structures, MCP/API behavior, persistence, and runtime flows."
    },
    "development-standards-agent": {
      label: "Development Standards Lead",
      reason: "Maintain AGENTS.md, project commands, engineering rules, and collaboration boundaries."
    },
    "test-supervisor-agent": {
      label: "Test Supervisor Agent",
      reason: "Own test matrices, build checks, smoke tests, and browser-visible verification."
    },
    "customer-support-agent": {
      label: "Customer Support Agent",
      reason: "Maintain bilingual README content, usage guidance, feature descriptions, and troubleshooting."
    },
    "project-management-agent": {
      label: "Project Management Agent",
      reason: "Check git status, staging scope, version notes, and conventional commit messages."
    },
    "skill-expert-agent": {
      label: "Skill Expert",
      reason: "Own skill trigger boundaries, concise SKILL.md files, reference splitting, and validation."
    }
  }
};

const roleKeywords: Record<AgentTeamRoleId, string[]> = {
  "product-agent": ["需求", "产品", "范围", "用户", "流程", "目标", "验收", "prd", "product", "scope", "user flow", "feature"],
  "design-agent": ["设计", "交互", "样式", "视觉", "布局", "ui", "ux", "figma", "css", "layout", "interaction", "visual"],
  "design-standards-agent": ["design.md", "设计规范", "设计基线", "design baseline", "design system"],
  "development-agent": ["实现", "开发", "代码", "组件", "接口", "mcp", "api", "持久化", "修复", "bug", "build", "runtime", "react", "typescript"],
  "development-standards-agent": ["agents.md", "agent team", "agent-report", "工程规范", "开发规范", "协作规则", "working rules"],
  "test-supervisor-agent": ["测试", "验证", "复现", "playwright", "smoke", "typecheck", "build", "qa", "test", "verify"],
  "customer-support-agent": ["readme", "文档", "说明", "教程", "用户", "faq", "docs", "troubleshoot"],
  "project-management-agent": ["git", "commit", "提交", "版本", "release", "changelog", "plugin version", "staging"],
  "skill-expert-agent": ["skill", "skill.md", "frontmatter", "trigger", "触发", "reference", "技能"]
};

function disabledAgentTeam(): AgentTeamRunConfig {
  return {
    enabled: false,
    skillName: "canvasight-agent-team",
    recommendedRoles: [],
    reportProtocol
  };
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function nodeSearchText(nodes: ScatterNode[], projectName: string, projectPath: string): string {
  return normalizeSearchText(
    [
      projectName,
      projectPath,
      ...nodes.flatMap((node) => [
        node.id,
        node.data.title,
        node.data.body,
        ...node.data.attachments.flatMap((attachment) => [attachment.originalName, attachment.relativePath, attachment.mime])
      ])
    ].join(" ")
  );
}

function recommendAgentTeamRoles(nodes: ScatterNode[], projectName: string, projectPath: string, language: LanguagePreference): AgentTeamRunConfig["recommendedRoles"] {
  const searchText = nodeSearchText(nodes, projectName, projectPath);
  const roleIds = new Set<AgentTeamRoleId>();

  if (nodes.length > 1) roleIds.add("product-agent");
  for (const [roleId, keywords] of Object.entries(roleKeywords) as Array<[AgentTeamRoleId, string[]]>) {
    if (keywords.some((keyword) => searchText.includes(normalizeSearchText(keyword)))) roleIds.add(roleId);
  }
  if (roleIds.size === 0) roleIds.add("product-agent");

  const roleText = agentTeamRoleTexts[language] ?? agentTeamRoleTexts.zh;
  return Array.from(roleIds).map((id) => ({
    id,
    label: roleText[id].label,
    reason: roleText[id].reason
  }));
}

function buildAgentTeamConfig(
  enabled: boolean,
  nodes: ScatterNode[],
  projectName: string,
  projectPath: string,
  language: LanguagePreference
): AgentTeamRunConfig {
  if (!enabled) return disabledAgentTeam();
  return {
    enabled: true,
    skillName: "canvasight-agent-team",
    recommendedRoles: recommendAgentTeamRoles(nodes, projectName, projectPath, language),
    reportProtocol
  };
}

function agentTeamSection(agentTeam: AgentTeamRunConfig, text: MarkdownText): string {
  if (!agentTeam.enabled) return "";
  const roles = agentTeam.recommendedRoles.length
    ? agentTeam.recommendedRoles.map((role) => `- ${role.label} (\`${role.id}\`): ${role.reason}`).join("\n")
    : text.none;

  return `## ${text.agentTeam}
${text.agentTeam}: ${text.agentTeamEnabled}
${text.agentTeamSkill}: \`${agentTeam.skillName}\`

${text.agentTeamInstruction}

### ${text.agentTeamRecommendedRoles}
${roles}

### ${text.agentTeamReportProtocol}
- ${agentTeam.reportProtocol.root}/open -> assigned -> resolved -> archived
- Use fixed Markdown report templates with frontmatter, owner, created_by, priority, reproduction, impact, related files, expected result, processing result, modified files, verification, and follow-up risks.
`;
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
  language: LanguagePreference = "zh",
  agentTeamEnabled = true
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
  const agentTeam = buildAgentTeamConfig(agentTeamEnabled, orderedNodes, projectName, projectPath, language);

  const markdown = `# ${text.taskTitle}: ${title}

${text.project}: ${projectName}
${text.projectPath}: \`${projectPath}\`
${text.runMode}: ${modeLabel}
${text.codexMode}: ${codexModeLabel(codexMode, text)}
${text.planModeRequested}: ${planMode ? text.planModeRequestedYes : text.planModeRequestedNo}
${text.goalModeRequested}: ${goalMode ? text.goalModeRequestedYes : text.goalModeRequestedNo}

${nodeIds.hasCycle ? text.warningCycle : ""}${agentTeamSection(agentTeam, text)}
## ${text.executionRequest}
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
    agentTeam,
    hasCycle: nodeIds.hasCycle
  };
}

export function childCount(nodeId: string, edges: ScatterEdge[]): number {
  return downstreamNodeIds(nodeId, edges).ids.size - 1;
}
