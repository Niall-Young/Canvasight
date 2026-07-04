# Asset API 边界解决方案

## 负责 Agent
主线程集成负责人

## Root Cause
`/api/asset` 缺少路径授权边界，导致任何可编码的绝对路径都会进入文件读取流程。

## 调研过程
Scatter Electron 客户端的 asset protocol 只允许路径包含 `.scatter/assets/`，否则返回 forbidden。Canvasight 插件仍然保持 `.scatter/assets` 兼容，因此可以使用同等约束。

## 可选方案
- 在 asset URL 中携带 session/project，并校验 path 是否落在当前 project 的 assets 目录。
- 使用与 Scatter 客户端一致的 `.scatter/assets` 路径包含检查。

## 推荐方案
本轮采用 `.scatter/assets` 路径包含检查，改动小且和上游兼容。后续如引入多项目并发权限模型，再升级为 session/project 级校验。

## 实施步骤
1. 增加 `isScatterAssetPath`。
2. 在 `serveAsset` 中读取文件前校验。
3. smoke test 保持现有附件读取成功路径。

## 风险与回滚
如果已有历史附件不在 `.scatter/assets`，预览会被拒绝；这符合当前产品兼容目标。

## 验证方式
运行 `npm run test:mcp`，确认正常附件仍可读取。
