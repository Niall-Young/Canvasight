# 恢复节点图片粘贴附件能力
## 负责 Agent
开发 Agent
## Root Cause
Canvasight 插件化迁移保留了附件保存 API、`AttachmentSource = "paste"` 和 `addFilesToNode`，但 UI 层没有迁移 clipboard paste 监听入口，导致剪贴板图片不会进入附件保存链路。
## 调研过程
1. 搜索 `paste`、`clipboard`、`addFilesToNode` 和附件相关代码，确认 `plugins/canvasight/src/App.tsx` 只保留 upload/drop 入口。
2. 检查 `TaskNode`，确认节点附件展示、上传按钮和附件删除仍正常，但没有 `onPaste`。
3. 检查 `mcp/server.mjs`，确认 `/api/sessions/:id/attachments` 支持 `source: "paste"` 并能保存到 `.scatter/assets`。
## 可选方案
1. 在 `TaskNode` 的 title/body 上分别加 `onPaste`：定位准确，但只能在输入区域生效，节点选中后直接粘贴仍不工作。
2. 在 `App` 画布级监听 `paste`：可以支持节点内、画布内选中节点粘贴，并能避开右侧 drawer。
3. 重新引入桌面客户端剪贴板链路：不适合网页插件化目标。
## 推荐方案
采用 `App` 画布级 paste 监听。优先使用事件目标所在的 `.react-flow__node[data-id]`，没有目标节点时在画布范围内回落到当前选中节点；只在剪贴板包含图片文件时拦截默认行为。
## 实施步骤
1. 增加 `nodeIdFromElementTarget`，从粘贴目标反查 React Flow 节点 ID。
2. 增加 `clipboardImageFiles`，从 `clipboardData.items` 或 `clipboardData.files` 提取 image 文件。
3. 增加 `attachmentName`，为无文件名的 pasted image 生成 `pasted-image-*.ext` 文件名。
4. 在 `CanvasightWorkspace` 中注册 capture 阶段 `window` paste listener，命中画布节点后调用 `addFilesToNode(nodeId, files, "paste")`。
## 风险与回滚
风险是误拦截普通文本粘贴或右侧 drawer 粘贴。实现中仅当剪贴板包含图片文件时 `preventDefault`，并限制粘贴目标必须在画布内或节点内。回滚可删除新增 paste listener 和辅助函数。
## 验证方式
1. `npm run typecheck -- --pretty false`
2. `npm run build`
3. `npm run test:mcp`
4. `validate_plugin.py`
5. 浏览器真实验证：写入 browser clipboard 的 `image/png` 后点击临时项目节点并发送 `Meta+V`，节点附件数从 0 变 1，`.scatter/assets` 生成 `clipboard.png`，附件 `source` 为 `paste`，控制台无报错。
