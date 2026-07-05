# 恢复任务清单 Drawer 安全边距
## 负责 Agent
开发 Agent
## Root Cause
任务清单和 Markdown 共用 `RightDrawer`，但 CSS 只给 `.markdown-pane` 设置了 `padding: 16px`。任务清单容器 `.task-sidebar` 只有 flex 布局，没有 padding 和 `box-sizing`，展开后标题和列表项直接贴到 `.right-drawer` 边缘。
## 调研过程
1. 检查 `RightDrawer.tsx`，确认 tasks 分支根容器为 `.task-sidebar`，Markdown 分支根容器为 `.markdown-pane`。
2. 检查 `app.css`，确认 `.markdown-pane` 有 `padding: 16px`，`.task-sidebar` 没有。
3. 浏览器测量修复前：标题左/上边距 0px，任务项左/右边距 0px。
4. 添加 `.task-sidebar { padding: 16px; box-sizing: border-box; }`。
5. 浏览器测量修复后：标题左/上边距 16px，任务项左/右边距 16px，控制台无 error/warn。
## 可选方案
1. 直接给 `.right-drawer` 加 padding。会影响 Markdown pane 和 resize 结构，风险更大。
2. 给 `.task-list` 加 padding。标题仍会贴顶部/左侧，不能完整解决。
3. 给 `.task-sidebar` 加与 `.markdown-pane` 一致的 padding。作用域精准，布局语义正确。
## 推荐方案
采用方案 3。只修复任务清单分支，保持 Markdown drawer、resize handle 和 right drawer 容器尺寸不变。
## 实施步骤
1. 在 `app.css` 中为 `.task-sidebar` 增加 `padding: 16px`。
2. 增加 `box-sizing: border-box`，避免 padding 扩大 drawer 实际宽度。
3. 热更新后浏览器测量 drawer 内标题和任务项安全边距。
## 风险与回滚
风险较低。任务项内容宽度从 288px 变为 256px，但仍在 drawer 可读范围内，且与 Markdown pane 视觉一致。回滚时删除 `.task-sidebar` 的 padding 和 box-sizing 即可。
## 验证方式
1. Browser：点击任务清单按钮后，`.task-sidebar` computed padding 为 16px；标题 left/top inset 为 16px；任务项 left/right inset 为 16px。
2. Browser：页面标题为 Canvasight，右侧任务清单渲染正常，控制台无 error/warn。
3. `npm run typecheck -- --pretty false`
4. `npm run build`
5. `npm run test:mcp`
6. 插件校验通过。
7. `codex plugin add canvasight@canvasight-local` 通过。
