# 裁切 Scatter favicon 透明边距

## 负责 Agent
开发 Agent

## Root Cause
原 Scatter app icon 为桌面应用场景保留了透明外边距，浏览器 favicon 会把完整 256px 画布缩进到标签页图标框内，导致主体视觉偏小。

## 调研过程
1. 使用 PNG alpha 通道检测 `plugins/canvasight/public/favicon.png`。
2. 确认 256px 图标的可见 alpha 边界为 `(22,22)-(234,234)`。
3. 回到原仓库 1024px 图标，从高分辨率源图按 alpha bbox `(88,88)-(936,936)` 裁切，再缩放到 256px，减少重采样损失。

## 可选方案
1. 直接裁切当前 256px favicon。
2. 从原 1024px app icon 裁切透明边界后重采样到 256px。
3. 手工重绘 favicon。

## 推荐方案
采用方案 2。它复用原 Scatter logo，去掉透明边距，同时比裁当前 256px 文件有更好的边缘质量。

## 实施步骤
1. 从原 Scatter `resources/app-icon.png` 读取 alpha 边界。
2. 裁切透明区域。
3. 使用 LANCZOS 缩放回 `256x256` 并覆盖 `plugins/canvasight/public/favicon.png`。
4. 在 favicon link 上补充 `sizes="256x256"`。
5. 重新构建，确认 `dist/favicon.png` 同步。

## 风险与回滚
裁切会让桌面应用图标的原始留白消失，但这只用于网页 favicon。回滚时重新复制原 `resources/icons/app-icon-256.png` 即可。

## 验证方式
1. 检查新 favicon alpha 边界接近完整画布。
2. `npm run build`
3. 通过 HTTP 请求确认 `/favicon.png` 返回新 PNG。
