# Canvasight 固定 Agent Team 调整摘要

## 本轮目标

将上一轮“任务完成后关闭 agent”的规则改为“保留 8 个固定子智能体，并持续复用它们干活”。

## 固定 8 个角色

- Product Agent
- Design Agent
- Development Agent
- Test Supervisor Agent
- Customer Support Agent
- Design Standards Expert
- Development Standards Lead
- Project Management Agent

## 本轮变更

- 更新 `AGENTS.md` 的 Agent Team Lifecycle。
- 明确这 8 个角色是长期固定 roster，不在任务结束后关闭。
- 明确后续同一角色任务必须复用固定实例，不再重复创建同角色 agent。
- 明确历史多余 agent 不再接收新任务。

## 当前阻塞

当前可用的 multi-agent 工具只有：

- `spawn_agent`
- `send_input`
- `wait_agent`
- `resume_agent`
- `close_agent`

没有可用的“列出全部子智能体”或“按昵称删除 UI 历史项”的接口。主线程也没有全部历史 agent 的 id，因此无法安全批量删除当前 UI 里的额外子智能体。

本轮曾尝试创建固定 8 个实例，但工具因为 `fork_context=true` 同时传入 `agent_type` 返回参数错误，未创建新实例。

## 决策

- 暂停创建新的固定 8 个实例，避免在当前已经显示过多子智能体的情况下继续增加数量。
- 不直接编辑 Codex 本地 `state_5.sqlite` 等内部状态文件，避免破坏 Codex 状态。
- 后续只在能确认目标实例 id 后登记固定 8 个；其余历史 agent 如果获得 id，则使用官方 `close_agent` 关闭。

## README 决策

Customer Support Agent 视角审查：本轮是内部协作流程调整，不改变 Canvasight 用户功能、安装、使用或故障排查路径，因此不更新 `README.md`。

## 验证

- 文档变更，无需运行前端构建。
- 已做只读检查，未发现可安全枚举全部子智能体 id 的本地索引。

## Git 状态

- 等待 Project Management Agent 规则执行：暂存 `AGENTS.md` 和本摘要，并使用中文 conventional commit 提交。
