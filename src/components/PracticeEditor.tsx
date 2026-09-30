import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { python } from '@codemirror/lang-python'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import CodeMirror from '@uiw/react-codemirror'
import { tags as t } from '@lezer/highlight'

/**
 * 打字机风格的 CodeMirror 主题：纸底墨字 + 克制的暖色调 token。
 * 全局统一，练习台与站点气质一致。
 */
const ponsEditorTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#fdfaf0',
      color: '#33291f',
      fontSize: '13.5px',
      border: '1px solid var(--paper-line)',
      borderRadius: '3px',
      boxShadow: 'inset 0 2px 6px rgba(120, 80, 30, .12)',
    },
    '.cm-content': { fontFamily: '"SF Mono", Menlo, monospace', lineHeight: '1.9', caretColor: '#b3261e' },
    '.cm-gutters': { backgroundColor: '#f5efdd', color: '#a3937a', border: 'none', borderRight: '1px dashed var(--paper-line)' },
    '.cm-activeLine': { backgroundColor: 'rgba(201, 162, 39, .08)' },
    '&.cm-focused': { outline: '2px solid rgba(201, 162, 39, .5)', outlineOffset: '-1px' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(201, 162, 39, .25)' },
  },
  { dark: false },
)

const ponsHighlight = HighlightStyle.define([
  { tag: t.keyword, color: '#8e3b2f', fontWeight: '600' },
  { tag: [t.string, t.special(t.string)], color: '#3d6b4f' },
  { tag: [t.number, t.bool, t.null], color: '#8a6508' },
  { tag: t.comment, color: '#a3937a', fontStyle: 'italic' },
  { tag: [t.function(t.variableName), t.propertyName], color: '#2b4ea0' },
  { tag: t.definition(t.variableName), color: '#33291f', fontWeight: '600' },
  { tag: [t.operator, t.punctuation], color: '#6b5d4a' },
  { tag: t.meta, color: '#a3937a' },
])

export function PracticeEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      height="260px"
      extensions={[
        lineNumbers(),
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        python(),
        syntaxHighlighting(ponsHighlight),
        EditorState.tabSize.of(4),
      ]}
      theme={ponsEditorTheme}
      basicSetup={{ foldGutter: false, highlightActiveLine: true, searchKeymap: false }}
    />
  )
}
