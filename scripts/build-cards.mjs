#!/usr/bin/env node
/**
 * Pons 内容管线：把 ../pons-clone/patterns/*.md 解析成 src/generated/cards.json
 *
 * 单一事实来源 = markdown 仓库。本脚本是唯一消费者，生成物禁止手改。
 *
 * 结构契约（解析失败即报错退出，防止半成品进站点）：
 *   - 每张卡：# 标题（含编号+名称）/ 🚩 阶段一正文 / 恰好 3 个 <details>（阶段二三四）
 *   - catalog.md 提供 ⚙🧠🌐 三围与一句话（缺了只警告，不阻断）
 *
 * 用法：node scripts/build-cards.mjs
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PATTERNS_DIR = process.env.PONS_CONTENT_DIR
  ? resolve(process.env.PONS_CONTENT_DIR)
  : resolve(HERE, '../../pons-clone/patterns')
const OUT_FILE = join(HERE, '../src/generated/cards.json')

const errors = []
const warnings = []

const fail = (msg) => { errors.push(msg); console.error(`❌ ${msg}`) }
const warn = (msg) => { warnings.push(msg); console.warn(`⚠️  ${msg}`) }

// ---------- 发现卡片：自动 glob，绝不手维护清单 ----------
const files = readdirSync(PATTERNS_DIR)
  .filter((f) => f.endsWith('.md') && !f.startsWith('_') && f !== 'catalog.md')
  .sort()

if (files.length === 0) fail(`在 ${PATTERNS_DIR} 没有发现任何卡片`)

// ---------- catalog.md → 机器可读元数据 ----------
function parseCatalog(text) {
  const meta = new Map()
  for (const line of text.split('\n')) {
    const m = line.match(/^\|\s*(\d{3})\s*\|\s*\*\*(.+?)\*\*\s*\|\s*(\d)\s*\|\s*(\d)\s*\|\s*(\d)\s*\|\s*(.+?)\s*\|\s*$/)
    if (m) {
      meta.set(m[1], {
        name: m[2],
        utility: Number(m[3]),
        thinking: Number(m[4]),
        crossover: Number(m[5]),
        oneliner: m[6],
      })
    }
  }
  return meta
}

let catalogMeta = new Map()
try {
  catalogMeta = parseCatalog(readFileSync(join(PATTERNS_DIR, 'catalog.md'), 'utf8'))
} catch {
  warn('catalog.md 读取失败，元数据将全部缺失')
}

// ---------- 单卡解析 ----------
const DETAILS_RE = /<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g

function cleanStage1(md) {
  return md
    .split('\n')
    .filter((l) => !/^---\s*$/.test(l) && !/^\*最后更新/.test(l))
    .join('\n')
    .trim()
}

function parseCard(file) {
  const id = file.replace(/\.md$/, '')
  const text = readFileSync(join(PATTERNS_DIR, file), 'utf8')

  const title = text.match(/^# 📇 思维跳板 #(\d{3})：(.+)$/m)
  if (!title) return fail(`${id}: 缺少标题行「# 📇 思维跳板 #NNN：名称」`)
  const no = title[1]
  const name = title[2].trim()

  // 阶段一：从「## 🚩 阶段一」到第一个 <details>
  const s1Start = text.indexOf('## 🚩 阶段一')
  const d0 = text.indexOf('<details>')
  if (s1Start === -1 || d0 === -1 || d0 < s1Start) return fail(`${id}: 阶段一正文或 <details> 结构缺失`)
  const stage1 = cleanStage1(text.slice(s1Start + '## 🚩 阶段一：挑战'.length, d0))
  if (stage1.length < 50) warn(`${id}: 阶段一正文过短（${stage1.length} 字符）`)

  // 折叠阶段：必须恰好 3 个
  const stages = []
  let m
  DETAILS_RE.lastIndex = 0
  while ((m = DETAILS_RE.exec(text)) !== null) {
    const summary = m[1].trim()
    const content = m[2].trim()
    const num = summary.match(/阶段([二三四])/)
    if (!num) warn(`${id}: 折叠段标题缺「阶段二/三/四」标识：${summary}`)
    stages.push({ stage: num ? num[1] : String(stages.length + 2), summary, content })
  }
  if (stages.length !== 3) fail(`${id}: 折叠阶段应有 3 个，实际 ${stages.length} 个`)

  // 练习台素材（与 markdown 同源零复制）：
  //   testCode = 阶段四「🧪 自测用例」代码块（给练习台的判分电文）
  //   skeleton = 「参考实现」的 import + def 签名行（伪代码骨架，引导函数命名）
  const s4 = stages[2]?.content ?? ''
  const t0 = s4.indexOf('🧪 自测用例')
  const r0 = s4.indexOf('### 参考实现')
  const r1 = s4.indexOf('### 这个模式还出现在')
  const blocks = (md) => {
    const out = []
    const re = /```(\w*)\n([\s\S]*?)```/g
    let b
    while ((b = re.exec(md)) !== null) if (b[1] === 'python' || b[1] === '') out.push(b[2].trim())
    return out
  }
  const testBlocks = t0 !== -1 && r0 !== -1 ? blocks(s4.slice(t0, r0)) : []
  const refBlocks = r0 !== -1 && r1 !== -1 ? blocks(s4.slice(r0, r1)) : []
  const refCode = refBlocks.join('\n\n')
  // 骨架必须是可运行的 Python：import 置顶，每个 def 签名补缩进的占位体
  const refLines = refCode.split('\n')
  const imports = [...new Set(refLines.filter((l) => /^(import |from )/.test(l)).map((l) => l.trim()))]
  // def 签名可能跨多行（括号未闭合就换行）：按括号深度收集完整签名。
  // 注意：正则字符类必须写成 [(\[] / [)\]]——/[([/ 这类未闭合类会吞掉后续代码。
  const defs = []
  {
    const OPEN_RE = /[(\[]/g
    const CLOSE_RE = /[)\]]/g
    const balance = (s) => (s.match(OPEN_RE) || []).length - (s.match(CLOSE_RE) || []).length
    let cur = null
    let depth = 0
    for (const raw of refLines) {
      const l = raw.trimEnd()
      if (cur === null) {
        // 只认顶层的干净签名行：# 开头的伪代码/注释行、含箭头符号的行一律跳过
        if (/^def [\w]+\s*\(/.test(l) && !/[→←：]/.test(l)) {
          cur = l
          depth = balance(l)
          if (depth <= 0) { defs.push(cur); cur = null }
        }
      } else {
        cur += '\n' + l.trim() // 续行顶格拼进多行签名（括号内任意缩进都合法）
        depth += balance(l)
        if (depth <= 0) { defs.push(cur); cur = null }
      }
    }
    // 签名到文件结束都没闭合 = 源文件有语法问题，宁可不要也不给半成品
    if (cur !== null) warn(`${id}: 参考实现里有未闭合的 def 签名，已跳过该函数`)
  }
  const skeletonBody = [
    ...imports,
    ...(imports.length ? [''] : []),
    ...defs.flatMap((d) => [d, '    # 在这里写下你的实现', '    ...', '']),
  ].join('\n').trim()
  if (refBlocks.length && !skeletonBody) fail(`${id}: 参考实现存在但一个 def 签名都没提取到`)
  if (skeletonBody) {
    // 可执行契约：骨架必须能通过 Python 编译（本机 python3 可用时硬校验）
    try {
      execFileSync('python3', ['-c', `compile(${JSON.stringify(skeletonBody)}, 'skeleton.py', 'exec')`], { stdio: 'pipe' })
    } catch {
      fail(`${id}: 练习骨架未能通过 Python 语法编译，拒绝进入站点`)
    }
  }
  const practice =
    testBlocks.length && refBlocks.length
      ? { testCode: testBlocks.join('\n\n'), skeleton: skeletonBody }
      : null
  if (!practice) warn(`${id}: 阶段四缺少自测用例或参考实现，练习台不可用`)

  const meta = catalogMeta.get(no)
  if (!meta) warn(`${id}: catalog.md 中无 ${no} 的元数据行`)
  else if (meta.name !== name) warn(`${id}: 标题「${name}」与 catalog「${meta.name}」不一致`)

  // 插画按约定自动挂载：assets/cards/<id>.png 存在即配给本卡，
  // 复制到 public/cards/ 供 vite 托管。缺图不报错（优雅降级），只汇总提示。
  const ASSETS_DIR = join(PATTERNS_DIR, '../assets/cards')
  const PUBLIC_DIR = join(HERE, '../public/cards')
  let image = null
  const imgSrc = join(ASSETS_DIR, `${id}.png`)
  if (existsSync(imgSrc)) {
    mkdirSync(PUBLIC_DIR, { recursive: true })
    copyFileSync(imgSrc, join(PUBLIC_DIR, `${id}.png`))
    image = `/cards/${id}.png`
  }

  return {
    id, no, name,
    seq: Number(no) < 100 ? 'core' : 'cross',
    scores: meta ? { utility: meta.utility, thinking: meta.thinking, crossover: meta.crossover } : null,
    oneliner: meta?.oneliner ?? null,
    image,
    stage1,
    stages,
    practice,
  }
}

const cards = files.map(parseCard).filter((c) => c && typeof c === 'object')

// 编号唯一性
const seen = new Set()
for (const c of cards) {
  if (seen.has(c.no)) fail(`编号重复：${c.no}`)
  seen.add(c.no)
}

// ---------- 迁移案例库：cases/*.md，frontmatter 声明关联，管线自动聚合 ----------
// 契约（每条违反即构建失败）：
//   - frontmatter: title / cards: [编号...] / source（必填）/ url（可选）
//   - 正文必须有「## 场景」「## 信号」「## 桥接」三段且非空（拒绝泛泛而谈）
//   - 正文必须有「## 解答」且含一个代码块——迁移案例必须附解答代码；
//     Python 解答当场过编译校验
// 新案例 = 丢一个文件，不动任何卡片，双向链接零手工同步。
const CASES_DIR = join(PATTERNS_DIR, '../cases')

function parseCaseFile(file) {
  const text = readFileSync(join(CASES_DIR, file), 'utf8')
  const fm = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!fm) return fail(`cases/${file}: 缺少 frontmatter（--- 包裹）`)
  const fields = {}
  for (const line of fm[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/)
    if (m) fields[m[1]] = m[2].trim()
  }
  const cardsRef = (fields.cards ?? '').match(/\d{3}/g) ?? []
  if (!fields.title) fail(`cases/${file}: 缺 title`)
  if (cardsRef.length === 0) fail(`cases/${file}: frontmatter 的 cards 至少引用一张卡`)
  if (!fields.source) fail(`cases/${file}: 缺 source（真实出处必填，URL 可选）`)

  const body = fm[2]
  const section = (name) => {
    const m = body.match(new RegExp(`## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`))
    return m ? m[1].trim() : ''
  }
  const scene = section('场景')
  const signal = section('信号')
  const bridge = section('桥接')
  for (const [k, v] of [['场景', scene], ['信号', signal], ['桥接', bridge]]) {
    if (v.length < 20) fail(`cases/${file}: 「${k}」缺失或过短（<20 字符）——拒绝泛泛而谈`)
  }

  // 解答代码： fenced code block，Python 解答当场编译校验
  const solSec = section('解答')
  const solMatch = solSec.match(/```(\w*)\n([\s\S]*?)```/)
  const solution = solMatch ? solMatch[2].trim() : ''
  let solutionLang = solMatch ? solMatch[1] || 'python' : ''
  if (!solution) fail(`cases/${file}: 缺「## 解答」代码块——迁移案例必须附解答代码`)
  else {
    if (solution.includes('```')) fail(`cases/${file}: 解答代码内不允许出现围栏（\`\`\`）`)
    if (solutionLang === 'python') {
      try {
        execFileSync('python3', ['-c', `compile(${JSON.stringify(solution)}, 'solution.py', 'exec')`], { stdio: 'pipe' })
      } catch {
        fail(`cases/${file}: 解答代码未通过 Python 编译，拒绝进入站点`)
      }
    }
  }
  // 前端只注册了 python / plaintext 两种高亮，其余语言统一按纯文本渲染（绝不高亮报错）
  if (solutionLang !== 'python') solutionLang = 'plaintext'

  return {
    title: fields.title,
    source: fields.source,
    url: fields.url || null,
    cards: cardsRef,
    scene, signal, bridge,
    solution, solutionLang,
  }
}

const casesByCard = new Map()
if (existsSync(CASES_DIR)) {
  const caseFiles = readdirSync(CASES_DIR).filter((f) => f.endsWith('.md')).sort()
  const caseList = caseFiles.map(parseCaseFile).filter((c) => c && typeof c === 'object')
  const validNos = new Set(cards.map((c) => c.no))
  for (const cs of caseList) {
    for (const no of cs.cards) {
      if (!validNos.has(no)) fail(`cases: 引用了不存在的卡 ${no}`)
      if (!casesByCard.has(no)) casesByCard.set(no, [])
      casesByCard.get(no).push({ title: cs.title, source: cs.source, url: cs.url, scene: cs.scene, signal: cs.signal, bridge: cs.bridge, solution: cs.solution, solutionLang: cs.solutionLang })
    }
  }
  for (const list of casesByCard.values()) list.sort((a, b) => a.title.localeCompare(b.title, 'zh'))
}
for (const c of cards) c.cases = casesByCard.get(c.no) ?? []

// 试点期提示（铺量完成后可升级为错误）
const noCases = cards.filter((c) => c.cases.length === 0).map((c) => c.id)
if (noCases.length) console.log(`ℹ️  尚无迁移案例（丢 cases/*.md 即挂载）：${noCases.join(', ')}`)

// 缺图汇总（一张卡配一张图是内容的一部分，提醒但不阻断）
const missing = cards.filter((c) => !c.image).map((c) => c.id)
if (missing.length) console.log(`ℹ️  尚无插画（可选，丢 assets/cards/<id>.png 即挂载）：${missing.join(', ')}`)

// ---------- 输出 ----------
mkdirSync(dirname(OUT_FILE), { recursive: true })
writeFileSync(OUT_FILE, JSON.stringify({ generatedFrom: PATTERNS_DIR, cardCount: cards.length, cards }, null, 2))

warnings.forEach(() => {})
console.log(`✅ ${cards.length} 张卡 → ${OUT_FILE}`)
if (errors.length) {
  console.error(`\nFAIL: ${errors.length} 个结构错误`)
  process.exit(1)
}
if (warnings.length) console.log(`（${warnings.length} 个警告，见上）`)
