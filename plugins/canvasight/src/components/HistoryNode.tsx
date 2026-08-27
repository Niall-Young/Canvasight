import type { KeyboardEvent, ReactElement } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { ProjectHistoryHostAction, ProjectHistoryNode } from "../lib/canvasightApi";
import { checkpointSourceSummary } from "./projectHistoryFeatureMap";
import { Icon } from "./ui/icon";

export type HistoryNodeAction = "details" | "continue" | "integrate";

export interface HistoryNodeActionDetail {
  action: HistoryNodeAction;
  nodeId: string;
}

type HistoryNodeData = ProjectHistoryNode & {
  demoMode?: boolean;
  featureName?: string;
  featureStatus?: "active" | "abandoned" | "merged";
  language?: "zh" | "en";
  processCount?: number;
  hostAction?: ProjectHistoryHostAction;
  mainBranch?: string | null;
  mainCommit?: string | null;
  featureMap?: boolean;
  featureOutcome?: string;
  checkpointCount?: number;
  dependencyName?: string | null;
  featureMapStatus?: "developing" | "saved" | "integrated" | "abandoned";
  projectRoot?: boolean;
};

export type HistoryFlowNode = Node<HistoryNodeData, "history">;

function sourceLabel(source: string, zh: boolean): string {
  if (source === "codex") return "Codex";
  if (source === "mixed") return zh ? "Codex + 其他修改" : "Codex + other edits";
  if (source === "external") return zh ? "项目变化" : "Project change";
  if (source === "portable") return zh ? "跨设备记录" : "Cross-device record";
  return source;
}

function dispatchNodeAction(nodeId: string, action: HistoryNodeAction): void {
  window.dispatchEvent(new CustomEvent<HistoryNodeActionDetail>("canvasight-history-node-action", {
    detail: { action, nodeId }
  }));
}

function statusPresentation(data: HistoryNodeData, zh: boolean): { className: string; icon: string; label: string } {
  if (data.featureMapStatus === "developing") return { className: "warning", icon: "marker-code", label: zh ? "正在开发" : "In development" };
  if (data.featureMapStatus === "integrated") return { className: "merged", icon: "check-circle", label: zh ? "已整合到主线" : "Integrated into main" };
  if (data.featureMapStatus === "abandoned") return { className: "quiet", icon: "history-off", label: zh ? "已暂停" : "Paused" };
  if (data.featureMapStatus === "saved") return { className: "protected", icon: "shield-lock", label: zh ? "进度已保存" : "Progress saved" };
  if (data.featureStatus === "abandoned") return { className: "quiet", icon: "history-off", label: zh ? "已放弃" : "Abandoned" };
  if (data.merged) return { className: "merged", icon: "check-circle", label: zh ? "已合并" : "Merged" };
  if (data.agentCheck?.status === "failed") return { className: "warning", icon: "warning", label: zh ? "验收未通过" : "Check failed" };
  if (data.confirmed) return { className: "confirmed", icon: "check-circle", label: zh ? "已确认" : "Confirmed" };
  if (data.kind === "baseline" && data.featureMap) return { className: "protected", icon: "shield-lock", label: zh ? "开始记录" : "Recording starts" };
  if (data.kind === "baseline") return data.mainCommit && data.commit === data.mainCommit
    ? { className: "protected", icon: "shield-lock", label: zh ? "main 起点" : "main baseline" }
    : { className: "protected", icon: "shield-lock", label: zh ? "保护起点" : "Protection baseline" };
  return { className: "protected", icon: "shield-lock", label: zh ? "代码已保存" : "Code saved" };
}

