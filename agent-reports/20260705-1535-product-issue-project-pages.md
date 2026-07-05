# 项目内缺少隔离 Page 工作区

## 发现者
产品 Agent

## 现象
Canvasight 当前一个项目只持久化一组 `nodes/edges/viewport`，用户无法在同一个项目下创建多个相互隔离的画布工作区。

## 影响范围
- 同一项目内不同任务流、方案或上下文会混在同一张画布中。
- 右侧任务列表、Markdown 预览、运行上下文无法表达当前属于哪个画布工作区。
- 用户需要手动新建项目才能分隔工作流，和“项目下新的画布工作区”的预期不一致。

## 复现步骤
1. 打开 Canvasight 项目。
2. 在画布中创建多个节点和连线。
3. 尝试在同一项目内开启另一张独立画布。
4. 当前 UI 没有 Page 切换或新建入口，数据模型也只有单组节点和边。

## 证据
- `shared/types.ts` 原始 `ScatterDocument` 只有根级 `viewport/nodes/edges`。
- `scatterStore.ts` 原始状态只维护当前项目的一组 `nodes/edges`。
- 用户截图标注了画布左上角需要增加 page 概念入口。

## 初步归因
从客户端迁移到网页插件时保留了单画布项目模型，没有补项目内多工作区导航和持久化投影。

## 交付给哪个 Agent
开发 Agent

## 需要回答的问题
- 如何在不破坏 `.scatter/scatter.json` v1 兼容的前提下加入 pages？
- 切换 page 时哪些 UI 状态必须隔离或重置？
- 附件、Markdown run 和旧顶层 `nodes/edges` 应如何处理？
