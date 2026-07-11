import { Fragment, useEffect, useState, type DragEvent, type ReactElement, type ReactNode } from "react";
import { nodeTemplateLimit, type Attachment, type NodeTemplate, type RunMode, type ScatterEdge, type ScatterNode } from "../../shared/types";
import { useI18n } from "../lib/i18n";
import { canvasightApi } from "../lib/canvasightApi";
import { childCount } from "../lib/markdown";
import type { Translate } from "../lib/translations";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";
import { Segmented, SegmentedItem } from "./ui/segmented";
import { TooltipAnchor } from "./ui/tooltip";
import { TaskItem } from "./ui/task-item";
import type { DrawerMode } from "../store/scatterStore";

interface RightDrawerProps {
  drawer: DrawerMode | null;
  nodes: ScatterNode[];
  edges: ScatterEdge[];
  templates: NodeTemplate[];
  templateSearch: string;
  selectedNodeId: string | null;
  markdownNodeId: string | null;
  markdown: string;
  markdownAttachments: Attachment[];
  currentRunMode: RunMode;
  onLocateNode: (nodeId: string, mode: RunMode) => void;
  onSelectNode: (nodeId: string, mode: RunMode) => void;
  onRunNode: (nodeId: string, mode: RunMode) => void;
  onDeleteTemplate: (templateId: string) => void;
  onTemplateSearchChange: (value: string) => void;
  onTemplateDragStart: (template: NodeTemplate, event: DragEvent<HTMLElement>) => void;
  onTemplateDragEnd: () => void;
}

type MarkdownView = "source" | "preview";
type TaskListEntry = {
  canRun: boolean;
  flow: boolean;
  id: string;
  meta: string;
  mode: RunMode;
  node: ScatterNode;
  nodeCount: number;
};

function taskListEntries(nodes: ScatterNode[], edges: ScatterEdge[], t: Translate): TaskListEntry[] {
  const incomingNodeIds = new Set(edges.map((edge) => edge.target));
  const outgoingNodeIds = new Set(edges.map((edge) => edge.source));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return nodes.flatMap((node) => {
    const entries: TaskListEntry[] = [];
    const isFlowStart = outgoingNodeIds.has(node.id) && !incomingNodeIds.has(node.id);
    const isStandaloneNode = !incomingNodeIds.has(node.id) && !outgoingNodeIds.has(node.id);
    const hasPrompt = node.data.body.trim().length > 0;

    if (isFlowStart) {
      const downstreamCount = childCount(node.id, edges);
      const nodeCount = downstreamCount + 1;
      const downstreamNodeIds = new Set<string>([node.id]);
      const visit = (nodeId: string): void => {
        for (const edge of edges.filter((item) => item.source === nodeId)) {
          if (downstreamNodeIds.has(edge.target)) continue;
          downstreamNodeIds.add(edge.target);
          visit(edge.target);
        }
      };
      visit(node.id);

      entries.push({
        canRun: Array.from(downstreamNodeIds).some((nodeId) => (nodeById.get(nodeId)?.data.body.trim().length ?? 0) > 0),
        flow: true,
        id: `flow-${node.id}`,
        meta: t("drawer.flowStartMeta", { count: nodeCount }),
        mode: "flow",
        node,
        nodeCount
      });
    }

    if (!isStandaloneNode) return entries;

    entries.push({
      canRun: hasPrompt,
      flow: false,
      id: `node-${node.id}`,
      meta: hasPrompt ? t("drawer.canSend") : t("drawer.notEdited"),
      mode: "flow",
      node,
      nodeCount: 1
    });

    return entries;
  });
}

function inlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={index}>{part}</Fragment>;
  });
}

function isTableLine(line: string): boolean {
  return line.trim().startsWith("|") && line.trim().endsWith("|");
}

function isTableDivider(line: string): boolean {
  return /^\|?[\s:-]+\|[\s|:-]*$/.test(line.trim());
}

function tableCells(line: string): string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}

