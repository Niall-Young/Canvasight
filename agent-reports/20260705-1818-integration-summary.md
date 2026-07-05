# Canvasight 页面切换图标尺寸修复集成总结

## 时间
2026-07-05 18:18

## 触发问题
用户反馈页面切换控件在页面名称过长时，左侧页面图标和右侧下拉图标会被文字挤压导致尺寸变化。

## Agent Team 结论
- Product Agent：页面切换器属于核心工作区入口，长标题必须只截断文字，不影响图标和命令可识别性；README 不需要更新。
- Design Agent：控件应保持三段式布局，左右图标固定为 16px，不参与收缩；中间文字区域使用单行省略。
- Development Agent：根因是旧样式把 `.canvas-page-trigger span` 应用于所有 span，包括图标容器；建议给文本增加专用 class，并只让文本区域参与收缩。
- Test Supervisor Agent：需要验证 `typecheck`、`build`，并在浏览器里用长中英文标题确认图标尺寸、文字省略和控制台健康。
- Customer Support Agent：该变更属于细节 UI bugfix，不改变产品用法或命令，不更新 README。
- Design Standards Expert：需要把“紧凑控件中的图标槽位不可被长文本挤压”写入 `design.md`。

## 已实施
- 在页面切换触发器中为页面名称添加 `canvas-page-trigger-label`。
- 将图标样式限制为 `.canvas-page-trigger > .app-icon`，固定 16px 宽高和 `flex: 0 0 16px`。
- 将长标题截断逻辑移动到 `canvas-page-trigger-label`，使用 `min-width: 0`、`overflow: hidden`、`text-overflow: ellipsis`、`white-space: nowrap`。
- 在 `design.md` 增加紧凑控件、切换器和工具栏的图标固定槽位规则。

## 验证
- `npm run typecheck`：通过。
- `npm run build`：通过。
- Browser 验证目标流：`http://127.0.0.1:5173/` -> 创建测试页面 -> 重命名为长中文标题 -> 验证页面切换器。
- Browser 测量结果：
  - 页面标题：`Canvasight`。
  - 页面 URL：`http://127.0.0.1:5173/`。
  - 触发器尺寸：132px x 32px。
  - 左右图标尺寸：均为 16px x 16px。
  - 左右图标 flex：`flex-basis: 16px`、`flex-shrink: 0`。
  - 文本区域：`overflow: hidden`、`text-overflow: ellipsis`、`white-space: nowrap`、`min-width: 0px`。
  - 长标题验证：`scrollWidth` 406px，`clientWidth` 68px，确认为省略状态。
  - 控制台 error/warn：无。
- 测试中临时创建的长标题页面已删除，页面回到 `Page 1`。

## 未纳入本次提交的既有脏文件
以下文件在本轮开始前已存在未提交变更，或不属于本次图标尺寸修复，本轮不纳入提交：
- `AGENTS.md`
- `README.md`
- `plugins/canvasight/.codex-plugin/plugin.json`
- `plugins/canvasight/mcp/server.mjs`
- `plugins/canvasight/package-lock.json`
- `plugins/canvasight/package.json`
- `plugins/canvasight/skills/canvasight/SKILL.md`
- `plugins/canvasight/tests/mcp-smoke.mjs`
- `agent-reports/20260705-1807-integration-summary-browser-url-reachability.md`

## 下一步
本轮修复已满足验收，进入定向 staging 和中文规范提交。
