import type { ProjectHistoryResponse } from "../lib/canvasightApi";

export type ProjectHistoryOverviewState =
  | "unavailable"
  | "demo"
  | "coverage-limited"
  | "protection-needs-attention"
  | "development-in-progress"
  | "project-changes-pending"
  | "organized";

export interface ProjectHistoryOverviewStatus {
  state: ProjectHistoryOverviewState;
  tone: "demo" | "healthy" | "warning" | "active";
  icon: string;
  title: string;
  detail: string;
}

export function projectHistoryOverviewStatus(
  response: ProjectHistoryResponse | null,
  language: "zh" | "en",
  demoMode = false,
  hasActionableFeatures = false
): ProjectHistoryOverviewStatus {
  const zh = language === "zh";
  if (demoMode) {
    return {
      state: "demo",
      tone: "demo",
      icon: "eye",
      title: zh ? "示例功能地图" : "Example feature map",
      detail: zh ? "示例不会改动项目" : "The example never changes your project"
    };
  }

  if (!response) {
    return {
      state: "unavailable",
      tone: "warning",
      icon: "warning",
      title: zh ? "暂时无法读取功能进度" : "Feature progress is temporarily unavailable",
      detail: zh ? "项目没有因此被修改；可以重试读取" : "The project was not changed; try loading it again"
    };
  }

  if (response.provider?.coverageComplete === false) {
    return {
      state: "coverage-limited",
      tone: "warning",
      icon: "warning",
      title: zh ? "部分开发记录尚未纳入" : "Some development activity is not included",
      detail: zh ? "已有功能和恢复点仍可使用；刷新后会重新检查记录范围" : "Existing features and checkpoints remain usable; refresh to check coverage again"
    };
  }

  const protection = response.index?.protection;
  if (protection && (!protection.initialized || !protection.healthy)) {
    return {
      state: "protection-needs-attention",
      tone: "warning",
      icon: "warning",
      title: zh ? "自动保护需要处理" : "Automatic protection needs attention",
      detail: protection.unresolvedFailures.length > 0
        ? (zh ? "有一次自动保存没有完成；项目代码没有因此被改写" : "An automatic save did not complete; project code was not rewritten")
        : (zh ? "项目记录尚未准备完成；可以刷新或手动保存当前进度" : "Project recording is not ready yet; refresh or save the current progress")
    };
  }

  if ((response.provider?.activeTurnCount ?? 0) > 0) {
    return {
      state: "development-in-progress",
      tone: "active",
      icon: "clock",
      title: zh ? "Codex 正在开发" : "Codex is developing",
      detail: zh ? "本轮完成后会自动整理功能进度和恢复点" : "Feature progress and a checkpoint will be organized when the turn finishes"
    };
  }

  if (response.gitTopology?.workingTree.dirty) {
    const count = response.gitTopology.workingTree.changeCount;
    return {
      state: "project-changes-pending",
      tone: "warning",
      icon: "marker-code",
      title: zh ? `项目代码有 ${count} 项尚未形成恢复点` : `${count} project code changes are not checkpointed`,
      detail: zh ? "Canvasight 自身的画布数据不计入这里；保存后再判断下一步" : "Canvasight canvas metadata is excluded; save before choosing the next step"
    };
  }

  return {
    state: "organized",
    tone: "healthy",
    icon: "shield-lock",
    title: zh ? "功能进度已自动整理" : "Feature progress is organized automatically",
    detail: hasActionableFeatures
      ? (zh ? "项目代码没有待保护变化；有功能可以继续开发或整合" : "No project code changes are awaiting protection; a feature is ready to continue or integrate")
      : (zh ? "项目代码没有待保护变化；当前功能都已进入项目主线" : "No project code changes are awaiting protection; current features are all in the project mainline")
  };
}
