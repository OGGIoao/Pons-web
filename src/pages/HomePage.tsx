import { useSyncExternalStore } from 'react'
import { cards, progressRepo, sparkRepo } from '../data'
import { SPARKS_EVENT } from '../data/sparkRepository'
import { STAGE_LABEL } from '../data/repository'
import type { ProgressStage, Spark } from '../data/types'

function subscribe(cb: () => void) {
  window.addEventListener('pons-progress', cb)
  window.addEventListener(SPARKS_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener('pons-progress', cb)
    window.removeEventListener(SPARKS_EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

/** 进度快照（JSON 字符串保证 getSnapshot 稳定，不会引发无限重渲染） */
function useProgressSnapshot(): Record<string, { stage: ProgressStage }> {
  const snap = useSyncExternalStore(subscribe, () => JSON.stringify(progressRepo.all()))
  return JSON.parse(snap) as Record<string, { stage: ProgressStage }>
}

/** 火花快照 */
function useSparkSnapshot(): Spark[] {
  const snap = useSyncExternalStore(subscribe, () => JSON.stringify(sparkRepo.all()))
  return JSON.parse(snap) as Spark[]
}

function Drawer({ id, no, name, oneliner, stamp, image }: {
  id: string; no: string; name: string; oneliner: string | null; stamp: ProgressStage; image: string | null
}) {
  return (
    <a className="drawer" href={`#/card/${id}`}>
      <div className="label-holder">NO.{no} {name.slice(0, 10)}</div>
      <div className="handle" />
      <div className="slot-card">
        {image && <img className="stamp-img" src={import.meta.env.BASE_URL + image.replace(/^\//, '')} alt="" />}
        <div className="no">3×5 INDEX · {no}</div>
        <h3>{name}</h3>
        <p>{oneliner ?? ''}</p>
        <div style={{ marginTop: 8 }}>
          <span className={`stamp ${stamp === 'new' ? 'todo' : stamp === 'thinking' ? 'doing' : 'done'}`}>
            {STAGE_LABEL[stamp]}
          </span>
        </div>
      </div>
    </a>
  )
}

export function HomePage() {
  const progress = useProgressSnapshot()
  const sparks = useSparkSnapshot()
  const stageOf = (id: string): ProgressStage => progress[id]?.stage ?? 'new'

  // 愿望单：linkNo 为 null 的火花按 wishName 聚合，成为下一张卡的选题池
  const wishGroups = new Map<string, { count: number; from: Set<string> }>()
  for (const s of sparks) {
    if (s.linkNo !== null || !s.wishName) continue
    const g = wishGroups.get(s.wishName) ?? { count: 0, from: new Set<string>() }
    g.count += 1
    g.from.add(s.cardId)
    wishGroups.set(s.wishName, g)
  }
  const wishes = [...wishGroups.entries()].sort((a, b) => b[1].count - a[1].count)
  const cardName = (id: string) => cards.find((c) => c.id === id)?.no ?? id

  const core = cards.filter((c) => c.seq === 'core')
  const cross = cards.filter((c) => c.seq === 'cross')

  return (
    <div className="mx-auto max-w-5xl px-6 pt-12 pb-16">
      <header className="text-center mb-12">
        <div className="plaque">
          <h1>脑桥目录柜</h1>
          <span className="en">PONS CARD CATALOG</span>
        </div>
        <p style={{ color: 'rgba(240,230,200,.55)', marginTop: 18, fontSize: 13, letterSpacing: '.2em', fontFamily: 'var(--mono)' }}>
          抽 屉 即 卡 片 · 借 阅 请 登 记
        </p>
      </header>

      <div className="shelf-title">
        <h2>核心序列</h2>
        <span className="count">001–099 · {core.length} 张</span>
      </div>
      <div className="drawer-wall">
        {core.map((c) => (
          <Drawer key={c.id} id={c.id} no={c.no} name={c.name} oneliner={c.oneliner} stamp={stageOf(c.id)} image={c.image} />
        ))}
      </div>

      <div className="shelf-title">
        <h2>跨界序列</h2>
        <span className="count">101–199 · {cross.length} 张</span>
      </div>
      <div className="drawer-wall" style={{ marginBottom: 40 }}>
        {cross.map((c) => (
          <Drawer key={c.id} id={c.id} no={c.no} name={c.name} oneliner={c.oneliner} stamp={stageOf(c.id)} image={c.image} />
        ))}
      </div>

      <div className="mailbox">
        <div className="mailbox-head">✉️ 火花信箱</div>
        {wishes.length === 0 ? (
          <p className="mailbox-empty">
            信箱还空着。在任意卡片的「这个模式还出现在……」下添一朵火花，
            如果想到的卡还没写，填上它的名字——愿望会投进这里。
          </p>
        ) : (
          <ul>
            {wishes.map(([name, g]) => (
              <li key={name}>
                「{name}」
                <span className="mailbox-count"> × {g.count} 人想看 · 来自 { [...g.from].map(cardName).join('、') }</span>
              </li>
            ))}
          </ul>
        )}
        <span className="mailbox-note">本地愿望池 · 接后端后成为共享选题池</span>
      </div>

      <p className="foot-note">PONS · {cards.length} 张卡 · 内容源 patterns/*.md 构建期解析</p>
    </div>
  )
}
