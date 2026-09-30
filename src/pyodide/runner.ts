/**
 * Pyodide Runner：在 Web Worker 里真跑 CPython（WASM）。
 *
 * 设计要点：
 * - 每次运行新建 Worker：命名空间干净，上次运行的残留状态不存在
 * - 5 秒熔断：terminate 卡死的 Worker（用户代码可能有死循环）
 * - pyodide.js 由浏览器缓存，预热只在第一次发生
 * - 无网络/CDN 不可达时给出明确失败原因，不假装跑过
 */

export interface RunResult {
  ok: boolean
  /** 通过自测断言（ok=true 且测试无异常） */
  passed: boolean
  /** 捕获的 stdout（print 输出） */
  output: string
  /** 失败原因（给用户看） */
  error?: string
  /** 是否因超时熔断 */
  timedOut?: boolean
}

const PYODIDE_VERSION = '0.26.4'
// jsdelivr 在本机网络不可达（2026-09 实测），unpkg 全量文件可用。
// 如将来部署环境相反，改这一行即可。
const PYODIDE_BASE = `https://unpkg.com/pyodide@${PYODIDE_VERSION}`
const TIMEOUT_MS = 5000

const WORKER_SOURCE = `
importScripts('${PYODIDE_BASE}/pyodide.js')
let pyodide = null
self.onmessage = async (e) => {
  const { runId, userCode, testCode } = e.data
  const logs = []
  try {
    if (!pyodide) {
      pyodide = await loadPyodide({ indexURL: '${PYODIDE_BASE}/' })
      pyodide.setStdout({ batched: (s) => logs.push(s) })
      pyodide.setStderr({ batched: (s) => logs.push(s) })
    }
    // 先跑用户代码（定义函数），再跑自测断言
    await pyodide.runPythonAsync(userCode)
    await pyodide.runPythonAsync(testCode)
    self.postMessage({ runId, ok: true, passed: true, output: logs.join('\\n') })
  } catch (err) {
    self.postMessage({ runId, ok: false, passed: false, output: logs.join('\\n'), error: String(err.message || err) })
  }
}
`

let worker: Worker | null = null
let workerUrl: string | null = null
let runSeq = 0

function getWorker(): Worker {
  if (!worker) {
    if (!workerUrl) {
      workerUrl = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'application/javascript' }))
    }
    worker = new Worker(workerUrl)
  }
  return worker
}

/** 掐线重连：熔断或 Worker 自身崩溃后重建 */
function killWorker() {
  worker?.terminate()
  worker = null
}

export async function runPractice(userCode: string, testCode: string): Promise<RunResult> {
  const runId = ++runSeq
  const w = getWorker()

  return new Promise<RunResult>((resolve) => {
    const timer = window.setTimeout(() => {
      killWorker()
      resolve({ ok: false, passed: false, output: '', timedOut: true, error: `译电中断：超过 ${TIMEOUT_MS / 1000} 秒无回执，疑似死循环` })
    }, TIMEOUT_MS)

    const onMessage = (e: MessageEvent) => {
      if (e.data?.runId !== runId) return
      cleanup()
      resolve({
        ok: e.data.ok,
        passed: e.data.passed,
        output: e.data.output ?? '',
        error: e.data.error,
      })
    }
    const onError = (e: ErrorEvent) => {
      cleanup()
      // Worker 级错误（如 CDN 不可达导致 importScripts 失败）
      resolve({ ok: false, passed: false, output: '', error: `译电机故障：${e.message || '无法加载 Python 运行时（检查网络）'}` })
    }
    const cleanup = () => {
      window.clearTimeout(timer)
      w.removeEventListener('message', onMessage)
      w.removeEventListener('error', onError)
    }

    w.addEventListener('message', onMessage)
    w.addEventListener('error', onError)
    w.postMessage({ runId, userCode, testCode })
  })
}
