import type { Spark } from './types'

/**
 * 火花数据层的唯一抽象，与 ProgressRepository 同一套模式：
 * 阶段一用 localStorage；将来接后端新增一个 ApiSparkRepository
 * 并在 index.ts 里切换即可，UI 零改动。
 */
export interface SparkRepository {
  list(cardId: string): Spark[]
  add(input: { cardId: string; text: string; linkNo: string | null; wishName: string }): Spark
  remove(id: string): void
  all(): Spark[]
  readonly version: number
}

/** 火花变更事件名：同页同步用（与 pons-progress 同套路） */
export const SPARKS_EVENT = 'pons-sparks'
