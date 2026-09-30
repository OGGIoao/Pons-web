import type { ProgressRepository } from './repository'
import type { CardProgress, ProgressStage } from './types'

const STORAGE_KEY = 'pons.progress.v1'

function load(): Record<string, CardProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, CardProgress>) : {}
  } catch {
    return {}
  }
}

function save(data: Record<string, CardProgress>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const localRepository: ProgressRepository = {
  version: 1,

  get(cardId) {
    return load()[cardId] ?? null
  },

  setStage(cardId, stage: ProgressStage) {
    const data = load()
    data[cardId] = { ...data[cardId], stage, updatedAt: new Date().toISOString() }
    save(data)
    // 同一标签页内跨页面同步
    window.dispatchEvent(new Event('pons-progress'))
  },

  setDraft(cardId, draft: string) {
    const data = load()
    data[cardId] = { ...data[cardId], draft, updatedAt: new Date().toISOString() }
    save(data) // 不打进度事件，草稿高频输入避免全站重渲染
  },

  setCode(cardId, code: string) {
    const data = load()
    data[cardId] = { ...data[cardId], code, updatedAt: new Date().toISOString() }
    save(data)
  },

  all() {
    return load()
  },
}
