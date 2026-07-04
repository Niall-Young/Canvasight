# 节点悬停时相连线条不再变色
## 发现者
测试监督 Agent
## 现象
鼠标悬停节点时，与该节点相连的边没有变成高亮色。
## 影响范围
影响画布关系阅读体验。复杂流程中用户无法通过 hover 快速识别当前节点的上下游连接。
## 复现步骤
1. 打开 Canvasight 画布并存在多个已连接节点。
2. 将鼠标悬停到任一有连接的节点上。
3. 观察与该节点相连的边仍为灰色，没有高亮。
## 证据
`ScatterEdge` 已支持 `data.active` 并输出 `scatter-edge-path is-active`；CSS 也有 `.scatter-edge-path.is-active { stroke: var(--color-primary); }`。但 `flowEdges` 只接收 `selectedNodeId` 和 `connectionPreview`，普通 hover 节点没有进入 active 计算。
## 初步归因
迁移/恢复连接交互时保留了“选中节点”和“连线预览”的边高亮，但丢失了普通节点 hover 状态。
## 交付给哪个 Agent
开发 Agent
## 需要回答的问题
1. hover 状态应复用 `data.active` 还是新增 edge class？
2. 正在拖拽连线时 hover 预览是否仍应优先？
3. 浏览器中如何验证 hover 后相连边 class 和 stroke 变化？
