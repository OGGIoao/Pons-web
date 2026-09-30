import type { CardProgress, ProgressStage } from './types'

/**
 * 进度数据层的唯一抽象。UI 只依赖这个接口：
 * 阶段一用 localStorage 实现；阶段三换后端时新增一个 ApiRepository
 * 并在 index.ts 里切换即可，UI 零改动。
 */
export interface ProgressRepository {
  get(cardId: string): CardProgress | null
  setStage(cardId: string, stage: ProgressStage): void
  /** 译电草稿纸（伪代码）读写 */
  setDraft(cardId: string, draft: string): void
  /** 练习台代码存档 */
  setCode(cardId: string, code: string): void
  all(): Record<string, CardProgress>
  /** 数据 schema 版本，迁移时递增 */
  readonly version: number
}

export const STAGE_LABEL: Record<ProgressStage, string> = {
  new: '未开始',
  thinking: '思考中',
  solved: '已通关',
}
