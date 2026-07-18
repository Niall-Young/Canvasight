---
schema_version: 1
report_id: solution-native-widget-zero-size-0-4-31
report_type: solution
status: resolved
owner: Development Agent
created_by: Development Agent
priority: high
version: 1
agent_id: /root/development_agent
thread_id: 019f7450-40ec-7df0-81de-862b1f8af621
created_at: 2026-07-18T08:26:11Z
updated_at: 2026-07-18T08:26:11Z
depends_on:
  - issue-native-widget-zero-size-0-4-31
related_files:
  - agent-reports/assigned/issue-native-widget-zero-size-0-4-31.md
  - plugins/canvasight/src/App.tsx
  - plugins/canvasight/src/lib/canvasightApi.ts
  - plugins/canvasight/src/lib/widgetBridge.ts
  - plugins/canvasight/mcp/server.source.mjs
verification_status: passed
verification_evidence:
  - Installed cache and repository candidate hashes match for manifests, package metadata, MCP source/bundle, index.html, and every dist file inspected.
  - The live daemon reports status ok with serverVersion 0.4.31 and the expected installed-cache pluginRoot; the failed session remains correctly bound to the target task and project.
  - Lifecycle evidence shows session and project API proxy calls completed before the 30000ms renderability timeout.
  - A matching zero-size failure occurred on 0.4.30 and the same open attempt later reached verified ready through a new foreground widget instance at 788 by 794 pixels.
---

