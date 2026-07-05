# Canvasight 全局节点模板集成总结

## 本轮目标
- 节点菜单在“复制”下方新增“存为模板”，空提示词禁用。
- 模板为本机全局数据，不写入项目 `.scatter/scatter.json`。
- 右上角工具条在 Markdown 左侧新增模板入口，打开模板抽屉。
- 模板抽屉支持搜索、拖拽到画布创建节点。

## Agent 结论
- 产品/设计 Agent：模板应作为 Source/Library panel 接入右侧抽屉；拖拽 MIME 需和文件附件 drop 分离。
- 测试监督 Agent：应扩展 MCP smoke 覆盖全局模板 API、持久化和 daemon 重启后可读；继续运行 typecheck、build、test:mcp、插件校验。
- 客服 Agent：该功能影响用户用法和数据存储，需要同步双语 README。

## 已实施
- 新增 `NodeTemplate` / `NodeTemplateInput` 共享类型，只保存标题、正文、附件和时间戳。
- MCP daemon 新增 `/api/templates`，模板存储于 `CANVASIGHT_HOME/templates.json`，附件复制到 `CANVASIGHT_HOME/template-assets/`。
- 前端 `canvasightApi` 新增模板读写，并为 Vite 开发页提供 localStorage fallback。
- `TaskNode` 菜单新增“存为模板”，空正文禁用，保存当前编辑 draft。
- 画布工具条新增模板按钮，打开右侧模板抽屉。
- `RightDrawer` 新增模板搜索和拖拽。
- 画布 drop 支持 `application/x-canvasight-template`，不破坏附件 drop。
- README 中英文同步说明全局模板功能、基础用法和存储位置。
- `tests/mcp-smoke.mjs` 增加模板保存、读取、daemon 重启后持久化验证。

## 未解决
- 暂无阻断问题。

## 下一轮分派
- 测试监督 Agent：等待最终 `test:mcp`、`build`、插件校验和浏览器验证结果。
- 主线程：根据验证结果修复问题并提交中文规范 commit。
