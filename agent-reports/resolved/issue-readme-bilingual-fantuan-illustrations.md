---
schema_version: 1
report_id: issue-readme-bilingual-fantuan-illustrations
report_type: issue
status: resolved
owner: Customer Support Agent
created_by: Main Thread
priority: medium
version: 2
agent_id: /root/customer_support_agent
thread_id: null
created_at: 2026-07-13T05:23:33Z
updated_at: 2026-07-13T05:36:23Z
depends_on:
  - issue-readme-codex-install-prompt
related_files:
  - README.md
  - images/
  - guide.md
verification_status: passed
verification_evidence:
  - Six 1672 by 941 PNG illustrations exist in the repository
  - Chinese and English sets use separate localized labels
  - README references exactly three images per language with localized alt text
  - Visual review confirmed locked mascot anatomy and quiet inline composition
  - git diff --check and plugin validation passed
solution_report: solution-readme-bilingual-fantuan-illustrations
---

# README 需要中英文分开的“小饭团”配图

## 处理结果

- 使用小饭团 model sheet 和正面身份参考生成中文 3 张、英文 3 张。
- 中文图只保留中文短标签；英文图只保留英文短标签。
- 图片分别覆盖安装、首次打开、创建/调整/Run 三个新手节点。
- README 在两种语言的对应步骤引用各自图片和 alt text。
- `guide.md` 记录六张图片的插入位置、目的、场景、角色约束和提示词摘要。

## 修改文件

- `README.md`
- `guide.md`
- `images/fantuan-illustration-{zh,en}-{01,02,03}.png`

## 验证方式

- 图片尺寸、存在性和 README 引用数量检查
- 逐图视觉检查：语言、角色、肢体、节点结构和视觉重量
- `git diff --check`
- Plugin validator

## 后续风险

- 图片为生成式位图；若未来修改 README 文案，需要同步检查图内短标签与 guide 锚点。
