---
status: resolved
report_type: solution
owner: Development Agent
created_by: Development Agent
priority: high
created_at: 2026-08-05 19:48
updated_at: 2026-08-05 19:48
related_issue: agent-reports/resolved/20260805-1938-issue-file-asset-format-icons-layout.md
related_files:
  - plugins/canvasight/src/assets/icons/icon/file-format-*.svg
  - plugins/canvasight/src/lib/assetPresentation.ts
  - plugins/canvasight/src/components/AssetNode.tsx
  - plugins/canvasight/src/styles/app.css
  - plugins/canvasight/tests/asset-presentation-smoke.mjs
---

# 文件 Asset 使用指定格式 SVG 与横排信息布局

## 负责 Agent

Development Agent

## 对应问题

`agent-reports/resolved/20260805-1938-issue-file-asset-format-icons-layout.md`

## Root Cause

上一版为了去除嵌套灰卡，把普通文件内容收缩成了居中的通用仓库图标，并通过静态测试禁止文件名和尺寸显示；这同时丢失了格式辨识度、必要的信息层级和参考图要求的横排结构。

## 调研过程

- 检查现有 Icon registry，确认其 `import.meta.glob` 能直接注册新增 SVG，无需引入第二套图标渲染路径。
- 检查 Asset 类型与 MIME/扩展名逻辑，把视频检测从文件图标映射中拆开，避免收紧普通文件映射时破坏视频节点。
- 对比纯文字 Task 的 16 px padding、Asset 固定 360 px 宽度以及常驻分类/More 控制层，确定文件内容侧边与底部 16 px、顶部保留控制行后的紧凑 132 px 高度。

## 可选方案

- 方案 A：继续复用仓库旧通用图标并只调整布局。无法满足用户指定 SVG，放弃。
- 方案 B：把用户 SVG 作为图片路径单独渲染。会绕过现有 Icon registry，放弃。
- 方案 C：原样加入现有 SVG registry，建立明确格式映射和统一 unknown 回退。采用。

## 推荐方案

采用方案 C。它保持唯一图标基础设施，精确复用用户资产，并让未知格式行为简单、可测试。

## 实施步骤

1. 原样加入 PDF、unknown、code、MD、PPT、CSV、XLS、DOC 八个 SVG。
2. 建立扩展名与 MIME fallback 映射；常见代码扩展使用 code，其余普通格式一律 unknown；视频扩展单独检测。
3. 把文件 Asset 改成 48 px 图标加文件名和 `FORMAT · SIZE` 的横排结构。
4. 将卡片压缩到 360 × 最小 132 px 的单层表面，保留分类、More 和左右 Handle。
5. 更新静态门禁、设计基线、中英文 README 和 web distribution。

## 风险与回滚

风险集中在 MIME-only 文件、超长文件名和视频扩展识别。扩展名优先、MIME 次级、unknown 封闭回退；文件名使用 ellipsis；视频检测独立。回滚时可恢复旧映射与文件 summary，但不应删除用户提供的受管 SVG。

## 处理结果

已修复。

## 修改文件

- `plugins/canvasight/src/assets/icons/icon/file-format-*.svg`
- `plugins/canvasight/src/lib/assetPresentation.ts`
- `plugins/canvasight/src/components/AssetNode.tsx`
- `plugins/canvasight/src/styles/app.css`
- `plugins/canvasight/tests/asset-presentation-smoke.mjs`
- `plugins/canvasight/dist/index.html`
- `plugins/canvasight/dist/assets/*`
- `README.md`
- `design.md`
- `design-qa.md`

## 验证方式

- 八个目标 SVG 与 Downloads 源文件逐字节比较，并运行 XML 校验。
- `npm run test:asset-presentation`
- `npm run build`
- `npm run check:mcp-bundle`
- plugin validation
- 真实浏览器验证 MD、unknown、图片、视频、More、Role、Handle/Edge 和控制台。

## 后续风险

真实 Codex native Widget 未执行 exact-version host acceptance，本轮保持 unverified；browser/dev 验证不能替代该门禁。
