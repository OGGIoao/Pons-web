import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { Markdown } from '../components/Markdown'
import { PracticePad } from '../components/PracticePad'
import { CodeRunner } from '../components/CodeRunner'
import { CaseList } from '../components/CaseList'
import { cards, progressRepo } from '../data'
import { STAGE_LABEL } from '../data/repository'
import type { Card, ProgressStage } from '../data/types'

function subscribe(cb: () => void) {
  window.addEventListener('pons-progress', cb)
  return () => window.removeEventListener('pons-progress', cb)
}

/** 10 分钟思考计时器：点击开始，到点提示，再点重置。 */
function ThinkTimer() {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (secondsLeft === null) return
    if (secondsLeft <= 0) return
    const t = window.setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => window.clearTimeout(t)
  }, [secondsLeft])

  const label =
    secondsLeft === null
      ? '⏳ 开始想 10 分钟'
      : secondsLeft <= 0
        ? '✅ 时间到，去验证思路吧'
        : `⏳ ${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`

  return (
    <button
      className={`think-timer ${secondsLeft !== null && secondsLeft > 0 ? 'running' : ''}`}
      onClick={() => setSecondsLeft(secondsLeft === null || secondsLeft <= 0 ? 10 * 60 : null)}
    >
      {label}
    </button>
  )
}

function useProgress(cardId: string) {
  const snapshot = useSyncExternalStore(subscribe, () => progressRepo.get(cardId)?.stage ?? 'new')
  return snapshot
}

const STAGE_HINTS = ['卡住了再拆封', '理解后自己写', '写完再对照']

export function CardPage({ card, openStages = [] }: { card: Card; openStages?: number[] }) {
  const stage = useProgress(card.id)
  const stages = useMemo(() => card.stages, [card])

  const mark = (s: ProgressStage) => {
    if (stage === s) return
    progressRepo.setStage(card.id, s)
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pt-10 pb-16">
      <a className="back-link" href="#/">← 返回目录柜</a>
      <div className="case-wrap">
        <div className="folder-tab">证物 · {card.no}</div>
        <div className="folder-body">
          <div className="doc">
            <div className="doc-head">
              <h2>🚩 {card.name}</h2>
              <span className="doc-no">
                PONS-{card.no} / {card.seq === 'core' ? '核心序列' : '跨界序列'}
                {card.scores && ` · ⚙${card.scores.utility} 🧠${card.scores.thinking} 🌐${card.scores.crossover}`}
              </span>
            </div>
            <span className="timer-chip">⏳ 纪律：先自己想 10 分钟，勿动证物</span>

            {card.image && (
              <figure className="polaroid">
                <img src={card.image} alt={`${card.name} 的证物照片`} />
                <figcaption>证物照片 · {card.no}</figcaption>
              </figure>
            )}

            <div style={{ marginTop: 20 }}>
              <Markdown text={card.stage1} />
            </div>

            {stages.map((s, i) => (
              <details key={s.stage} className="evidence" open={openStages.includes(i + 2)}>
                <summary>
                  {s.summary.replace(/<[^>]+>/g, '')}
                  <span className="hint">{STAGE_HINTS[i] ?? '拆开看看'}</span>
                </summary>
                <div className="evidence-body">
                  <Markdown text={s.content} />
                  {i === 1 && <PracticePad cardId={card.id} />}
                  {i === 2 && <CodeRunner card={card} />}
                  {i === 2 && card.cases.length > 0 && <CaseList card={card} />}
                </div>
              </details>
            ))}

            <div className="progress-bar">
              <span>借阅登记：</span>
              {(['new', 'thinking', 'solved'] as ProgressStage[]).map((s) => (
                <button key={s} className={stage === s ? 'active' : ''} onClick={() => mark(s)}>
                  {STAGE_LABEL[s]}
                </button>
              ))}
              <span style={{ marginLeft: 'auto', opacity: .6 }}>
                自测运行（Pyodide）将在下一迭代接入，当前请对照卡片内自测用例本地运行
              </span>
            </div>
          </div>
        </div>
      </div>
      <ThinkTimer />
      <p className="foot-note">PONS · {card.no} {card.name}</p>
    </div>
  )
}

export function CardPageById({ id, openStages = [] }: { id: string; openStages?: number[] }) {
  const card = cards.find((c) => c.id === id)
  if (!card) {
    return (
      <div className="mx-auto max-w-3xl px-6 pt-24 text-center">
        <p style={{ color: 'rgba(240,230,200,.6)', fontFamily: 'var(--mono)' }}>没有找到这张卡：{id}</p>
        <a className="back-link" href="#/">← 返回目录柜</a>
      </div>
    )
  }
  return <CardPage card={card} openStages={openStages} />
}
