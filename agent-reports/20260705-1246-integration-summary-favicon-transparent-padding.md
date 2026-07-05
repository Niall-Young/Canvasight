# favicon 透明边距裁切集成总结

## 本轮目标
裁掉 favicon 的透明区域，让 Scatter logo 在浏览器标签页中更大、更清晰。

## 已解决
- 确认原 favicon 可见区域只有 `212x212`。
- 从原 Scatter 1024px app icon 裁切 alpha 可见区域并重采样为 `256x256`。
- 更新 HTML favicon 声明，补充 `sizes="256x256"`。

## 未解决
- 暂无。

## 下一轮分派
- 测试监督 Agent：重新运行构建和浏览器资源请求验证。

## 验收记录
- 裁切前 favicon alpha 可见区域为 `212x212`。
- 裁切后 `plugins/canvasight/public/favicon.png` 和 `plugins/canvasight/dist/favicon.png` 均为 `256x256`，alpha 可见区域为完整 `256x256`。
- `npm run build` 通过。
- `npm run test:mcp` 通过。
- 插件校验脚本通过。
- `curl -I http://127.0.0.1:5173/favicon.png` 返回 `200 OK`、`Content-Type: image/png`、`Content-Length: 45308`。
- 浏览器 head 读取结果为 `iconHref=/favicon.png`、`iconType=image/png`、`iconSizes=256x256`、`appleHref=/favicon.png`，控制台 warn/error 为空。
