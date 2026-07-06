import { nodeTemplateLimit } from "../../shared/types";
import type {
  AgentTeamRunConfig,
  Attachment,
  AttachmentInput,
  CodexMode,
  LanguagePreference,
  NodeTemplate,
  NodeTemplateInput,
  OpenProjectResult,
  RunMode,
  ScatterDocument
} from "../../shared/types";

export interface SessionInfo {
  language: LanguagePreference;
  projectPath: string | null;
  sessionId: string;
}

export interface RunPayload {
  attachments: Attachment[];
  agentTeam: AgentTeamRunConfig;
  codexMode: CodexMode;
  effort: string;
  imagePaths: string[];
  markdown: string;
  nodeIds: string[];
  planMode: boolean;
  projectPath: string;
  runMode: RunMode;
  sessionId: string;
  threadName: string;
}

function sessionIdFromUrl(): string {
  return new URLSearchParams(window.location.search).get("sessionId") || "local";
}

function sessionTokenFromUrl(): string {
  return new URLSearchParams(window.location.search).get("token") || "";
}

const templateStorageKey = "canvasight.nodeTemplates";

class CanvasightApiError extends Error {
  code?: string;
  payload: unknown;
  status: number;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "CanvasightApiError";
    this.status = status;
    this.payload = payload;
    if (payload && typeof payload === "object" && "code" in payload && typeof payload.code === "string") {
      this.code = payload.code;
    }
  }
}

export class TemplateLimitError extends Error {
  currentCount: number;
  maxTemplates: number;

  constructor(maxTemplates = nodeTemplateLimit, currentCount = nodeTemplateLimit) {
    super(`Template limit reached (${maxTemplates})`);
    this.name = "TemplateLimitError";
    this.maxTemplates = maxTemplates;
    this.currentCount = currentCount;
  }
}

export function isTemplateLimitError(error: unknown): error is TemplateLimitError {
  return error instanceof TemplateLimitError || (error instanceof CanvasightApiError && error.status === 409 && error.code === "template_limit_reached");
}

