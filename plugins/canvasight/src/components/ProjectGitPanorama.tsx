import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Background, PanOnScrollMode, ReactFlow, applyNodeChanges, type Edge, type NodeChange, type NodeTypes, type ReactFlowInstance } from "@xyflow/react";
import * as RadixDialog from "@radix-ui/react-dialog";
import type { ProjectGitCommit, ProjectHistoryNode, ProjectHistoryResponse } from "../lib/canvasightApi";
import { HistoryNode } from "./HistoryNode";
import { ProjectGitNode, projectGitCommitTitle, type ProjectGitFlowNode } from "./ProjectGitNode";
import { buildProjectGitPanoramaGraph, PROJECT_GIT_WORKING_TREE_NODE_ID } from "./projectGitPanoramaViewModel";
import { Icon } from "./ui/icon";
import { IconButton } from "./ui/icon-button";
import { TooltipAnchor } from "./ui/tooltip";

const projectGitNodeTypes = { projectGit: ProjectGitNode, history: HistoryNode } as NodeTypes;

export type HistoryPerspective = "panorama" | "restore-points";

export function HistoryPerspectiveSwitch({ language, value, onChange }: { language: "zh" | "en"; value: HistoryPerspective; onChange: (value: HistoryPerspective) => void }): ReactElement {
  const zh = language === "zh";
  return <div className="history-perspective-switch" role="tablist" aria-label={zh ? "版本记录视图" : "Version history view"}><button type="button" role="tab" aria-selected={value === "restore-points"} className={value === "restore-points" ? "is-active" : ""} onClick={() => onChange("restore-points")}>{zh ? "功能地图" : "Feature map"}</button><button type="button" role="tab" aria-selected={value === "panorama"} className={value === "panorama" ? "is-active" : ""} onClick={() => onChange("panorama")}>{zh ? "Git 技术图" : "Git graph"}</button></div>;
}

interface ProjectGitPanoramaProps {
  response: ProjectHistoryResponse;
  language: "zh" | "en";
  demoMode: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => void;
  onPerspectiveChange: (value: HistoryPerspective) => void;
  onOpenRestorePoint: (nodeId: string) => void;
  onNodePositionChange: (nodeId: string, position: { x: number; y: number }) => void;
  onToggleDemo?: () => void;
}

function statusContent(response: ProjectHistoryResponse, zh: boolean): { icon: string; tone: string; title: string; detail: string } {
  const topology = response.gitTopology!;
  switch (topology.mergeStatus) {
    case "uncommitted":
      return {
        icon: "marker-code",
        tone: "warning",
        title: zh ? `有 ${topology.workingTree.changeCount} 个未提交文件` : `${topology.workingTree.changeCount} uncommitted files`,
        detail: topology.ahead > 0 && topology.behind > 0
          ? (zh ? `分支同时领先 main ${topology.ahead}、落后 ${topology.behind}；先提交工作区，再同步并合并。` : `The branch is ${topology.ahead} ahead and ${topology.behind} behind main; commit, synchronize, then merge.`)
          : topology.ahead > 0
            ? (zh ? `当前分支仍领先 main ${topology.ahead} 个提交；先提交工作区，再准备合并。` : `The branch is still ${topology.ahead} commits ahead of main; commit the working tree, then prepare the merge.`)
            : topology.behind > 0
              ? (zh ? `当前分支落后 main ${topology.behind} 个提交；先提交工作区，再更新分支。` : `The branch is ${topology.behind} commits behind main; commit the working tree, then update the branch.`)
              : (zh ? "先提交或整理这些变化，再判断是否需要合并。" : "Commit or organize these changes before deciding whether to merge.")
      };
    case "ready-to-merge":
      return { icon: "arrow-curved-right", tone: "action", title: zh ? `当前分支可合并到 main` : "Current branch is ready to merge", detail: zh ? `领先 main ${topology.ahead} 个提交，没有落后。` : `${topology.ahead} commits ahead of main and none behind.` };
    case "diverged":
      return { icon: "warning", tone: "warning", title: zh ? "当前分支与 main 已分叉" : "Current branch has diverged from main", detail: zh ? `领先 ${topology.ahead}，落后 ${topology.behind}；先同步并处理差异，再合并。` : `${topology.ahead} ahead and ${topology.behind} behind; synchronize before merging.` };
    case "behind-main":
      return { icon: "arrow-rotate-cw", tone: "warning", title: zh ? `当前分支落后 main ${topology.behind} 个提交` : `Current branch is ${topology.behind} commits behind main`, detail: zh ? "先更新当前分支；现在没有新的提交需要合并回 main。" : "Update this branch first; it has no new commits to merge into main." };
    case "main-unavailable":
      return { icon: "warning", tone: "warning", title: zh ? "还没有可识别的 main" : "No recognizable main branch", detail: zh ? "提交图仍可查看，但无法判断合并关系。" : "The commit graph is available, but merge readiness cannot be determined." };
    default:
      return { icon: "check-circle", tone: "healthy", title: topology.currentBranch === "main" ? (zh ? "主线已是最新" : "Main is up to date") : (zh ? "当前分支不需要合并" : "No merge is needed"), detail: topology.topology === "linear" ? (zh ? "当前开发过程是一条连续路径，没有真实分叉。" : "Development is one continuous path with no real divergence.") : (zh ? "历史中保留了真实分叉和合并路径。" : "Real branches and merge paths remain visible in history.") };
  }
}

