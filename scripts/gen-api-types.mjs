/**
 * 从后端 OpenAPI 规范生成前端类型与路径索引
 * 用法: pnpm gen:api-types
 * 规范来源优先级: 环境变量 OPENAPI_SPEC > ../bi-lowcode-server/swagger.json
 *
 * 产物（均提交到仓库，保证 CI 无需后端仓库也能做契约校验）：
 * - src/api/generated/openapi.d.ts        OpenAPI 路径/组件类型（供 api 层引用）
 * - src/api/generated/openapi-paths.json  「METHOD /path」索引，供契约测试比对
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import openapiTS, { astToString } from 'openapi-typescript'

const HTTP_METHODS = ['get', 'post', 'put', 'delete', 'patch']

const projectRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const outDir = path.join(projectRoot, 'src', 'api', 'generated')

const specPath = process.env.OPENAPI_SPEC
  ? path.resolve(process.cwd(), process.env.OPENAPI_SPEC)
  : path.resolve(projectRoot, '..', 'bi-lowcode-server', 'swagger.json')

if (!fs.existsSync(specPath)) {
  console.error(
    `[gen:api-types] 找不到 OpenAPI 规范: ${specPath}\n` +
      '可通过环境变量 OPENAPI_SPEC 指定 swagger.json 路径，或先在 bi-lowcode-server 执行 npm run openapi:export。',
  )
  process.exit(1)
}

const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'))
const ast = await openapiTS(spec)

fs.mkdirSync(outDir, { recursive: true })

const banner =
  '/**\n' +
  ' * 本文件由 scripts/gen-api-types.mjs 自动生成，请勿手工修改。\n' +
  ' * 重新生成: pnpm gen:api-types\n' +
  ` * 规范来源: ${path.basename(specPath)}\n` +
  ' */\n'
fs.writeFileSync(path.join(outDir, 'openapi.d.ts'), banner + astToString(ast), 'utf-8')

/** 路径索引：只保留方法与路径，测试用（不含任何 schema，便于快速比对） */
const entries = []
for (const [routePath, pathItem] of Object.entries(spec.paths ?? {})) {
  for (const method of HTTP_METHODS) {
    if (pathItem?.[method]) entries.push(`${method.toUpperCase()} ${routePath}`)
  }
}
entries.sort()
fs.writeFileSync(
  path.join(outDir, 'openapi-paths.json'),
  `${JSON.stringify(entries, null, 2)}\n`,
  'utf-8',
)

console.log(`[gen:api-types] 已生成 ${entries.length} 个接口 → src/api/generated/`)
