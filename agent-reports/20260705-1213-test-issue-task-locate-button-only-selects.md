# 任务清单定位按钮只选中任务不切换画布视图
## 发现者
测试监督 Agent
## 现象
任务清单条目右侧的定位按钮点击后，只会让任务条目进入选中状态，没有把画布 viewport 切换/移动到对应节点。
## 影响范围
影响任务清单作为导航入口的核心用途。用户在复杂画布中无法从任务列表快速回到目标节点，只能看到任务被 focus/selected。
## 复现步骤
1. 打开 Canvasight 并展开任务清单 drawer。
2. 将画布平移到目标节点不可见的位置。
3. 点击任务条目右侧的定位按钮。
4. 观察任务被选中，但 React Flow viewport transform 没有变化，目标节点仍不可见。
## 证据
浏览器验证中，点击前后 viewport 都是 `translate(-669.127px, 310.178px) scale(0.723559)`，目标节点 `visibleInCanvas=false`。命中测试显示定位按钮区域的 `elementFromPoint` 命中外层 `.kit-task-item.is-active`，不是内部定位按钮。
## 初步归因
任务项 action 容器 `.kit-task-item-actions` 默认 `pointer-events: none`。任务项被选中但没有 hover/focus-visible 时，定位按钮虽然在 DOM 中，但无法接收点击，点击落到外层任务项。
## 交付给哪个 Agent
开发 Agent
## 需要回答的问题
1. 定位按钮是否需要独立于外层任务项点击行为？
2. 定位应只选中节点，还是同时移动 React Flow viewport？
3. 修复 action 命中后是否会影响运行按钮和键盘操作？
