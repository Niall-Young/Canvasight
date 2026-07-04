# 集成汇总
## 已解决
- 恢复 Markdown 右侧栏顶部操作按钮安全边距。
- `.markdown-pane` 现在有统一 16px 内边距，下载/复制按钮不再贴近窗口右上边缘。
- Markdown 源码和预览内容仍保持原滚动结构。
## 未解决
- 无。
## 下一轮分派
- 暂无新的阻断问题。
## 验证记录
- `npm run typecheck -- --pretty false` 通过。
- `npm run build` 通过。
- `npm run test:mcp` 通过。
- `python3 /Users/niallyoung/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/niallyoung/Desktop/Canvasight/plugins/canvasight` 通过。
- `codex plugin add canvasight@canvasight-local` 已刷新安装缓存。
- 浏览器测量通过：`.markdown-actions` 到 drawer/pane/viewport 右侧均为 `16px`，heading 到 pane 顶部为 `16px`，无横向溢出，控制台无报错。
