# Canvasight Agent Team 重建摘要

## 本轮目标

清空旧的临时 agent 使用方式，重新建立固定 Canvasight agent team，并补充新的文档、规范和 git 管理角色。

## 固定角色

- Main thread: 集成、架构、冲突处理、验证和最终交付。
- Product Agent: 产品目标、范围和验收。
- Design Agent: 网页 UI 方向、组件语言和视觉密度。
- Development Agent: MCP、持久化、React 和运行时实现。
- Test Supervisor Agent: smoke test、构建、插件校验和浏览器可见验证。
- Customer Support Agent: README 用户文档，保持中英文结构。
- Design Standards Expert: 维护 `design.md`。
- Development Standards Lead: 维护 `AGENTS.md`。
- Project Management Agent: git 状态、暂存范围和中文规范提交日志。

## 生命周期规则

- 不再为同一个角色反复创建新子智能体。
- 不创建空闲常驻子智能体；只有存在具体并行工作或独立审查任务时才创建。
- 创建子智能体时必须在 integration summary 记录角色、目的和 agent id。
- 子智能体完成任务后及时关闭。
- 如果历史子智能体缺少 id 无法关闭，需要在摘要里说明，不用创建替代实例。

## 本轮变更

- 更新 `AGENTS.md` 的 Agent Roles，加入 Design Standards Expert、Development Standards Lead 和 Project Management Agent。
- 新增 Agent Team Lifecycle，明确固定 roster、复用、关闭和记录规则。
- 新增 Agent Reports，明确阻断问题和每轮集成摘要的 Markdown 记录要求。

## README 决策

Customer Support Agent 视角审查：本轮是内部协作流程调整，不改变 Canvasight 用户安装、使用、功能或故障排查路径，因此不更新 `README.md`。

## 验证

- 文档变更，无需运行前端构建。
- 后续如涉及 UI、MCP 或运行时改动，仍需按 `AGENTS.md` 当前命令执行对应验证。

## Git 状态

- 等待 Project Management Agent 规则执行：检查状态、暂存本轮文档变更，并使用中文 conventional commit 提交。