export function HistoryNode({ data, selected }: NodeProps<HistoryFlowNode>): ReactElement {
  const zh = data.language !== "en";
  const incomplete = data.coverage?.complete === false;
  const state = statusPresentation(data, zh);
  const baselineIsMain = data.kind === "baseline" && data.mainCommit && data.commit === data.mainCommit;
  const kindLabel = data.kind === "baseline"
    ? data.featureMap
      ? (zh ? "项目起点" : "Project start")
      : (baselineIsMain ? (zh ? "Git 主线 · main" : "Git main · main") : (zh ? "项目保护起点" : "Project baseline"))
    : data.featureMap
      ? data.projectRoot ? (zh ? "项目" : "Project") : (zh ? "功能" : "Feature")
      : `${zh ? "进度" : "Progress"} · ${data.featureName || (zh ? "待归类" : "Unclassified")}`;
  const time = new Intl.DateTimeFormat(zh ? "zh-CN" : "en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(data.occurredAt));
  const originLabel = data.featureMap && data.kind !== "baseline" ? `，${checkpointSourceSummary(data, data.language ?? "zh")}` : "";
  const label = `${kindLabel}，${data.featureMap ? `${data.featureName}，${data.featureOutcome || data.summary}` : data.summary}，${state.label}${originLabel}${incomplete ? (zh ? "，部分本地文件未包含" : ", some local files are not included") : ""}`;

  const selectFromKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    dispatchNodeAction(data.id, "details");
  };

  return (
    <article
      className={`history-node ${selected ? "is-selected" : ""} ${data.merged ? "is-merged" : ""} ${data.featureStatus === "abandoned" ? "is-abandoned" : ""}`}
      aria-label={label}
      tabIndex={0}
      data-kind={data.kind}
      data-source={data.source}
      data-incomplete={incomplete ? "true" : "false"}
      onKeyDown={selectFromKeyboard}
    >
      <Handle className="history-node-port history-node-port-left" type="target" position={Position.Left} isConnectable={false} />
      <header className="history-node-titlebar">
        <span className="history-node-feature"><span className="history-node-feature-dot" aria-hidden="true" />{kindLabel}</span>
        <span className="history-node-source">{data.featureMap ? data.kind === "baseline" ? (zh ? "项目进度" : "Project progress") : `${data.checkpointCount ?? 1} ${zh ? "个自动恢复点" : "auto checkpoints"}` : sourceLabel(data.source, zh)}</span>
      </header>
      <div className="history-node-card">
        {data.featureMap && !data.projectRoot && data.kind !== "baseline" && data.featureMapStatus !== "integrated" ? <div className="history-node-actions" aria-label={zh ? "功能操作" : "Feature actions"}>
          <button type="button" onClick={(event) => { event.stopPropagation(); dispatchNodeAction(data.id, "continue"); }}><Icon name="arrow-curved-right" size={14} />{zh ? "继续开发" : "Continue"}</button>
          <button type="button" className="is-primary" onClick={(event) => { event.stopPropagation(); dispatchNodeAction(data.id, "integrate"); }}><Icon name="check-circle" size={14} />{zh ? "整合到项目" : "Integrate into project"}</button>
        </div> : null}
        <div className="history-node-card-topline">
          <span className={`history-node-state is-${state.className}`}><Icon name={state.icon} size={14} />{state.label}</span>
          {incomplete ? <span className="history-node-coverage-warning"><Icon name="warning" size={13} />{zh ? "有未托管文件" : "Files omitted"}</span> : null}
        </div>
        <strong className="history-node-summary">{data.featureMap ? data.featureName : data.summary}</strong>
        <span className="history-node-outcome">{data.featureMap ? (data.featureOutcome || data.summary) : (zh ? "从这里开始记录项目变化" : "Project changes are recorded from here")}</span>
        <footer className="history-node-footer">
          <span>{time}</span>
          {data.featureMap && data.kind !== "baseline" ? <span>{checkpointSourceSummary(data, data.language ?? "zh")}</span> : null}
          {data.featureMap && data.dependencyName ? <span className="history-node-dependency">{zh ? "依赖" : "Depends on"} · {data.dependencyName}</span> : null}
          {!data.featureMap && data.gitBranch ? <span className="history-node-git-branch">{zh ? "开发分支" : "Branch"} · {data.gitBranch}</span> : null}
          {!data.featureMap && data.processCount && data.processCount > 1 ? <span className="history-node-count">+{data.processCount - 1} {zh ? "个过程点" : "process"}</span> : null}
        </footer>
      </div>
      <Handle className="history-node-port history-node-port-right" type="source" position={Position.Right} isConnectable={false} />
    </article>
  );
}
