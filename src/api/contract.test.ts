/**
 * 前后端接口契约校验
 *
 * 背景：`src/api/*.ts` 里的路径与方法都是手写的，后端改名 / 改方法后前端不会报错，
 * 只会在运行时 404 或 405（历史上就出现过 PUT/PATCH 不一致）。这里把生成产物
 * `generated/openapi-paths.json`（来自后端真实注册的路由）当作唯一事实来源，
 * 静态扫描前端调用逐条比对，缺失即失败。
 *
 * 更新方式：后端 `npm run openapi:export` → 前端 `pnpm gen:api-types`
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const apiDir = path.dirname(fileURLToPath(import.meta.url))
const pathsIndexPath = path.join(apiDir, 'generated', 'openapi-paths.json')

/** 前端封装函数名 → HTTP 方法（download 内部走 POST + blob，见 utils/request.ts） */
const METHOD_ALIAS: Record<string, string> = {
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  patch: 'PATCH',
  del: 'DELETE',
  delete: 'DELETE',
  download: 'POST',
}

export interface EndpointCall {
  method: string
  rawPath: string
  file: string
  line: number
}

/** 把路径里的动态参数统一成 {param}，便于与规范比对 */
function normalizePath(raw: string): string {
  const withoutQuery = raw.split('?')[0]
  const withParams = withoutQuery.replace(/\$\{[^}]*\}/g, '{param}')
  const trimmed = withParams.length > 1 ? withParams.replace(/\/+$/, '') : withParams
  return trimmed
}

/** 参数名不同不影响匹配：`{id}` 与 `{param}` 等价 */
function canonical(pathName: string): string {
  return pathName.replace(/\{[^}]*\}/g, '{}')
}

/** 从某个位置开始读取一段字符串字面量（支持 ' " ` 三种引号） */
function readStringLiteral(code: string, start: number): string | null {
  const quote = code[start]
  if (quote !== "'" && quote !== '"' && quote !== '`') return null
  let i = start + 1
  while (i < code.length) {
    const ch = code[i]
    if (ch === '\\') {
      i += 2
      continue
    }
    if (ch === quote) return code.slice(start + 1, i)
    i++
  }
  return null
}

/** 跳过泛型参数 `<Foo<Bar>>`，返回 `>` 之后的下标 */
function skipTypeArguments(code: string, start: number): number {
  let depth = 0
  let i = start
  while (i < code.length) {
    const ch = code[i]
    if (ch === '<') depth++
    else if (ch === '>') {
      if (code[i - 1] === '=') {
        // 形如 `<T extends Foo = Bar>` 的默认值，箭头函数不在调用表达式里出现，忽略
        i++
        continue
      }
      depth--
      if (depth === 0) return i + 1
    }
    i++
  }
  return -1
}

/** 扫描源码中所有「封装函数(路径)」形式的调用 */
export function findEndpointCalls(code: string, file: string): EndpointCall[] {
  const calls: EndpointCall[] = []
  const callRe = /\b(get|post|put|patch|del|delete|download)\b/g
  let match: RegExpExecArray | null

  while ((match = callRe.exec(code)) !== null) {
    const methodName = match[1]
    let i = match.index + methodName.length

    // 允许 get<T>(...) 与 get (...)
    while (i < code.length && /\s/.test(code[i])) i++
    if (code[i] === '<') {
      const after = skipTypeArguments(code, i)
      if (after < 0) continue
      i = after
      while (i < code.length && /\s/.test(code[i])) i++
    }
    if (code[i] !== '(') continue
    i++
    while (i < code.length && /\s/.test(code[i])) i++

    const rawPath = readStringLiteral(code, i)
    if (!rawPath || !rawPath.startsWith('/api')) continue

    calls.push({
      method: METHOD_ALIAS[methodName],
      rawPath,
      file,
      line: code.slice(0, match.index).split('\n').length,
    })
  }

  // 直接使用 axios 的少数场景（文件上传等）
  const axiosRe = /\baxios\.(get|post|put|patch|delete)\b/g
  while ((match = axiosRe.exec(code)) !== null) {
    const methodName = match[1]
    let i = match.index + 'axios.'.length + methodName.length
    while (i < code.length && /\s/.test(code[i])) i++
    if (code[i] !== '(') continue
    i++
    while (i < code.length && /\s/.test(code[i])) i++
    const rawPath = readStringLiteral(code, i)
    if (!rawPath || !rawPath.startsWith('/api')) continue
    calls.push({
      method: METHOD_ALIAS[methodName] ?? methodName.toUpperCase(),
      rawPath,
      file,
      line: code.slice(0, match.index).split('\n').length,
    })
  }

  return calls
}

function loadSpecIndex(): Set<string> {
  const entries: string[] = JSON.parse(fs.readFileSync(pathsIndexPath, 'utf-8'))
  return new Set(
    entries.map((entry) => {
      const [method, routePath] = entry.split(' ')
      return `${method} ${canonical(routePath)}`
    }),
  )
}

function loadApiSourceFiles(): string[] {
  return fs
    .readdirSync(apiDir)
    .filter((name) => name.endsWith('.ts') && !name.endsWith('.d.ts') && !name.endsWith('.test.ts'))
    .map((name) => path.join(apiDir, name))
}

describe('前后端接口契约', () => {
  const specIndex = loadSpecIndex()
  const calls = loadApiSourceFiles().flatMap((filePath) =>
    findEndpointCalls(fs.readFileSync(filePath, 'utf-8'), path.basename(filePath)),
  )

  it('能扫描到前端的接口调用（防止正则失效后测试空跑）', () => {
    expect(calls.length).toBeGreaterThan(100)
  })

  it('前端每一处调用都能在 OpenAPI 规范中找到对应方法 + 路径', () => {
    const missing = calls
      .filter((call) => !specIndex.has(`${call.method} ${canonical(normalizePath(call.rawPath))}`))
      .map((call) => `${call.file}:${call.line}  ${call.method} ${call.rawPath}`)

    expect(missing, `以下调用在后端不存在（请核对后端路由后修正前端，或补充后端接口）:\n${missing.join('\n')}`).toEqual([])
  })

  it('路径参数写法统一，不允许把参数拼进静态段落', () => {
    const suspicious = calls
      .filter((call) => !/\$\{/.test(call.rawPath) && /\/(\d|\$)/.test(call.rawPath))
      .map((call) => `${call.file}:${call.line}  ${call.rawPath}`)
    expect(suspicious).toEqual([])
  })
})
