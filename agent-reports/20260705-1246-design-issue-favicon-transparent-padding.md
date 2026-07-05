# favicon 透明边距导致标签页图标偏小

## 发现者
设计 Agent

## 现象
Canvasight 标签页中的 Scatter logo 显示偏小，原因是原应用图标 PNG 四周包含透明边距。

## 影响范围
影响浏览器标签页和收藏等小尺寸场景中的品牌识别，图标主体占比不足。

## 复现步骤
1. 打开 Canvasight 网页。
2. 观察浏览器标签页 favicon。
3. 对比原 PNG alpha 边界，确认透明区域占用了外圈空间。

## 证据
`plugins/canvasight/public/favicon.png` 原尺寸为 `256x256`，alpha 可见区域为 `(22,22)-(234,234)`，实际主体只有 `212x212`。

## 初步归因
直接复用客户端应用图标作为网页 favicon 时，没有针对浏览器小尺寸场景裁掉透明 padding。

## 交付给哪个 Agent
开发 Agent

## 需要回答的问题
如何保留 Scatter logo 外观，同时提升 favicon 在浏览器标签页中的可见占比。
