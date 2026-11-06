/**
 * ============================================================================
 * 首屏 JS 体积预算检查
 * ============================================================================
 * 从 dist/index.html 解析出浏览器首屏会预加载的 JS（modulepreload + 入口 script），
 * 校验原始体积与 gzip 体积是否在预算内，超预算即退出码 1，用于阻止首屏回退。
 *
 * 背景：曾出现过 monaco-editor 被 catch-all 规则并进 vendor、随首屏预载的问题
 * （首屏 gzip ≈ 1.5 MB）。拆分出 monaco/echarts 后降至 ≈ 350 KB，这里固化门槛。
 *
 * 用法：npm run build && node scripts/check-bundle-budget.mjs
 * ============================================================================
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

/** 首屏预加载 JS 的 gzip 总量上限（KB）；当前基线约 411 KB，留约 10% 余量防回退 */
const MAX_GZIP_KB = 450
/** 单个 chunk 原始体积上限（KB），防止某个大依赖再次被并进首屏 */
const MAX_CHUNK_RAW_KB = 1100

const INDEX_HTML = 'dist/index.html'

if (!existsSync(INDEX_HTML)) {
  console.error(`[bundle-budget] 未找到 ${INDEX_HTML}，请先执行 npm run build`)
  process.exit(1)
}

const html = readFileSync(INDEX_HTML, 'utf8')

// 首屏预载由 Vite 注入: <link rel="modulepreload" href="/assets/js/xxx.js">
const preloads = [
  ...html.matchAll(/rel="modulepreload"[^>]*href="(\/assets\/js\/[^"]+\.js)"/g),
].map((m) => m[1])
// 入口 script 本身（type=module src）
const entries = [
  ...html.matchAll(/<script[^>]*type="module"[^>]*src="(\/assets\/js\/[^"]+\.js)"/g),
].map((m) => m[1])
const files = [...new Set([...preloads, ...entries])]

if (files.length === 0) {
  console.error('[bundle-budget] 未从 index.html 解析到任何 JS，检查构建产物格式是否变化')
  process.exit(1)
}

let totalRaw = 0
let totalGzip = 0
/** @type {string[]} */
const overChunks = []

const rows = files.map((url) => {
  const filePath = join('dist', url.slice(1))
  if (!existsSync(filePath)) {
    console.error(`[bundle-budget] index.html 引用了不存在的文件: ${url}`)
    process.exit(1)
  }
  const buf = readFileSync(filePath)
  const gzip = gzipSync(buf).length
  totalRaw += buf.length
  totalGzip += gzip
  const name = url.split('/').pop() ?? url
  if (buf.length / 1024 > MAX_CHUNK_RAW_KB) {
    overChunks.push(`${name} ${(buf.length / 1024).toFixed(0)} KB`)
  }
  return { name, raw: buf.length / 1024, gzip: gzip / 1024 }
})

rows.sort((a, b) => b.raw - a.raw)
console.log('[bundle-budget] 首屏 JS 明细（原始 / gzip，KB）:')
for (const r of rows) {
  console.log(
    `  ${r.name.padEnd(44)} ${r.raw.toFixed(0).padStart(6)} / ${r.gzip.toFixed(0).padStart(5)}`,
  )
}
console.log(
  `[bundle-budget] 合计: 原始 ${(totalRaw / 1024).toFixed(0)} KB / gzip ${(totalGzip / 1024).toFixed(0)} KB` +
    `（预算 gzip ≤ ${MAX_GZIP_KB} KB，单 chunk 原始 ≤ ${MAX_CHUNK_RAW_KB} KB）`,
)

let failed = false
if (totalGzip / 1024 > MAX_GZIP_KB) {
  console.error(
    `[bundle-budget] 超出首屏 gzip 预算: ${(totalGzip / 1024).toFixed(0)} KB > ${MAX_GZIP_KB} KB`,
  )
  failed = true
}
if (overChunks.length > 0) {
  console.error(`[bundle-budget] 单个 chunk 超出原始体积上限: ${overChunks.join(', ')}`)
  failed = true
}

if (failed) {
  console.error(
    '[bundle-budget] 检查未通过：请检查 vite.config.ts 的 manualChunks 是否把大依赖并入了首屏',
  )
  process.exit(1)
}
console.log('[bundle-budget] 检查通过')
