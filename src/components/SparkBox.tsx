import { useState, useSyncExternalStore } from 'react'
import { cards, sparkRepo } from '../data'
import { SPARKS_EVENT } from '../data/sparkRepository'
import type { Card, Spark } from '../data/types'

function subscribe(cb: () => void) {
  window.addEventListener(SPARKS_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(SPARKS_EVENT, cb)
    window.removeEventListener('storage', cb)
  }
}

/** JSON 快照保证 getSnapshot 稳定（useSyncExternalStore 否则会无限重渲染） */
function useSparks(cardId: string): Spark[] {
  const snap = useSyncExternalStore(subscribe, () => JSON.stringify(sparkRepo.list(cardId)))
  return JSON.parse(snap) as Spark[]
}

const WISH = '__wish__' // 下拉选项：这张卡还不存在 → 投进火花信箱

/** 编号 → 卡片深链；查不到（内容更新后失效）返回 null，降级为纯文本 */
function linkOf(no: string): string | null {
  const c = cards.find((c) => c.no === no)
  return c ? `#/card/${c.id}` : null
}

/**
 * 读者火花：挂在「这个模式还出现在……」之后。
 * 作者表格是铜版印刷体；火花是读者的铅笔批注——
 * 可链接到已有关联卡，也可许愿一张还不存在的卡（进首页火花信箱）。
 */
export function SparkBox({ card }: { card: Card }) {
  const sparks = useSparks(card.id)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [link, setLink] = useState('')
  const [wishName, setWishName] = useState('')

  const reset = () => {
    setText('')
    setLink('')
    setWishName('')
    setOpen(false)
  }

  const submit = () => {
    const t = text.trim()
    if (!t) return
    if (link === WISH) {
      const w = wishName.trim()
      if (!w) return
      sparkRepo.add({ cardId: card.id, text: t, linkNo: null, wishName: w })
    } else {
      sparkRepo.add({ cardId: card.id, text: t, linkNo: link || null, wishName: '' })
    }
    reset()
  }

  return (
    <div className="spark-box">
      <div className="spark-head">
        ✦ 读者的火花
        <span className="spark-sub">你想到的迁移场景，写下来，链给下一张卡</span>
      </div>

      {sparks.length === 0 && (
        <p className="spark-empty">还没有人添火花——第一个想到的会是你。</p>
      )}

      <ul className="spark-list">
        {sparks.map((s) => {
          const href = s.linkNo ? linkOf(s.linkNo) : null
          return (
            <li key={s.id} className="spark-note">
              <span className="spark-text">✎ {s.text}</span>
              {s.linkNo &&
                (href ? (
                  <a className="spark-link" href={href}>
                    → 卡 {s.linkNo}
                  </a>
                ) : (
                  <span className="spark-wish">（卡 {s.linkNo} 已下线）</span>
                ))}
              {s.linkNo === null && <span className="spark-wish">🏷 想看「{s.wishName}」</span>}
              <button
                className="spark-del"
                title="擦掉这朵火花"
                onClick={() => sparkRepo.remove(s.id)}
              >
                ✕
              </button>
            </li>
          )
        })}
      </ul>

      {!open ? (
        <button className="spark-add" onClick={() => setOpen(true)}>
          ✏️ 添一朵火花
        </button>
      ) : (
        <div className="spark-form">
          <input
            type="text"
            value={text}
            placeholder="这个模式还出现在……（一句话）"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
          />
          <select value={link} onChange={(e) => setLink(e.target.value)}>
            <option value="">不关联卡片</option>
            {cards.map((c) => (
              <option key={c.id} value={c.no}>
                联想到：{c.no} {c.name}
              </option>
            ))}
            <option value={WISH}>这张卡还不存在…</option>
          </select>
          {link === WISH && (
            <input
              type="text"
              value={wishName}
              placeholder="想看的卡叫什么？（会投进首页的火花信箱）"
              onChange={(e) => setWishName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
            />
          )}
          <div className="spark-form-actions">
            <button className="spark-submit" onClick={submit} disabled={!text.trim()}>
              记下这朵火花
            </button>
            <button className="spark-cancel" onClick={reset}>
              算了
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
