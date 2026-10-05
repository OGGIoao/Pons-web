# 脑桥 · Pons 训练站

> **大脑里负责在不同区域之间传递信号的桥梁。**
> Pons 做同样的事——在"意图"和"代码"之间、在"一个问题"和"一个思路"之间架桥。

[![在线体验](https://img.shields.io/badge/在线体验-oggioao.github.io%2FPons--web-b3261e)](https://oggioao.github.io/Pons-web/)
[![内容仓库](https://img.shields.io/badge/内容仓库-OGGIoao%2FPons-1e6b46)](https://github.com/OGGIoao/Pons)

一套同时练**"翻译"和"思维"**的算法卡片系统的 Web 训练站。
卡片不教 API，教的是"看到什么问题 → 想起哪个模式"的条件反射：
每张卡把一个经典算法模式包装成一张**侦探档案**——先给案件现场（真实问题），
再给一个"思维跳板"，最后逼你把它**翻译成代码**并当场跑过自测。

![证物照片示例](https://raw.githubusercontent.com/OGGIoao/Pons/master/assets/cards/104-turing-machine.png)

---

## 打开即玩

**[https://oggioao.github.io/Pons-web/](https://oggioao.github.io/Pons-web/)** — 纯前端静态站，无需注册，进度存在你自己的浏览器里。

### 三个角色，三种玩法

```
🗄️ 卡片柜（首页）          🗂️ 侦探档案（卡页）           ✍️ 译电台（练习）
┌──────────────┐          ┌──────────────────┐          ┌────────────────┐
│ 11 个黄铜抽屉 │  拉开 →   │ 阶段一：案件现场   │  想 10 分钟  │ 草稿纸：先写伪代码│
│ 邮票=插画     │          │ 阶段二：提示链     │  ↓ 再拆开   │ 练习台：真跑 Python│
│ 印章=通关状态 │          │ 阶段三：核心洞察   │            │ 发送译电 → 回执    │
└──────────────┘          │ 阶段四：参考实现   │            │ 过了自动盖章      │
                          │   + 迁移案例       │            └────────────────┘
                          └──────────────────┘
```

- **拆档案**：阶段二三四折叠防偷看——纪律是"先自己想 10 分钟"（页面上真有计时器）
- **译电**：练习台在浏览器里跑真 Python（Pyodide/Web Worker），代码自动存档，通过全部断言自动盖「已通关」印章
- **迁移**：每张卡附 2-3 个真实场景案例（力扣/洛谷/POJ 题 + 工程实践），点开有**实测可运行**的解答代码对照

## 快速开始（本地开发）

```bash
npm install
npm run dev      # 开发服务器（自动解析内容 + 热更新）
npm run build    # 产物在 dist/；内容管线会先做结构校验
npm run preview  # 本地预览构建产物
```

> 内容默认读 sibling 目录 `../pons-clone`（[内容仓库](https://github.com/OGGIoao/Pons) 的克隆），
> 可用 `PONS_CONTENT_DIR` 环境变量指向任意 patterns 目录。

## 双仓库结构

```
OGGIoao/Pons        ← 内容：卡片 markdown + 迁移案例 + 插画（单一事实来源）
       │
       │  build-cards.mjs（CI / dev / build 时自动执行）
       ▼
OGGIoao/Pons-web    ← 本站：管线 + React UI（只读生成物）
```

**改内容永远只动 Pons 仓库**；本站仓库只关心展示和交互。
push 本站 → Pages 自动重新构建部署；push Pons（内容）→ 其 CI 自检通过后会自动
触发本工作流重建，全程无需手动操作（见 Pons 仓 README 的「两个仓库」）。

## 内容协作（加东西 = 丢文件，零登记）

内容契约全部由管线在构建期强制执行，违反即构建失败：

| 你要加什么 | 做什么 | 契约 |
|---|---|---|
| 新卡片 | 往 `patterns/` 丢 `.md`（照 `_template.md`） | 阶段一正文 + 恰好 3 个 `<details>`；🧪 自测用例 + 参考实现会被自动提取成练习台 |
| 迁移案例 | 往 `cases/` 丢 `.md` | frontmatter 声明 `cards: [编号]` 自动双向挂载；场景/信号/桥接各 ≥20 字符；**解答代码必填**，Python 解答当场编译校验 |
| 插画 | 往 `assets/cards/` 丢 `<卡id>.png` | 约定式挂载：抽屉邮票位 + 卡页拍立得位，缺图优雅降级 |
| 改高亮配色 | 只动 `pons-web/src/theme.css` | `--tok-*` 七个变量是唯一出处；明暗两套纸面各覆写一次值，token 映射只有一份 |

卡片清单、案例关联、骨架提取全部是 glob 自动发现——**不存在需要人工同步的清单**。

## 架构要点

- **内容管线** `scripts/build-cards.mjs`：markdown → `cards.json`。练习台骨架只取顶层 `def` 签名，且每张卡的骨架都要过一遍 Python 编译——半成品进不了站点
- **进度层** `src/data/repository.ts` 的 `ProgressRepository` 接口：现在是 localStorage 实现，将来上后端只需新实现一个 `ApiRepository`，改 `src/data/index.ts` 一行
- **火花层** `src/data/sparkRepository.ts` 的 `SparkRepository` 接口：读者在「这个模式还出现在……」下添的迁移联想（可深链关联卡，也可许愿不存在的卡进首页火花信箱）；同为 localStorage 实现，接后端即成共享选题池
- **语法高亮 SSOT**：highlight.js（markdown）与 CodeMirror（练习台）消费同一份 `--tok-*` 调色板
- **路由**：hash 路由（`#/card/001?open=3,4`），静态托管友好，支持深链直达某张卡的某个阶段

## 部署

GitHub Actions 全自动（`.github/workflows/deploy.yml`）：

1. push 到 `main` → 并行检出**本站 + 内容仓库**两个仓库
   （内容仓库更新后，也可在 Actions 手动 Run workflow 触发重建）
2. `npm ci && GH_PAGES=true npm run build`（内容管线 + `/Pons-web/` 子路径 base）
3. 产物上传 GitHub Pages，约 1 分钟后线上生效

## 目录

```
scripts/build-cards.mjs   内容管线（解析 + 结构/编译校验 + 生成 cards.json）
src/data/                 类型 + 进度仓库接口 + localStorage 实现
src/pages/HomePage.tsx    卡片柜抽屉墙（核心/跨界两排）
src/pages/CardPage.tsx    侦探档案卡页（防偷看折叠 + 计时器 + 案例 + 练习台挂载）
src/components/           Markdown 渲染、案例列表、CodeMirror 练习台、Pyodide Runner
src/theme.css             全部视觉（深木黄铜柜 + 牛皮纸案卷 + --tok-* 调色板）
.github/workflows/        Pages 自动部署
```

## 已知待办

- bundle 超 500kB（highlight.js 全量引入所致），可后续按路由 code-split
- Pyodide 走 unpkg CDN（jsdelivr 在某些网络不可达），首次"发送译电"需几秒加载
- 图灵机卡的动画在 `__name__` 守卫下静态展示，自测不受影响