function createTemplateId(): string {
  return typeof crypto?.randomUUID === "function" ? crypto.randomUUID() : `template-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeLocalAttachment(value: unknown): Attachment | null {
  if (!value || typeof value !== "object") return null;
  const attachment = value as Partial<Attachment>;
  return {
    id: typeof attachment.id === "string" && attachment.id ? attachment.id : createTemplateId(),
    kind: attachment.kind === "image" ? "image" : "file",
    source: attachment.source === "drop" || attachment.source === "paste" || attachment.source === "clipboard" ? attachment.source : "upload",
    originalName: typeof attachment.originalName === "string" && attachment.originalName ? attachment.originalName : "attachment",
    storedPath: typeof attachment.storedPath === "string" ? attachment.storedPath : "",
    relativePath: typeof attachment.relativePath === "string" ? attachment.relativePath : "",
    fileUrl: typeof attachment.fileUrl === "string" ? attachment.fileUrl : "",
    mime: typeof attachment.mime === "string" && attachment.mime ? attachment.mime : "application/octet-stream",
    size: typeof attachment.size === "number" && Number.isFinite(attachment.size) ? attachment.size : 0,
    createdAt: typeof attachment.createdAt === "string" && attachment.createdAt ? attachment.createdAt : new Date().toISOString()
  };
}

function normalizeLocalTemplate(value: unknown): NodeTemplate | null {
  if (!value || typeof value !== "object") return null;
  const template = value as Partial<NodeTemplate>;
  if (typeof template.body !== "string" || !template.body.trim()) return null;
  const now = new Date().toISOString();

  return {
    id: typeof template.id === "string" && template.id ? template.id : createTemplateId(),
    title: typeof template.title === "string" && template.title.trim() ? template.title.trim() : template.body.trim().slice(0, 40),
    body: template.body,
    attachments: Array.isArray(template.attachments)
      ? template.attachments.map(normalizeLocalAttachment).filter((attachment): attachment is Attachment => Boolean(attachment))
      : [],
    createdAt: typeof template.createdAt === "string" && template.createdAt ? template.createdAt : now,
    updatedAt: typeof template.updatedAt === "string" && template.updatedAt ? template.updatedAt : now
  };
}

function loadLocalTemplates(): NodeTemplate[] {
  try {
    const raw = window.localStorage.getItem(templateStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeLocalTemplate).filter((template): template is NodeTemplate => Boolean(template));
  } catch {
    return [];
  }
}

function saveLocalTemplates(templates: NodeTemplate[]): void {
  window.localStorage.setItem(templateStorageKey, JSON.stringify(templates));
}

function saveLocalTemplate(input: NodeTemplateInput, options: { replaceOldest?: boolean } = {}): NodeTemplate {
  const now = new Date().toISOString();
  const body = input.body.trim();
  if (!body) throw new Error("Template body is required");
  const existingTemplates = loadLocalTemplates();
  if (existingTemplates.length >= nodeTemplateLimit && !options.replaceOldest) {
    throw new TemplateLimitError(nodeTemplateLimit, existingTemplates.length);
  }
  const template: NodeTemplate = {
    id: createTemplateId(),
    title: input.title.trim() || body.slice(0, 40),
    body,
    attachments: (input.attachments ?? []).map((attachment) => ({ ...attachment })),
    createdAt: now,
    updatedAt: now
  };
  const templates = options.replaceOldest ? [template, ...existingTemplates.slice(0, Math.max(0, existingTemplates.length - 1))] : [template, ...existingTemplates];
  saveLocalTemplates(templates);
  return template;
}

function deleteLocalTemplate(templateId: string): void {
  saveLocalTemplates(loadLocalTemplates().filter((template) => template.id !== templateId));
}

function shouldUseLocalTemplateStore(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("Failed to fetch") ||
    message.includes("API route not found") ||
    message.includes("Unexpected token") ||
    message.includes("404")
  );
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = sessionTokenFromUrl();
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { "x-canvasight-token": token } : {}),
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    let payload: unknown = null;
    let message = detail || `Request failed: ${response.status}`;
    try {
      payload = detail ? JSON.parse(detail) : null;
      if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
        message = payload.error;
      }
    } catch {
      payload = null;
    }
    throw new CanvasightApiError(message, response.status, payload);
  }
  return response.json() as Promise<T>;
}

async function fileInputToPayload(input: AttachmentInput): Promise<{
  dataBase64?: string;
  mime?: string;
  name: string;
  path?: string;
  source: AttachmentInput["source"];
}> {
  if (input.bytes) {
    const bytes = new Uint8Array(input.bytes);
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return {
      dataBase64: btoa(binary),
      mime: input.mime,
      name: input.name,
      source: input.source
    };
  }

  return {
    mime: input.mime,
    name: input.name,
    path: input.path,
    source: input.source
  };
}

export const canvasightApi = {
  sessionId: sessionIdFromUrl(),
  token: sessionTokenFromUrl(),

  getSession(): Promise<SessionInfo> {
    return requestJson<SessionInfo>(`/api/sessions/${this.sessionId}`);
  },

  openProject(projectPath: string): Promise<OpenProjectResult> {
    return requestJson<OpenProjectResult>(`/api/sessions/${this.sessionId}/open-project`, {
      method: "POST",
      body: JSON.stringify({ projectPath })
    });
  },

  saveDocument(projectPath: string, document: ScatterDocument): Promise<ScatterDocument> {
    return requestJson<ScatterDocument>(`/api/sessions/${this.sessionId}/document`, {
      method: "POST",
      body: JSON.stringify({ document, projectPath })
    });
  },

  async saveAttachments(projectPath: string, inputs: AttachmentInput[]): Promise<Attachment[]> {
    const files = await Promise.all(inputs.map(fileInputToPayload));
    return requestJson<Attachment[]>(`/api/sessions/${this.sessionId}/attachments`, {
      method: "POST",
      body: JSON.stringify({ files, projectPath })
    });
  },

  run(payload: RunPayload): Promise<{ status: "queued" }> {
    return requestJson<{ status: "queued" }>(`/api/sessions/${this.sessionId}/run`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  showInFolder(targetPath: string): Promise<void> {
    return requestJson<void>(`/api/reveal`, {
      method: "POST",
      body: JSON.stringify({ targetPath })
    });
  },

  async listTemplates(): Promise<NodeTemplate[]> {
    try {
      return await requestJson<NodeTemplate[]>(`/api/templates`);
    } catch (error) {
      if (shouldUseLocalTemplateStore(error)) return loadLocalTemplates();
      throw error;
    }
  },

  async saveTemplate(template: NodeTemplateInput, options: { replaceOldest?: boolean } = {}): Promise<NodeTemplate> {
    try {
      return await requestJson<NodeTemplate>(`/api/templates`, {
        method: "POST",
        body: JSON.stringify({ template, replaceOldest: Boolean(options.replaceOldest) })
      });
    } catch (error) {
      if (shouldUseLocalTemplateStore(error)) return saveLocalTemplate(template, options);
      throw error;
    }
  },

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await requestJson<{ status: "deleted"; templateId: string }>(`/api/templates/${encodeURIComponent(templateId)}`, {
        method: "DELETE"
      });
    } catch (error) {
      if (shouldUseLocalTemplateStore(error)) {
        deleteLocalTemplate(templateId);
        return;
      }
      throw error;
    }
  }
};
