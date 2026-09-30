import type { Card } from '../data/types'
import { Markdown } from './Markdown'

/**
 * 迁移案例列表（阶段四）：来自 cases/ 目录，按 frontmatter 自动聚合。
 * 五要素：场景（什么时候撞上）/ 信号（什么症状该想起这张卡）/ 桥接（怎么套）
 * / 解答（对照代码——展开后可见，复用 Markdown 的 hljs 高亮，与卡片代码块同色）。
 */
export function CaseList({ card }: { card: Card }) {
  return (
    <div className="case-list">
      <div className="case-list-head">
        🗂 迁移案例 <span className="practice-pad-sub">真实场景里的这张卡——什么时候撞上、什么信号、怎么套（点开附解答代码）</span>
      </div>
      {card.cases.map((c) => (
        <details key={c.title} className="case-item">
          <summary>
            <span className="case-title">{c.title}</span>
            <span className="case-source">
              出处：{c.url ? <a href={c.url} target="_blank" rel="noreferrer">{c.source}</a> : c.source}
            </span>
          </summary>
          <div className="case-body">
            <div className="case-row"><b>场景</b><p>{c.scene}</p></div>
            <div className="case-row"><b>信号</b><p>{c.signal}</p></div>
            <div className="case-row"><b>桥接</b><p>{c.bridge}</p></div>
            <div className="case-solution">
              <div className="case-solution-label">📎 解答代码 · 先自己写，再对照</div>
              <Markdown text={'```' + c.solutionLang + '\n' + c.solution + '\n```'} />
            </div>
          </div>
        </details>
      ))}
    </div>
  )
}