function MarkdownPreview({ markdown }: { markdown: string }): ReactElement {
  const blocks: ReactElement[] = [];
  const lines = markdown.split(/\r?\n/);
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      blocks.push(
        <pre className="markdown-preview-code" key={`code-${index}`}>
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      continue;
    }

    if (isTableLine(line) && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
      const headers = tableCells(line);
      const rows: string[][] = [];
      index += 2;
      while (index < lines.length && isTableLine(lines[index])) {
        rows.push(tableCells(lines[index]));
        index += 1;
      }
      blocks.push(
        <table className="markdown-preview-table" key={`table-${index}`}>
          <thead>
            <tr>
              {headers.map((cell, cellIndex) => (
                <th key={cellIndex}>{inlineMarkdown(cell)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map((_, cellIndex) => (
                  <td key={cellIndex}>{inlineMarkdown(row[cellIndex] || "")}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      const level = trimmed.match(/^#+/)?.[0].length || 1;
      const content = trimmed.replace(/^#{1,6}\s+/, "");
      const Heading = `h${Math.min(level, 4)}` as "h1" | "h2" | "h3" | "h4";
      blocks.push(<Heading key={`heading-${index}`}>{inlineMarkdown(content)}</Heading>);
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`}>
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{inlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    const paragraphLines = [trimmed];
    index += 1;
    while (index < lines.length) {
      const next = lines[index].trim();
      if (!next || /^#{1,6}\s+/.test(next) || /^[-*]\s+/.test(next) || next.startsWith("```") || isTableLine(next)) break;
      paragraphLines.push(next);
      index += 1;
    }
    blocks.push(<p key={`p-${index}`}>{inlineMarkdown(paragraphLines.join(" "))}</p>);
  }

  return <div className="markdown-preview">{blocks}</div>;
}

function drawerLabel(drawer: DrawerMode, t: Translate): string {
  if (drawer === "tasks") return t("drawer.tasks");
  if (drawer === "templates") return t("drawer.templates");
  return t("drawer.markdown");
}

function templatePreview(template: NodeTemplate): string {
  return template.body.replace(/\s+/g, " ").trim();
}

export function RightDrawer({
  drawer,
  nodes,
  edges,
  templates,
  templateSearch,
  selectedNodeId,
  markdownNodeId,
  markdown,
  markdownAttachments,
  currentRunMode,
  onLocateNode,
  onSelectNode,
  onRunNode,
  onDeleteTemplate,
  onTemplateSearchChange,
  onTemplateDragStart,
  onTemplateDragEnd
}: RightDrawerProps): ReactElement {
  const { t } = useI18n();
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "preparing">("idle");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [markdownView, setMarkdownView] = useState<MarkdownView>("source");
  const [renderedDrawer, setRenderedDrawer] = useState<DrawerMode>("tasks");

  useEffect(() => {
    if (drawer) setRenderedDrawer(drawer);
  }, [drawer]);

  const isOpen = drawer !== null;
  const selectedNode = nodes.find((node) => node.id === selectedNodeId);
  const markdownNode = nodes.find((node) => node.id === markdownNodeId);
  const taskEntries = taskListEntries(nodes, edges, t);
  const flowStartNodeIds = new Set(taskEntries.filter((entry) => entry.flow).map((entry) => entry.node.id));
  const normalizedTemplateSearch = templateSearch.trim().toLowerCase();
  const filteredTemplates = templates.filter((template) => {
    if (!normalizedTemplateSearch) return true;
    return `${template.title} ${template.body}`.toLowerCase().includes(normalizedTemplateSearch);
  });
  async function downloadMarkdown(): Promise<void> {
    setDownloadError(null);
    setDownloadNotice(null);
    setDownloadStatus("preparing");
    try {
      const exported = await canvasightApi.exportMarkdown(
        markdown,
        markdownNode?.data.title || selectedNode?.data.title || "scatter-prompt",
        markdownAttachments
      );
      await canvasightApi.showInFolder(exported.targetPath);
      setDownloadNotice(t("drawer.downloadSaved", { fileName: exported.fileName }));
    } catch {
      setDownloadError(t("drawer.downloadFailed"));
    } finally {
      setDownloadStatus("idle");
    }
  }

  const hasMarkdownAttachments = markdownAttachments.length > 0;
  const downloadLabel =
    downloadStatus === "preparing"
      ? t("drawer.preparingDownload")
      : hasMarkdownAttachments
        ? t("drawer.downloadMarkdownBundle")
        : t("drawer.downloadMarkdown");

  return (
    <aside
      className={`right-drawer is-${renderedDrawer} ${isOpen ? "is-open" : "is-collapsed"}`}
      aria-hidden={!isOpen}
      aria-label={drawerLabel(renderedDrawer, t)}
      inert={!isOpen}
    >
      {renderedDrawer === "tasks" ? (
        <div className="task-sidebar">
          <p className="right-sidebar-title">{t("drawer.tasks")}</p>
          <div className="task-list">
            {nodes.length === 0 ? (
              <p className="empty-copy">{t("drawer.noTasks")}</p>
            ) : (
              taskEntries.map((entry) => {
                const isActive = entry.node.id === selectedNodeId && (entry.mode === currentRunMode || !flowStartNodeIds.has(entry.node.id));

                return (
                  <TaskItem
                    key={entry.id}
                    canRun={entry.canRun}
                    className={isActive ? "is-active" : undefined}
                    flow={entry.flow}
                    meta={entry.meta}
                    nodeCount={entry.nodeCount}
                    taskName={entry.node.data.title || t("drawer.unnamedTask")}
                    onClick={() => onSelectNode(entry.node.id, entry.mode)}
                    onLocate={() => onLocateNode(entry.node.id, entry.mode)}
                    onPlay={() => onRunNode(entry.node.id, entry.mode)}
                  />
                );
              })
            )}
          </div>
        </div>
      ) : renderedDrawer === "templates" ? (
        <div className="template-sidebar">
          <div className="template-sidebar-heading">
            <p className="right-sidebar-title">{t("drawer.templates")}</p>
            <span className={`template-capacity ${templates.length >= nodeTemplateLimit ? "is-full" : ""}`}>
              {t("drawer.templateCapacity", { count: templates.length, max: nodeTemplateLimit })}
            </span>
          </div>
          <label className="template-search">
            <Icon name="search" size={16} />
            <input
              value={templateSearch}
              placeholder={t("drawer.templateSearchPlaceholder")}
              aria-label={t("drawer.templateSearchPlaceholder")}
              onChange={(event) => onTemplateSearchChange(event.currentTarget.value)}
            />
          </label>
          <div className="template-list">
            {templates.length === 0 ? (
              <p className="empty-copy">{t("drawer.noTemplates")}</p>
            ) : filteredTemplates.length === 0 ? (
              <p className="empty-copy">{t("drawer.noTemplateResults")}</p>
            ) : (
              filteredTemplates.map((template) => (
                <article
                  key={template.id}
                  className="template-item"
                  draggable
                  aria-label={t("drawer.dragTemplate")}
                  onDragStart={(event) => onTemplateDragStart(template, event)}
                  onDragEnd={onTemplateDragEnd}
                >
                  <div className="template-item-main">
                    <div className="template-item-heading">
                      <strong>{template.title || t("drawer.unnamedTemplate")}</strong>
                      {template.attachments.length ? <span>{t("drawer.templateAttachmentCount", { count: template.attachments.length })}</span> : null}
                    </div>
                    <p>{templatePreview(template)}</p>
                  </div>
                  <IconButton
                    className="template-delete-button"
                    filled={false}
                    icon="trash"
                    size="md"
                    aria-label={t("drawer.deleteTemplate")}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onDeleteTemplate(template.id);
                    }}
                  />
                </article>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="markdown-pane">
          <div className="markdown-sidebar-heading">
            <Segmented aria-label={t("drawer.previewMode")}>
              <SegmentedItem
                icon="marker-code"
                selected={markdownView === "source"}
                aria-label={t("drawer.markdownSource")}
                onClick={() => setMarkdownView("source")}
              />
              <SegmentedItem
                icon="notebook-narrow"
                selected={markdownView === "preview"}
                aria-label={t("drawer.markdownPreview")}
                onClick={() => setMarkdownView("preview")}
              />
            </Segmented>
            <div className="markdown-actions">
              <TooltipAnchor label={downloadLabel} side="bottom" align="end">
                <IconButton
                  className="topbar-icon-button"
                  filled={false}
                  icon="download"
                  size="md"
                  aria-busy={downloadStatus === "preparing"}
                  aria-label={downloadLabel}
                  disabled={!markdown || downloadStatus === "preparing"}
                  onClick={() => void downloadMarkdown()}
                />
              </TooltipAnchor>
            </div>
          </div>
          {markdownView === "source" ? (
            <pre className="markdown-source">{markdown || t("drawer.markdownPlaceholder")}</pre>
          ) : markdown ? (
            <MarkdownPreview markdown={markdown} />
          ) : (
            <div className="markdown-preview">
              <p>{t("drawer.markdownPlaceholder")}</p>
            </div>
          )}
          {downloadError ? <p className="markdown-download-error" role="alert">{downloadError}</p> : null}
          {downloadNotice ? <p className="markdown-download-notice" role="status">{downloadNotice}</p> : null}
        </div>
      )}
    </aside>
  );
}
