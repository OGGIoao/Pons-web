import { useEffect, useRef, useState } from 'react'
import { progressRepo } from '../data'

/**
 * 译电草稿纸（阶段三）：先写伪代码，再写真代码。
 * 内容持久化到 ProgressRepository（换后端时跟着走），防抖自动保存。
 */
export function PracticePad({ cardId }: { cardId: string }) {
  const [draft, setDraft] = useState(() => progressRepo.get(cardId)?.draft ?? '')
  const [saved, setSaved] = useState(true)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onChange = (value: string) => {
    setDraft(value)
    setSaved(false)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      progressRepo.setDraft(cardId, value)
      setSaved(true)
    }, 500)
  }

  return (
    <div className="practice-pad">
      <div className="practice-pad-head">
        ✍️ 译电草稿纸 <span className="practice-pad-sub">先写伪代码：意图 → 标准操作，不用管语法</span>
        <span className="practice-pad-save">{saved ? '已存档' : '存档中…'}</span>
      </div>
      <textarea
        className="typewriter"
        rows={6}
        placeholder={'例：\n1. 如果 n 很小，直接返回已知值\n2. 否则：把问题切成内部 + 外部两半，各自递归，相乘'}
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    </div>
  )
}
