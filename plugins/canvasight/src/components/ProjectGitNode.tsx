import type { KeyboardEvent, ReactElement } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { ProjectGitCommit, ProjectGitTopology } from "../lib/canvasightApi";
import { Icon } from "./ui/icon";

export interface ProjectGitNodeData {
  [key: string]: unknown;
  kind: "commit" | "working-tree";
  language: "zh" | "en";
  commit?: ProjectGitCommit;
  workingTree?: ProjectGitTopology["workingTree"];
  currentBranch: string | null;
  matchesQuery: boolean;
}

export type ProjectGitFlowNode = Node<ProjectGitNodeData, "projectGit">;

export function projectGitCommitTitle(commit: ProjectGitCommit, zh: boolean): string {
  if (!commit.isCanvasightGenerated) return commit.displaySubject || commit.subject || (zh ? "未命名提交" : "Untitled commit");
  const summary = commit.displaySubject?.trim() || "";
  const changedFileCount = summary.match(/(\d+)\s*个文件/u)?.[1];
  if (changedFileCount) return zh
    ? `自动保存：${changedFileCount} 个文件的项目进度`
    : `Auto-save: project progress across ${changedFileCount} files`;
  if (summary) return `${zh ? "自动保存" : "Auto-save"}：${summary}`;
  return zh ? "自动保存：项目进度" : "Auto-save: project progress";
}

function dispatchNodeAction(nodeId: string): void {
  window.dispatchEvent(new CustomEvent("canvasight-project-git-node-action", { detail: { nodeId } }));
}

function formattedTime(value: string, zh: boolean): string {
  return new Intl.DateTimeFormat(zh ? "zh-CN" : "en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function ProjectGitNode({ id, data, selected }: NodeProps<ProjectGitFlowNode>): ReactElement {
  const zh = data.language === "zh";
  const commit = data.commit;
  const workingTree = data.workingTree;
  const isWorkingTree = data.kind === "working-tree";
  const refs = commit?.refs.filter((ref) => ref.kind !== "remote-branch").sort((a, b) => Number(b.current) - Number(a.current)) ?? [];
  const state = isWorkingTree
    ? { className: "working", icon: "marker-code", label: zh ? "正在修改" : "In progress" }
    : commit?.isHead
      ? { className: "head", icon: "target-arrow", label: zh ? "当前位置" : "Current position" }
      : commit?.isOnMain
        ? { className: "main", icon: "check-circle", label: zh ? "已进入 main" : "On main" }
        : { className: "branch", icon: "arrow-curved-right", label: zh ? "尚未合并" : "Not merged" };
  const title = isWorkingTree
    ? (zh ? `${workingTree?.changeCount ?? 0} 个未提交文件` : `${workingTree?.changeCount ?? 0} uncommitted files`)
    : commit ? projectGitCommitTitle(commit, zh) : (zh ? "未命名提交" : "Untitled commit");
  const laneLabel = isWorkingTree
    ? (data.currentBranch || (zh ? "分离 HEAD" : "Detached HEAD"))
    : commit?.isOnMainline
      ? "main"
      : commit?.isCanvasightGenerated
        ? (zh ? "Canvasight 自动保存" : "Canvasight auto-save")
      : commit?.isMerge
        ? (zh ? "合并节点" : "Merge commit")
        : (refs[0]?.name || (zh ? "开发路径" : "Development path"));
  const keyboardSelect = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    dispatchNodeAction(id);
  };

  return (
    <article
      className={`project-git-node ${selected ? "is-selected" : ""} ${commit?.isOnMainline ? "is-mainline" : ""} ${commit?.isMerge ? "is-merge" : ""} ${commit?.isHead ? "is-head" : ""} ${data.matchesQuery ? "" : "is-query-muted"}`}
      tabIndex={0}
      aria-label={`${title}，${state.label}`}
      onKeyDown={keyboardSelect}
    >
      <Handle className="project-git-node-port" type="target" position={Position.Left} isConnectable={false} />
      <header>
        <span className="project-git-node-lane"><span aria-hidden />{laneLabel}</span>
        {refs.slice(0, 2).map((ref) => <code key={`${ref.kind}:${ref.name}`} className={ref.current ? "is-current" : ""}>{ref.name}</code>)}
      </header>
      <div className="project-git-node-card">
        <span className={`project-git-node-state is-${state.className}`}><Icon name={state.icon} size={14} />{state.label}</span>
        <strong>{title}</strong>
        {isWorkingTree ? <span className="project-git-node-meta">{zh
          ? `暂存 ${workingTree?.stagedCount ?? 0} · 未暂存 ${workingTree?.unstagedCount ?? 0} · 新文件 ${workingTree?.untrackedCount ?? 0}`
          : `Staged ${workingTree?.stagedCount ?? 0} · unstaged ${workingTree?.unstagedCount ?? 0} · new ${workingTree?.untrackedCount ?? 0}`}</span> : null}
        {commit ? <footer>
          <code>{commit.shortId}</code>
          <span>{commit.author}</span>
          <span>{formattedTime(commit.committedAt, zh)}</span>
          {commit.historyNodeIds.length ? <span className="project-git-restore-count"><Icon name="shield-lock" size={12} />{commit.historyNodeIds.length} {zh ? "个恢复点" : commit.historyNodeIds.length === 1 ? "restore point" : "restore points"}</span> : null}
        </footer> : null}
      </div>
      <Handle className="project-git-node-port" type="source" position={Position.Right} isConnectable={false} />
    </article>
  );
}
