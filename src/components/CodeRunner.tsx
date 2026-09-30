import { useEffect, useRef, useState } from 'react'
import { progressRepo } from '../data'
import { createPracticeEditor } from './practiceEditor'
import type { Card } from '../data/types'
import { runPractice, type RunResult } from '../pyodide/runner'

type Status = 'idle' | 'running' | 'done'

/**
 * 译电练习台（阶段四）：CodeMirror 打字机写代码 → 发送译电 → 浏览器内跑自测断言。
 * 通过后可一键盖章（写入 ProgressRepository）。
 */
export function CodeRunner({ card }: { card: Card }) {
  const editorHost = useRef<HTMLDivElement>(null)
  const editorRef = useRef<ReturnType<typeof createPracticeEditor> | null>(null)
  const persistTimer = useRef<number | undefined>(undefined)
  const [code, setCode] = useState(() => {
    const saved = progressRepo.get(card.id)
    return saved?.code ?? card.practice?.skeleton ?? ''
  })
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<RunResult | null>(null)

  // 防抖持久化：编辑器内容变化后自动存档，不用等点"发送"
  const persist = (value: string) => {
    setCode(value)
    window.clearTimeout(persistTimer.current)
    persistTimer.current = window.setTimeout(() => progressRepo.setCode(card.id, value), 800)
  }

  useEffect(() => {
    if (editorHost.current && !editorRef.current) {
      editorRef.current = createPracticeEditor(editorHost.current, code, persist)
    }
    return () => {
      window.clearTimeout(persistTimer.current)
      editorRef.current?.destroy()
      editorRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!card.practice) return null
  const practice = card.practice

  const send = async () => {
    const current = editorRef.current?.state.doc.toString() ?? code
    progressRepo.setCode(card.id, current)
    setStatus('running')
    setResult(null)
    const r = await runPractice(current, practice.testCode)
    setResult(r)
    setStatus('done')
    if (r.passed) progressRepo.setStage(card.id, 'solved')
  }

  const btnLabel = status === 'running' ? '📠 译电机运转中…' : '📠 发送译电'

  return (
    <div className="code-runner">
      <div className="practice-pad-head">
        🧪 译电练习台 <span className="practice-pad-sub">对照你的伪代码写下真实现，跑卡片同款自测</span>
      </div>
      <div ref={editorHost} className="practice-editor" />
      <div className="runner-actions">
        <button className="send-btn" onClick={send} disabled={status === 'running'}>
          {btnLabel}
        </button>
        <span className="runner-note">⏱ 5 秒熔断 · 首次加载 Python 需几秒 · 代码自动存档</span>
      </div>

      {result && (
        <div className={`receipt ${result.passed ? 'pass' : 'fail'}`}>
          <div className="receipt-title">
            {result.passed ? '✅ 回执：译电通过，断言全部成立' : result.timedOut ? '⏱ 回执：译电中断' : '❌ 回执：译电被驳回'}
          </div>
          {result.output && <pre className="receipt-output">{result.output}</pre>}
          {result.error && <pre className="receipt-output">{result.error}</pre>}
          {result.passed && (
            <div className="receipt-pass">
              已自动盖章「已通关」· 建议对照上方参考实现，看看你和他的思路差在哪
            </div>
          )}
        </div>
      )}
    </div>
  )
}
