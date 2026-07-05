export type AttachmentKind = "image" | "file";
export type AttachmentSource = "upload" | "drop" | "paste" | "clipboard";
export type RunMode = "flow" | "node";
export type CodexMode = "chat" | "plan" | "goal";
export type EffortLevel = "low" | "medium" | "high" | "xhigh";
export type LanguagePreference = "zh" | "en";
export type ThemePreference = "system" | "light" | "dark";
export type AssistantProvider = "codex" | "claude-cli";
export type AgentTeamRoleId =
  | "product-agent"
  | "design-agent"
  | "design-standards-agent"
  | "development-agent"
  | "development-standards-agent"
  | "test-supervisor-agent"
  | "customer-support-agent"
  | "project-management-agent"
  | "skill-expert-agent";
export type AppUpdateStatus = "idle" | "checking" | "available" | "downloading" | "downloaded" | "installing" | "not-available" | "error";
export type AppUpdateErrorCode = "development-mode" | "check-failed" | "install-failed";
export const achievementIds = [
  "oneshot",
  "gunslinger",
  "three-musketeers",
  "codex-rookie",
  "double-take",
  "idea-overlord",
  "master-builder",
  "gone-in-a-flash"
] as const;
export type AchievementId = (typeof achievementIds)[number];

export interface AppSettings {
  themePreference: ThemePreference;
  language: LanguagePreference;
  translucentBackground: boolean;
  assistantProvider: AssistantProvider;
  assistantProviderOnboardingCompleted: boolean;
  agentTeamEnabled: boolean;
}

export const defaultAppSettings = {
  themePreference: "system",
  language: "zh",
  translucentBackground: true,
  assistantProvider: "codex",
  assistantProviderOnboardingCompleted: false,
  agentTeamEnabled: true
} satisfies AppSettings;

export interface AchievementState {
  unlockedAt: Partial<Record<AchievementId, string>>;
  projectPaths: string[];
  usageDates: string[];
}

export const defaultAchievementState = {
  unlockedAt: {},
  projectPaths: [],
  usageDates: []
} satisfies AchievementState;

export interface ScatterProjectInfo {
  missing?: boolean;
  name: string;
  path: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  kind: AttachmentKind;
  source: AttachmentSource;
  originalName: string;
  storedPath: string;
  relativePath: string;
  fileUrl: string;
  mime: string;
  size: number;
  createdAt: string;
}

export interface AttachmentInput {
  name: string;
  mime?: string;
  source: AttachmentSource;
  path?: string;
  bookmark?: string;
  bytes?: ArrayBuffer;
}

export interface ScatterNodeData extends Record<string, unknown> {
  title: string;
  body: string;
  attachments: Attachment[];
  codexMode: CodexMode;
  effort: EffortLevel;
  planMode: boolean;
  runMode: RunMode;
  lastRunAt?: string;
}

export interface NodeTemplate {
  id: string;
  title: string;
  body: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export type NodeTemplateInput = Pick<NodeTemplate, "title" | "body" | "attachments">;

export interface ScatterNode {
  id: string;
  type: "task";
  position: { x: number; y: number };
  width?: number;
  height?: number;
  selected?: boolean;
  data: ScatterNodeData;
}

export interface ScatterEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ScatterPage {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  viewport: { x: number; y: number; zoom: number };
  nodes: ScatterNode[];
  edges: ScatterEdge[];
}

export interface ScatterDocument {
  version: 1;
  projectName: string;
  updatedAt: string;
  activePageId: string;
  pages: ScatterPage[];
  viewport: { x: number; y: number; zoom: number };
  nodes: ScatterNode[];
  edges: ScatterEdge[];
}

export interface OpenProjectResult {
  project: ScatterProjectInfo;
  document: ScatterDocument;
}

export interface AssistantRunInput {
  provider: AssistantProvider;
  projectPath: string;
  threadName: string;
  markdown: string;
  imagePaths: string[];
  effort: EffortLevel;
  codexMode: CodexMode;
  planMode: boolean;
}

export interface AgentTeamRoleRecommendation {
  id: AgentTeamRoleId;
  label: string;
  reason: string;
}

export interface AgentTeamRunConfig {
  enabled: boolean;
  skillName: "canvasight-agent-team";
  recommendedRoles: AgentTeamRoleRecommendation[];
  reportProtocol: {
    root: "agent-reports";
    statuses: ["open", "assigned", "resolved", "archived"];
  };
}

export interface AssistantRunResult {
  provider: AssistantProvider;
  threadId: string;
  turnId?: string;
  cwd: string;
}

export interface AppUpdateState {
  status: AppUpdateStatus;
  currentVersion: string;
  availableVersion?: string;
  downloadedVersion?: string;
  progressPercent?: number;
  errorCode?: AppUpdateErrorCode;
  errorMessage?: string;
  isPackaged: boolean;
  canCheck: boolean;
  canInstall: boolean;
}

export type CodexRunInput = Omit<AssistantRunInput, "provider">;
export type CodexRunResult = Omit<AssistantRunResult, "provider">;