# 0.4.31 原生 Widget 零尺寸只读诊断与受控重验方案

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/assigned/issue-native-widget-zero-size-0-4-31.md`

本 solution report 记录已完成的只读诊断和下一步受控验证方案，不代表关联 issue 已解决。issue 必须保持 `assigned`，直到 exact 候选通过完整原生宿主验收或后续修复完成。

## Root Cause

本次失败的根因层位于 Codex native host presentation geometry：宿主状态已经从 `inline` 切换并报告 `fullscreen`，React 也已挂载，session 与 project API 均已返回，但 fullscreen 实例在 30 秒内始终没有形成可验证的可见、正尺寸 canvas 表面。

现有证据排除了以下首要失败层：

- 不是 0.4.31 installed cache 与源码候选漂移。
- 不是 daemon 版本、daemon ownership 或 daemon health 异常。
- 不是 session、task、project binding 错位。
- 不是 MCP Apps server-tool proxy 未连通，也不是 project open 请求超时。
- 不是 React 未执行；实例已明确记录 `reactMounted: true`。

当前日志仍不足以在 host presentation 层内部进一步区分“宿主提供的容器几何为 0×0”与“页面根布局在该宿主实例内计算为 0×0”。因此本报告不把其中任一更细分机制写成已证实根因。

## 失败遥测局限

失败结果中的 `projectHydrated: false` 不能单独证明项目 hydration 失败。启动代码只有在 canvas 通过可见性门槛后，才通过 ready 回执发送 `projectHydrated`、canvas 尺寸和可见性证据；`reportWidgetFailure` 只发送 identity、stage 与 error。daemon 因而会对未发送的 hydration 和 geometry 字段保留默认 `false` / `0`。

本次 lifecycle 顺序显示：实例进入 `hydrating_project` 后，session GET 和随后的 project open proxy 调用均快速完成；之后才等待满 30 秒并由 `waitForRenderableCanvas` 产生 `Canvasight canvas did not become visibly renderable within 30000ms.`。因此 returned `projectHydrated: false` 是失败遥测的证据缺口，不应被用来把根因重新归为 project API 或 persistence。

## 调研过程

1. 检查 exact failure identity：
   - session：`session-mrq3iskd-172a0ed5`
   - open attempt：`open-mrq3iskg-315c191b8e1b`
   - widget instance：`widget-3f03522d-93d7-4bc6-8164-52d638083613`
   - task：`019f744d-c7f1-7383-8195-7478c2cd835e`
2. 只读检查 daemon health、daemon state 与 session state。daemon 为 exact installed 0.4.31，session 指向 `/Users/niallyoung/Desktop/Canvasight`，document revision 为 14。
3. 比对 repo candidate 与 installed immutable cache。manifest、package、lock、MCP source、生成 bundle、`dist/index.html` 及 dist 文件均未发现 mismatch。
4. 对照启动代码和 lifecycle：React 注册后从 `connecting_session` 进入 `hydrating_project`，API proxy 调用完成，最终失败来自 canvas 的 visible/fullscreen/connected/non-zero/hit-test 门槛。
5. 检查历史 native evidence。0.4.30 曾出现相同 `reactMounted: true`、canvas 0×0、30 秒超时；同一 open attempt 后来在新 widget instance 中以 788×794 达到 verified ready。这说明该模式可由宿主 presentation 生命周期触发，不能据单次失败推断 0.4.31 Refresh-save 改动造成确定性回归。

## 可选方案

- 方案 A：立即修改 runtime、扩大 timeout 或降低 ready 门槛。该方案会破坏 exact 0.4.31 候选证据，且可能把不可见实例误报为 ready，不采用。
- 方案 B：保持候选和 daemon 不变，在目标任务明确处于前台、fullscreen surface 实际可见的受控条件下创建新的 open attempt，并重复完整 native gate。该方案能验证 presentation 生命周期假设，采用。
- 方案 C：若受控前台重验仍复现，先增加最小诊断遥测，再决定是否需要新版本修复。该方案作为失败后的后续路径保留。

## 推荐方案

先执行一次受控前台重验，不修改 0.4.31 工件：

1. 将 exact 0.4.31 的目标 Codex 任务置于最前台，并确认 native fullscreen surface 有实际展示空间。
2. 使用该任务的精确 `CODEX_THREAD_ID` 创建新的 `open_canvasight` attempt；不得复用本次 failed instance 作为成功证据。
3. 用新返回的 `sessionId`、`openAttemptId` 和同一 `threadId` 调用 `await_canvasight_widget_ready`。
4. 只有 instance-bound fullscreen ready 同时具备 React、project hydration、rendered、visible 和正尺寸证据，才继续真实控件、Refresh、A→B→A、same-task Run 与 late metadata 验收。
5. 浏览器 fallback、直接 localhost、合成 smoke 或 daemon health 不得替代以上 gate。

如果前台重验仍出现同类 0×0，应停止发布并制作新候选。最小诊断改动应让失败遥测携带：`hydratedRef`、`document.visibilityState`、`window.innerWidth/innerHeight`、canvas connected/style/rect、`elementFromPoint` 命中结果、host context `containerDimensions`，以及 `requestDisplayMode` 的返回值或错误。获得这些证据后再决定是否需要重试 fullscreen presentation、调整宿主恢复策略或修复页面根布局。

## 实施步骤

1. 本轮只读收集并交叉验证 daemon、session、lifecycle、installed parity 和相关启动代码证据。
2. 保持 `issue-native-widget-zero-size-0-4-31` 为 `assigned`，不更新 closure criteria。
3. 由 Main Thread 或 Project Management Agent 安排受控前台 exact 0.4.31 native retest。
4. 只有完整 native gate 通过后，才由 owning issue 和 integration summary 记录 closure；若失败，则创建后续诊断/修复版本范围。

## 风险与回滚

- 单次前台重验通过只能证明 exact 0.4.31 在受控可见条件下可完成启动；仍需完成 issue 中要求的全部 native acceptance，不能仅凭 ready 关闭问题。
- 重复打开可能改变 widget instance，因此每轮证据必须绑定新的 session/open attempt/widget instance，禁止混用旧实例字段。
- 若在重验前修改源码、dist、MCP、版本字段、安装快照或 daemon 状态，现有候选证据即失效，应回到完整候选矩阵。
- 本报告没有 runtime 改动，无代码回滚项；如重验失败，继续保持发布阻断即可。

## 处理结果

已完成只读归因和受控重验方案；尚未修复或规避关联 issue。0.4.31 仍不得发布，直到真实原生宿主验收给出新的完整证据。

## 修改文件

- `agent-reports/resolved/solution-native-widget-zero-size-0-4-31.md`

未修改 issue、QUEUE、ROSTER、源码、构建产物或安装状态。

## 验证方式

- 只读 daemon health 与 session state 检查。
- repo candidate / installed cache SHA-256 parity 检查。
- MCP lifecycle 的 instance stage、proxy completion 和 failure timestamp 对照。
- 0.4.30 同模式失败与同 open attempt 后续 verified ready 的历史证据对照。
- 相关启动、API proxy、ready/failure telemetry 代码审阅。

本轮没有运行测试、构建、daemon lifecycle 命令或发布操作。

## 后续风险

当前最大残余风险是 host presentation 的间歇性 0×0 尚未被可重复条件锁定。关联 issue 保持 `assigned`；只有受控前台重验和完整 native acceptance 通过，或后续新版本诊断并修复该 presentation 机制，才能进入 closure。
