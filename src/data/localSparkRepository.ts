import { SPARKS_EVENT } from './sparkRepository'
import type { SparkRepository } from './sparkRepository'
import type { Spark } from './types'

const STORAGE_KEY = 'pons.sparks.v1'

function load(): Spark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Spark[]) : []
  } catch {
    return []
  }
}

function save(data: Spark[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function notify(): void {
  // 同一标签页内跨组件同步；跨标签页由 'storage' 事件兜底（组件层订阅）
  window.dispatchEvent(new Event(SPARKS_EVENT))
}

export const localSparkRepository: SparkRepository = {
  version: 1,

  list(cardId) {
    return load().filter((s) => s.cardId === cardId)
  },

  add(input) {
    const spark: Spark = {
      id: `sp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      ...input,
      createdAt: new Date().toISOString(),
    }
    save([...load(), spark])
    notify()
    return spark
  },

  remove(id) {
    save(load().filter((s) => s.id !== id))
    notify()
  },

  all() {
    return load()
  },
}
