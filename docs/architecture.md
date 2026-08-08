# Canvasight Architecture / Canvasight 架构

## 中文

Canvasight 使用“领域规则 → 应用协调 → 基础设施 Adapter → UI/transport”的依赖方向。上层可以调用下层，下层不能反向依赖 React、MCP tool 或 HTTP 路由。

- `shared/`：浏览器与 MCP 共用的持久化和消息合同。
- `src/domain/`：不依赖 React 状态或网络的画布与文档规则。
- `src/application/`：当前 workspace 的用例和实例级动作接口。
- `src/infrastructure/` 与 `src/lib/`：文件、widget bridge 和 daemon API Adapter。
- `src/components/`：React 展示与交互；`App.tsx` 只负责组合 workspace。
- `mcp/domain/`：并发、约束和 Graph Writer 等可独立测试的规则。
- `mcp/server.source.mjs`：MCP、HTTP 和 daemon 的组合入口；`server.mjs` 是生成产物，不手动编辑。

新增功能时，先把不涉及 I/O 的规则放到领域模块，通过小接口测试；React 组件和 MCP transport 只负责把输入转换为模块调用。运行 `npm run verify` 检查 bundle、类型、模块依赖和核心行为。

## English

Canvasight follows one dependency direction: domain rules → application coordination → infrastructure adapters → UI/transport. Upper layers may call lower layers; lower layers must not depend back on React, MCP tools, or HTTP routes.

- `shared/`: persistence and message contracts shared by the browser and MCP runtime.
- `src/domain/`: canvas and document rules without React state or network dependencies.
- `src/application/`: use cases and instance-bound action interfaces for the active workspace.
- `src/infrastructure/` and `src/lib/`: file, widget bridge, and daemon API adapters.
- `src/components/`: React presentation and interaction; `App.tsx` composes the workspace.
- `mcp/domain/`: independently testable concurrency, constraint, and Graph Writer rules.
- `mcp/server.source.mjs`: composition root for MCP, HTTP, and daemon behavior; generated `server.mjs` is never edited manually.

For new behavior, place I/O-free rules in a domain module first and test them through a small interface. React components and MCP transport should only translate input into module calls. Run `npm run verify` to check the bundle, types, module dependencies, and core behavior.
