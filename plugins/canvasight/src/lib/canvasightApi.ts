import type {
  Attachment,
  AttachmentInput,
  CodexMode,
  LanguagePreference,
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

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed: ${response.status}`);
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
  }
};
