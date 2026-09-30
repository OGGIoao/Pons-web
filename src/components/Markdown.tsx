import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import { marked } from 'marked'
import { useEffect, useMemo, useRef } from 'react'

hljs.registerLanguage('python', python)
// 卡片内容以 Python 为主；未标注语言时按纯文本兜底，绝不高亮报错
hljs.registerLanguage('plaintext', () => ({ name: 'plaintext', contains: [] }))

marked.use({ gfm: true })

/** 把卡片 markdown 渲染成 HTML。内容来自本地仓库，可信；不启用 HTML 内嵌。 */
export function Markdown({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const html = useMemo(() => marked.parse(text, { async: false }) as string, [text])

  // 渲染后对代码块统一着色（全局生效，任何卡片无需额外配置）
  useEffect(() => {
    ref.current?.querySelectorAll('pre code').forEach((el) => {
      if (!(el as HTMLElement).classList.contains('hljs')) {
        try {
          hljs.highlightElement(el as HTMLElement)
        } catch {
          /* 未知语言保持原样 */
        }
      }
    })
  }, [html])

  return <div ref={ref} className="md" dangerouslySetInnerHTML={{ __html: html }} />
}
