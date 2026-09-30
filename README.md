# pons-web · 脑桥训练站

Pons 卡片系统的纯前端训练站。**导航/进度框架 = 图书馆卡片柜，阅读纸面 = 侦探档案**。

## 快速开始

```bash
npm install
npm run dev        # 开发服务器（自动解析内容 + 热更新）
npm run build      # 产物在 dist/，可丢到 GitHub Pages
```

## 防人肉维护架构（重要，改动前先读）

```
../pons-clone/patterns/*.md   ← 内容唯一事实来源（markdown 仓库）
            │  scripts/build-cards.mjs（vite 插件在 dev/build 时自动执行）
            ▼
    src/generated/cards.json   ← 自动生成，已 gitignore，禁止手改
            │
            ▼
        React UI（只读 cards.json 和 ProgressRepository）
```

- **加新卡**：只往 `../pons-clone/patterns/` 丢 `.md`（遵守 `_template.md` 结构），
  刷新页面即出现。零登记、零同步。
- **配插画**：往 `../pons-clone/assets/cards/` 丢 `<卡id>.png`（如 `001-catalan.png`），
  构建时自动复制到 `public/cards/` 并挂载到抽屉邮票位 + 卡页拍立得位。缺图不报错。
- **结构契约**：每张卡必须有「🚩 阶段一」正文 + 恰好 3 个 `<details>`（阶段二三四），
  解析失败会报错退出，半成品进不了站点。
- **内容目录**：默认读 `../pons-clone/patterns`，可用 `PONS_CONTENT_DIR` 环境变量覆盖。

## 迁移案例库（cases/*.md）

卡页底部「迁移案例」区块的数据源，与卡片 markdown 同库独立目录
（`../pons-clone/cases/`），管线按 frontmatter 里的卡片编号自动聚合、双向链接，
**加案例 = 丢一个文件，不动任何卡片**。

格式契约（每条违反即构建失败）：

```markdown
---
title: 案例标题
cards: [004]        # 关联的卡编号，可多张；引用了不存在的编号会报错
source: 真实出处    # 必填——拒绝"某大厂"式泛泛而谈
url: https://...    # 可选
---

## 场景
（什么真实场景撞上这张卡，≥20 字符）

## 信号
（怎么认出它在考这张卡，≥20 字符）

## 桥接
（怎么把卡的思路套过去，≥20 字符）

## 解答
```python
# 可运行的解答代码——Python 解答会在构建时被当场编译校验，
# 跑不过的解答进不了站点。选题优先信息竞赛 / LeetCode 这类有标准题面的题目。
```
```

- 「场景 / 信号 / 桥接」三段缺一或过短（<20 字符）都会让构建直接失败，
  用可执行契约挡住泛泛而谈。
- 「解答」必填且必须含一个代码块；非 Python 语言按纯文本渲染（不高亮报错）。
- 案例按标题拼音排序后挂载到对应卡页，同一案例可挂多张卡；
  展开案例即可看到解答代码（与卡片代码块同一套高亮）。

## 语法高亮调色板（SSOT）

token → 颜色的**映射只此一份**（`.hljs-*` / CodeMirror 都只消费变量），
调色板"值"按纸面分两套，都在 `src/theme.css` 里：

- `:root` 的 `--tok-kw / --tok-str / --tok-num / --tok-fn / --tok-cm /
  --tok-builtin / --tok-attr` 七个变量 = **浅色纸面**默认值（练习台编辑器）；
- `.doc .md pre` 里同名的七个变量 = **暗色代码块**（markdown / 案例解答代码）
  的覆写值——改暗色块颜色只改这一处，绝不按 `.hljs-xxx` 选择器重写。

明暗两套纸面上的同一代码永远保持各自可读，又永远只有一份 token 映射。

## 数据层

UI 只依赖 `src/data/repository.ts` 的 `ProgressRepository` 接口，
当前实现是 `localRepository`（localStorage，key: `pons.progress.v1`）。
将来上后端：新实现一个 `ApiRepository`，改 `src/data/index.ts` 一行即可。

## 目录

```
scripts/build-cards.mjs   内容管线（解析 + 结构校验 + 生成 cards.json）
src/data/                 类型 + 进度仓库接口 + localStorage 实现
src/pages/HomePage.tsx    卡片柜抽屉墙（按 seq 分核心/跨界两排）
src/pages/CardPage.tsx    侦探档案卡页（证物袋防偷看 + 10 分钟计时器 + 借阅登记）
src/theme.css             全部视觉（深木黄铜柜 + 牛皮纸案卷）
```

## 已实现功能

- 🗄️ **卡片柜首页**：核心 7 抽 + 跨界 4 抽，黄铜拉手，抽出卡片带插画邮票、三围分数和印章状态
- 🗂️ **侦探档案卡页**：牛皮纸档案袋 + 证物袋式防偷看折叠（阶段二三四），markdown 全文渲染
- ✍️ **译电草稿纸**（阶段三）：先写伪代码，防抖自动存档
- 🧪 **译电练习台**（阶段四）：浏览器内真跑 Python（Pyodide/Web Worker），5 秒熔断防死循环，通过自测自动盖章「已通关」；代码自动存档下次接着写
- ⏳ **10 分钟思考计时器** + 深链直达阶段（`#/card/001?open=3,4`）
- 🎨 **全站语法高亮**：markdown 代码块（highlight.js）与练习台编辑器（CodeMirror）
  共用 theme.css 的 `--tok-*` 调色板，改一处全站同色
- 🧳 **迁移案例区块**（阶段四）：真实场景案例库，构建期自动聚合，来源必填
- 🖼️ **插画约定式挂载**：`assets/cards/<卡id>.png` 存在即上抽屉邮票位 + 卡页拍立得位

## 技术备注

- Pyodide 走 unpkg CDN（jsdelivr 在本机网络不可达，实测 2026-09）；首次"发送译电"时懒加载，浏览器缓存后秒开
- 练习台素材（自测用例 + 代码骨架）构建期从卡片 markdown 零复制提取；
  骨架只取顶层 `def` 签名 + import，并会过一遍 Python 编译校验，编译不过直接构建失败
- 练习台骨架提取对"参考实现"里的多行签名、注释行、嵌套函数均已免疫

## 已知待办

- 图灵机卡的动画在 `__name__` 守卫下静态展示，自测不受影响
- bundle 超 500kB 警告（highlight.js 全量引入所致），可后续按路由 code-split，不紧急
