/** 卡片结构 —— 与 scripts/build-cards.mjs 的输出契约保持一致。
 *  改动这里的字段，必须同步改生成脚本（它是 SSOT 的解析方）。 */
export interface CardScores {
  utility: number
  thinking: number
  crossover: number
}

export interface FoldStage {
  stage: string // 二 | 三 | 四
  summary: string
  content: string // markdown
}

/** 迁移案例（cases/*.md 解析产物，契约见 build-cards.mjs） */
export interface CaseStudy {
  title: string
  source: string // 真实出处（必填）
  url: string | null // 可点链接（可选）
  scene: string // 具体场景
  signal: string // 识别信号
  bridge: string // 桥接方法
  solution: string // 解答代码（契约：必填，Python 已过编译校验）
  solutionLang: string // 'python' | 'plaintext'（其余语言统一纯文本渲染）
}

export interface Card {
  id: string // 文件名去扩展名，如 001-catalan
  no: string // 三位编号，如 001
  name: string
  seq: 'core' | 'cross'
  scores: CardScores | null
  oneliner: string | null
  /** 插画路径（/cards/<id>.png），无图为 null */
  image: string | null
  stage1: string // markdown
  stages: FoldStage[]
  /** 练习台素材：自测用例 + 伪代码骨架；缺代码的卡为 null */
  practice: { testCode: string; skeleton: string } | null
  /** 关联的迁移案例（cases/ 目录按 frontmatter 自动聚合） */
  cases: CaseStudy[]
}

export interface CardsData {
  generatedFrom: string
  cardCount: number
  cards: Card[]
}

/** 学习进度。stage: new=未开始 thinking=思考中 solved=已通关
 *  draft = 「译电草稿纸」里的伪代码，用户自己的思考产物 */
export type ProgressStage = 'new' | 'thinking' | 'solved'

export interface CardProgress {
  stage: ProgressStage
  draft?: string // 伪代码草稿（译电草稿纸）
  code?: string // 练习台里用户写的代码
  updatedAt: string // ISO
}
