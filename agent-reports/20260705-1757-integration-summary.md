# 页面名称编辑退出交互修复摘要

## 本轮目标

修复页面名称进入编辑态后，点击输入框外部不能自动退出的问题。

## 角色决策

- Product Agent：确认这是页面管理的核心编辑体验，不应要求用户必须按回车。
- Design Agent：确认内联编辑应支持点击外部提交并退出，符合轻量工作台交互预期。
- Development Agent：在页面名称输入框上增加 ref，并用 document 捕获阶段 `pointerdown` 判断外部点击后提交重命名。
- Test Supervisor Agent：执行 typecheck、build 和浏览器交互验证。
- Customer Support Agent：本次不改变用户文档级功能、安装或命令，不更新 README。
- Design Standards Expert：将“内联名称/标题编辑点击外部提交、Enter 提交、Escape 取消”加入 `design.md`。
- Development Standards Lead：本轮不改变 repo 流程或命令，不更新 `AGENTS.md`。
- Project Management Agent：检查 git diff 范围并提交中文 conventional commit。

## 本轮变更

- `plugins/canvasight/src/App.tsx`
  - 为页面名称输入框添加 `pageNameInputRef`。
  - 在重命名状态下注册 document 捕获阶段 `pointerdown` 监听。
  - 点击输入框外部时调用 `commitRenamePage()`，避免 React Flow 画布层阻止 blur 导致编辑态卡住。
- `design.md`
  - 补充内联编辑交互基线。
- `plugins/canvasight/dist`
  - 重新构建后更新 hashed JS 和 `index.html` 引用。

## 验证

- `npm run typecheck` 通过。
- `npm run build` 通过。
- `npm run dev` 复用 `http://127.0.0.1:5173`。
- 内置浏览器验证：
  - 页面标题：`Canvasight`。
  - 当前地址：`http://127.0.0.1:5173/`。
  - 控制台 error/warn：无。
  - 打开页面操作菜单，点击“重命名页面”，输入框出现。
  - 点击画布外部后，`.canvas-page-name-input` 消失，`.canvas-page-trigger` 恢复显示 `Page 2`。

## 已知说明

- 内置浏览器的 `domSnapshot()` 在本轮返回运行时方法缺失错误，因此验证改用只读 DOM evaluate、locator 点击和截图。

## Git 状态

- 等待暂存并提交本轮修改。
