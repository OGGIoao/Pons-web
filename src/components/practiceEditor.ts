import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { tags } from '@lezer/highlight'
import { python } from '@codemirror/lang-python'

/** sepia 语法高亮：token 颜色全部来自 theme.css 的 --tok-* 调色板（SSOT） */
const sepiaHighlight = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--tok-kw)' },
  { tag: [tags.string, tags.regexp], color: 'var(--tok-str)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--tok-num)' },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: 'var(--tok-fn)' },
  { tag: tags.comment, color: 'var(--tok-cm)', fontStyle: 'italic' },
  { tag: [tags.definition(tags.variableName), tags.className, tags.typeName], color: 'var(--tok-builtin)' },
  { tag: [tags.operator, tags.punctuation], color: 'inherit' },
  { tag: tags.propertyName, color: 'var(--tok-attr)' },
])

export function createPracticeEditor(parent: HTMLElement, initialDoc: string, onChange: (code: string) => void): EditorView {
  return new EditorView({
    parent,
    state: EditorState.create({
      doc: initialDoc,
      extensions: [
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        python(),
        syntaxHighlighting(sepiaHighlight),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChange(u.state.doc.toString())
        }),
      ],
    }),
  })
}