function commitDetailTime(commit: ProjectGitCommit, zh: boolean): string {
  return new Intl.DateTimeFormat(zh ? "zh-CN" : "en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(commit.committedAt));
}

export function ProjectGitPanorama({ response, language, demoMode, refreshing, error, onRefresh, onPerspectiveChange, onOpenRestorePoint, onNodePositionChange, onToggleDemo }: ProjectGitPanoramaProps): ReactElement {
  const zh = language === "zh";
  const topology = response.gitTopology!;
  const [query, setQuery] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const flowRef = useRef<ReactFlowInstance<ProjectGitFlowNode, Edge> | null>(null);
  const graph = useMemo(() => buildProjectGitPanoramaGraph(topology, language, query, response.view?.positions), [language, query, response.view?.positions, topology]);
  const [flowNodes, setFlowNodes] = useState<ProjectGitFlowNode[]>(graph.nodes);
  const selectedCommit = topology.commits.find((commit) => commit.id === selectedNodeId) ?? null;
  const selectedWorkingTree = selectedNodeId === PROJECT_GIT_WORKING_TREE_NODE_ID;
  const historyNodes = new Map((response.index?.nodes ?? []).map((node) => [node.id, node] as const));
  const selectedRestorePoints = selectedCommit?.historyNodeIds.map((id) => historyNodes.get(id)).filter((node): node is ProjectHistoryNode => Boolean(node)) ?? [];
  const status = statusContent(response, zh);
  const recentNodeIds = useMemo(() => {
    const commits = new Map(topology.commits.map((commit) => [commit.id, commit] as const));
    const ids = topology.workingTree.dirty ? [PROJECT_GIT_WORKING_TREE_NODE_ID] : [];
    let current = topology.headCommit;
    while (current && ids.length < 6) {
      ids.push(current);
      current = commits.get(current)?.parents[0] ?? null;
    }
    return ids;
  }, [topology]);

  useEffect(() => { setFlowNodes(graph.nodes); }, [graph.nodes]);

  const onNodesChange = (changes: NodeChange<ProjectGitFlowNode>[]) => {
    setFlowNodes((current) => applyNodeChanges(changes, current));
  };

  const fitInitialView = (instance: ReactFlowInstance<ProjectGitFlowNode, Edge>, duration = 0) => {
    if (graph.nodes.length > 10 && recentNodeIds.length) {
      void instance.fitView({ nodes: recentNodeIds.map((id) => ({ id })), padding: 0.26, minZoom: 0.62, maxZoom: 1.05, duration });
      return;
    }
    void instance.fitView({ padding: 0.16, maxZoom: 1, duration });
  };

  useEffect(() => {
    const handleNodeAction = (event: Event) => {
      const nodeId = (event as CustomEvent<{ nodeId?: string }>).detail?.nodeId;
      if (nodeId) setSelectedNodeId(nodeId);
    };
    window.addEventListener("canvasight-project-git-node-action", handleNodeAction);
    return () => window.removeEventListener("canvasight-project-git-node-action", handleNodeAction);
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => { if (flowRef.current) fitInitialView(flowRef.current); });
    return () => window.cancelAnimationFrame(frame);
  }, [topology.commits.length, topology.topology]);

  const focusMatches = () => {
    if (!graph.matchingNodeIds.length) return;
    void flowRef.current?.fitView({ nodes: graph.matchingNodeIds.map((id) => ({ id })), padding: 0.24, maxZoom: 1.15, duration: 260 });
  };

  return (
    <div className="history-workspace project-git-panorama">
      <div className={`project-git-status-bar is-${status.tone}`} role="status">
        <Icon name={demoMode ? "eye" : status.icon} size={16} />
        <strong>{demoMode ? (zh ? "示例项目全景" : "Example project panorama") : status.title}</strong>
        <span>{demoMode ? (zh ? "提交、分叉、合并和工作区状态都来自同一套 Git 事实。" : "Commits, branches, merges, and working-tree state share one Git source of truth.") : status.detail}</span>
        <HistoryPerspectiveSwitch language={language} value="panorama" onChange={onPerspectiveChange} />
        {onToggleDemo ? <button type="button" className="history-demo-toggle" onClick={onToggleDemo}>{demoMode ? (zh ? "返回真实记录" : "Back to real history") : (zh ? "查看示例" : "View example")}</button> : null}
      </div>
      <div className="project-git-toolbar">
        <label><Icon name="search" size={15} /><span className="sr-only">{zh ? "搜索提交" : "Search commits"}</span><input value={query} placeholder={zh ? "搜索提交、作者或分支" : "Search commit, author, or branch"} onChange={(event) => setQuery(event.currentTarget.value)} /></label>
        <span className="project-git-stat"><strong>{topology.totalCommitCount}</strong>{zh ? "个 Git 提交" : " Git commits"}</span>
        <span className="project-git-stat"><strong>{topology.topology === "linear" ? (zh ? "单一路径" : "Linear") : (zh ? "真实分叉" : "Branched")}</strong>{topology.currentBranch ? ` · ${topology.currentBranch}` : ""}</span>
        {topology.mainCommit ? <span className="project-git-stat"><strong>{zh ? `领先 main ${topology.ahead}` : `${topology.ahead} ahead of main`}</strong>{zh ? ` · 落后 ${topology.behind}` : ` · ${topology.behind} behind`}</span> : null}
        {topology.truncated ? <span className="project-git-truncated"><Icon name="warning" size={13} />{zh ? `仅显示最近 ${topology.commits.length} 个` : `Showing latest ${topology.commits.length}`}</span> : null}
        {query ? <button type="button" className="project-git-focus-button" disabled={!graph.matchingNodeIds.length} onClick={focusMatches}>{graph.matchingNodeIds.length ? (zh ? `定位 ${graph.matchingNodeIds.length} 个结果` : `Focus ${graph.matchingNodeIds.length} results`) : (zh ? "没有结果" : "No results")}</button> : null}
        {!demoMode ? <TooltipAnchor label={zh ? "刷新 Git 和项目状态" : "Refresh Git and project status"} side="bottom"><IconButton className={refreshing ? "history-refresh-button is-refreshing" : "history-refresh-button"} filled={false} icon="arrow-rotate-cw" size="lg" aria-label={zh ? "刷新项目全景" : "Refresh project panorama"} disabled={refreshing} onClick={onRefresh} /></TooltipAnchor> : null}
      </div>
      {error ? <div className="history-error-banner" role="alert">{error}<button type="button" onClick={onRefresh}>{zh ? "重试" : "Retry"}</button></div> : null}
      {graph.nodes.length === 0 ? <div className="history-empty"><Icon name="manage-history" size={28} /><strong>{zh ? "还没有 Git 提交" : "No Git commits yet"}</strong><span>{zh ? "第一次提交后，这里会出现项目的完整开发路径。" : "Your complete development path appears here after the first commit."}</span></div> : <ReactFlow<ProjectGitFlowNode, Edge>
        nodes={flowNodes.map((node) => ({ ...node, selected: node.id === selectedNodeId }))}
        edges={graph.edges}
        nodeTypes={projectGitNodeTypes}
        minZoom={0.08}
        maxZoom={2}
        panOnScroll
        panOnScrollMode={PanOnScrollMode.Free}
        zoomOnScroll={false}
        zoomOnPinch
        zoomActivationKeyCode="Meta"
        nodesConnectable={false}
        nodesDraggable
        onNodesChange={onNodesChange}
        onNodeDragStop={(_event, node) => onNodePositionChange(node.id, node.position)}
        onInit={(instance) => { flowRef.current = instance; window.requestAnimationFrame(() => fitInitialView(instance)); }}
        onNodeClick={(_event, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        proOptions={{ hideAttribution: true }}
      ><Background gap={28} size={1} color="rgba(125, 125, 125, 0.22)" /></ReactFlow>}
      {graph.nodes.length ? <div className="history-canvas-tools"><TooltipAnchor label={zh ? "回到当前进度" : "Focus current progress"} side="right"><IconButton filled={false} icon="target-arrow" size="lg" aria-label={zh ? "回到当前进度" : "Focus current progress"} onClick={() => void flowRef.current?.fitView({ nodes: [{ id: topology.workingTree.dirty ? PROJECT_GIT_WORKING_TREE_NODE_ID : topology.headCommit ?? topology.commits[0]?.id }], padding: 0.36, minZoom: 0.7, maxZoom: 1.15, duration: 260 })} /></TooltipAnchor><span className="history-canvas-tools-divider" aria-hidden /><TooltipAnchor label={zh ? "查看完整项目" : "View full project"} side="right"><IconButton filled={false} icon="maps" size="lg" aria-label={zh ? "查看完整项目" : "View full project"} onClick={() => void flowRef.current?.fitView({ padding: 0.16, maxZoom: 1, duration: 260 })} /></TooltipAnchor></div> : null}
      <RadixDialog.Root open={Boolean(selectedCommit || selectedWorkingTree)} onOpenChange={(open) => { if (!open) setSelectedNodeId(null); }}><RadixDialog.Portal><RadixDialog.Overlay className="history-detail-overlay" /><RadixDialog.Content className="history-detail-dialog project-git-detail" aria-describedby={undefined}>
        <header><div><span className="history-inspector-kicker">{selectedWorkingTree ? (zh ? "当前工作区" : "Current working tree") : selectedCommit?.isMerge ? (zh ? "Git 合并提交" : "Git merge commit") : selectedCommit?.isCanvasightGenerated ? (zh ? "Canvasight 自动保存提交" : "Canvasight auto-save commit") : (zh ? "Git 提交" : "Git commit")}</span><RadixDialog.Title asChild><h2>{selectedWorkingTree ? (zh ? "还没有提交的项目变化" : "Uncommitted project changes") : selectedCommit ? projectGitCommitTitle(selectedCommit, zh) : ""}</h2></RadixDialog.Title></div><RadixDialog.Close asChild><IconButton filled={false} icon="x" size="sm" aria-label={zh ? "关闭详情" : "Close details"} /></RadixDialog.Close></header>
        <div className="history-detail-scroll">
          {selectedWorkingTree ? <><section className="project-git-working-detail"><h3>{zh ? "变化状态" : "Change state"}</h3><dl><div><dt>{zh ? "全部" : "Total"}</dt><dd>{topology.workingTree.changeCount}</dd></div><div><dt>{zh ? "已暂存" : "Staged"}</dt><dd>{topology.workingTree.stagedCount}</dd></div><div><dt>{zh ? "未暂存" : "Unstaged"}</dt><dd>{topology.workingTree.unstagedCount}</dd></div><div><dt>{zh ? "新文件" : "New files"}</dt><dd>{topology.workingTree.untrackedCount}</dd></div></dl><p>{zh ? "这是工作区状态，不是伪造的 Git 提交。提交后才会成为全景图中的正式节点。" : "This is working-tree state, not a synthetic Git commit. It becomes a formal node only after committing."}</p></section></> : selectedCommit ? <>
            <div className="history-inspector-badges"><span>{selectedCommit.shortId}</span>{selectedCommit.isHead ? <span>{zh ? "当前位置" : "Current position"}</span> : null}<span>{selectedCommit.isOnMain ? (zh ? "已在 main" : "On main") : (zh ? "待合并" : "Not merged")}</span>{selectedCommit.isMerge ? <span>{zh ? `${selectedCommit.parents.length} 条路径汇合` : `${selectedCommit.parents.length} paths merged`}</span> : null}</div>
            <section className="project-git-commit-facts"><h3>{zh ? "提交事实" : "Commit facts"}</h3><dl><div><dt>{zh ? "完整提交号" : "Full commit"}</dt><dd><code>{selectedCommit.id}</code></dd></div>{selectedCommit.displaySubject && selectedCommit.displaySubject !== selectedCommit.subject ? <><div><dt>{zh ? "Canvasight 摘要" : "Canvasight summary"}</dt><dd>{selectedCommit.displaySubject}</dd></div><div><dt>{zh ? "Git 原始说明" : "Original Git subject"}</dt><dd>{selectedCommit.subject}</dd></div></> : null}<div><dt>{zh ? "作者与时间" : "Author and time"}</dt><dd>{selectedCommit.author} · {commitDetailTime(selectedCommit, zh)}</dd></div><div><dt>{zh ? "父节点" : "Parents"}</dt><dd>{selectedCommit.parents.length ? selectedCommit.parents.map((parent) => <code key={parent}>{parent.slice(0, 8)}</code>) : (zh ? "项目起点" : "Project root")}</dd></div><div><dt>{zh ? "引用" : "Refs"}</dt><dd>{selectedCommit.refs.length ? selectedCommit.refs.map((ref) => <code key={`${ref.kind}:${ref.name}`}>{ref.name}</code>) : (zh ? "无分支或标签停在这里" : "No branch or tag points here")}</dd></div></dl></section>
            <section><h3>{zh ? "与 Canvasight 的关系" : "Canvasight evidence"}</h3>{selectedRestorePoints.length ? <><p>{zh ? "这个真实提交关联了以下可恢复记录。它们是证据和操作入口，不会改变 Git 拓扑。" : "This real commit is linked to the restore records below. They provide evidence and actions without changing Git topology."}</p><ul className="project-git-restore-list">{selectedRestorePoints.map((node) => <li key={node.id}><div><strong>{node.summary}</strong><span>{node.source === "codex" ? "Codex" : (zh ? "项目变化" : "Project change")}</span></div><button type="button" className="history-secondary-button" onClick={() => onOpenRestorePoint(node.id)}>{zh ? "打开恢复详情" : "Open restore details"}</button></li>)}</ul></> : <p>{zh ? "这个提交没有 Canvasight 恢复点；它仍然是项目历史中的真实 Git 节点。" : "This commit has no Canvasight restore point, but remains a real Git node in project history."}</p>}</section>
          </> : null}
        </div>
      </RadixDialog.Content></RadixDialog.Portal></RadixDialog.Root>
    </div>
  );
}
