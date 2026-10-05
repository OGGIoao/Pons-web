import { localRepository } from './localRepository'
import { localSparkRepository } from './localSparkRepository'
import type { CardsData } from './types'
import raw from '../generated/cards.json'

/** 换后端时：把这两行换成新的实现即可，全站 UI 无感。 */
export const progressRepo = localRepository
export const sparkRepo = localSparkRepository

export const cardsData = raw as unknown as CardsData
export const cards = cardsData.cards
