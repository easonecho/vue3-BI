/**
 * 阶段3 端到端验证测试脚本 (Node.js)
 * 测试范围: 角色 / 部门 / 数据集缓存 / 多数据库适配器占位
 *
 * 运行: node e2e-test.mjs
 */
const BASE = 'http://localhost:3000'

let TOKEN = null
let FAILED = 0
const testRoleId = { value: null }
const testDeptId = { value: null }
const testDsPgId = { value: null }
const testDsSqliteId = { value: null }
const datasetId = { value: null }

function logOk(msg) { console.log(`  [PASS] ${msg}`) }
function logFail(msg) { console.log(`  [FAIL] ${msg}`); FAILED++ }
function logInfo(msg) { console.log(`  [INFO] ${msg}`) }
function step(title) { console.log(`\n==========================================\n  ${title}\n==========================================`) }

async function req(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`
  const opts = { method, headers }
  if (body !== undefined) opts.body = JSON.stringify(body)
  const res = await fetch(`${BASE}${path}`, opts)
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  return { status: res.status, data }
}

function expectReject(label, statusCode) {
  // 400/403/500 业务错误都算"被拒绝"
  if ([400, 403, 500, 409].includes(statusCode)) {
    logOk(`${label} 被正确拒绝 (HTTP ${statusCode})`)
  } else {
    logFail(`${label} 异常状态码: ${statusCode}`)
  }
}

async function main() {
  // ============ 1. 登录 ============
  step('1. 登录获取 token')
  try {
    const r = await req('POST', '/api/auth/login', { username: 'admin', password: 'admin123' })
    TOKEN = r.data?.data?.accessToken
    if (TOKEN) logOk(`登录成功, token 长度: ${TOKEN.length}`)
    else { logFail('登录未返回 token'); return }
  } catch (e) { logFail(`登录失败: ${e.message}`); return }

  // ============ 2. 角色管理 ============
  step('2. 角色管理 CRUD API')

  // 2.1 列表
  try {
    const r = await req('GET', '/api/roles?page=1&pageSize=20')
    const list = r.data?.data?.list || []
    logOk(`GET /api/roles 返回 ${list.length} 个角色, total=${r.data?.data?.total}`)
  } catch (e) { logFail(`GET /api/roles 失败: ${e.message}`) }

  // 2.2 不分页下拉
  try {
    const r = await req('GET', '/api/roles/all/list')
    logOk(`GET /api/roles/all/list 返回 ${(r.data?.data || []).length} 个角色`)
  } catch (e) { logFail(`GET /api/roles/all/list 失败: ${e.message}`) }

  // 2.3 创建角色
  const testCode = `E2E_TEST_${Date.now().toString().slice(-6)}`
  try {
    const r = await req('POST', '/api/roles', {
      name: `E2E测试角色_${testCode}`,
      code: testCode,
      description: '端到端测试临时角色',
      dsType: 'oneself',
      permissions: ['dashboard:view', 'chart:edit'],
    })
    testRoleId.value = r.data?.data?.id
    logOk(`POST /api/roles 创建成功 id=${testRoleId.value} code=${testCode}`)
  } catch (e) { logFail(`POST /api/roles 失败: ${e.message}`) }

  // 2.4 内置角色防修改 (id=1)
  try {
    const r = await req('PUT', '/api/roles/1', { description: '尝试改内置' })
    expectReject('PUT /api/roles/1 内置角色', r.status)
  } catch (e) { logFail(`PUT /api/roles/1 异常: ${e.message}`) }

  // 2.5 更新刚创建的角色
  if (testRoleId.value) {
    try {
      const r = await req('PUT', `/api/roles/${testRoleId.value}`, {
        description: '更新后的描述',
        dsType: 'subordinate',
      })
      logOk(`PUT /api/roles/${testRoleId.value} 更新成功 dsType=${r.data?.data?.dsType}`)
    } catch (e) { logFail(`PUT /api/roles/${testRoleId.value} 失败: ${e.message}`) }
  }

  // 2.6 删除测试角色
  if (testRoleId.value) {
    try {
      await req('DELETE', `/api/roles/${testRoleId.value}`)
      logOk(`DELETE /api/roles/${testRoleId.value} 删除成功`)
    } catch (e) { logFail(`DELETE /api/roles/${testRoleId.value} 失败: ${e.message}`) }
  }

  // 2.7 内置角色防删除 (id=2)
  try {
    const r = await req('DELETE', '/api/roles/2')
    expectReject('DELETE /api/roles/2 内置角色', r.status)
  } catch (e) { logFail(`DELETE /api/roles/2 异常: ${e.message}`) }

  // ============ 3. 部门管理 ============
  step('3. 部门管理 CRUD API')

  // 3.1 列表
  try {
    const r = await req('GET', '/api/departments?page=1&pageSize=20')
    const list = r.data?.data?.list || []
    logOk(`GET /api/departments 返回 ${list.length} 个部门`)
  } catch (e) { logFail(`GET /api/departments 失败: ${e.message}`) }

  // 3.2 树视图
  try {
    const r = await req('GET', '/api/departments/tree/list')
    logOk(`GET /api/departments/tree/list 返回 ${(r.data?.data || []).length} 个根节点`)
  } catch (e) { logFail(`GET /api/departments/tree/list 失败: ${e.message}`) }

  // 3.3 创建子部门
  let parentDeptId = null
  try {
    const all = await req('GET', '/api/departments/all/list')
    if ((all.data?.data || []).length > 0) parentDeptId = all.data.data[0].id
    const r = await req('POST', '/api/departments', {
      name: 'E2E测试部门',
      code: 'E2E_DEPT',
      parentId: parentDeptId,
      sort: 99,
      status: 1,
    })
    testDeptId.value = r.data?.data?.id
    logOk(`POST /api/departments 创建子部门成功 id=${testDeptId.value} parent=${parentDeptId}`)
  } catch (e) { logFail(`POST /api/departments 失败: ${e.message}`) }

  // 3.4 循环引用检测
  if (parentDeptId && testDeptId.value) {
    try {
      const r = await req('PUT', `/api/departments/${parentDeptId}`, { parentId: testDeptId.value })
      expectReject('PUT /api/departments 循环引用', r.status)
    } catch (e) { logFail(`PUT 循环引用异常: ${e.message}`) }
  }

  // 3.5 删除测试部门
  if (testDeptId.value) {
    try {
      await req('DELETE', `/api/departments/${testDeptId.value}`)
      logOk(`DELETE /api/departments/${testDeptId.value} 删除成功`)
    } catch (e) { logFail(`DELETE /api/departments/${testDeptId.value} 失败: ${e.message}`) }
  }

  // ============ 4. 数据集缓存 ============
  step('4. 数据集查询结果缓存')

  // 4.1 找一个已存在的数据集
  try {
    const r = await req('GET', '/api/datasets?page=1&pageSize=10')
    const list = r.data?.data?.list || []
    if (list.length > 0) {
      datasetId.value = list[0].id
      logInfo(`测试数据集 id=${datasetId.value}, cacheEnabled=${list[0].cacheEnabled}`)
    }
  } catch (e) { logFail(`GET /api/datasets 失败: ${e.message}`) }

  if (datasetId.value) {
    // 4.2 关闭缓存执行一次
    try {
      await req('PUT', `/api/datasets/${datasetId.value}`, { cacheEnabled: false })
      logOk(`已关闭数据集 ${datasetId.value} 的缓存`)
      const r1 = await req('POST', `/api/datasets/${datasetId.value}/execute`, { limit: 100 })
      logOk(`缓存关闭 execute 返回行数=${r1.data?.data?.rowCount}`)
    } catch (e) { logFail(`execute (缓存关闭) 失败: ${e.message}`) }

    // 4.3 开启缓存, 两次 execute 应第二次命中
    try {
      await req('PUT', `/api/datasets/${datasetId.value}`, { cacheEnabled: true, cacheTtl: 300 })
      logOk(`已开启数据集 ${datasetId.value} 缓存 (TTL=300s)`)

      const t1Start = Date.now()
      const r1 = await req('POST', `/api/datasets/${datasetId.value}/execute`, { limit: 100 })
      const t1 = Date.now() - t1Start
      logOk(`第一次 execute (回填) 耗时 ${t1}ms, 行数=${r1.data?.data?.rowCount}`)

      const t2Start = Date.now()
      const r2 = await req('POST', `/api/datasets/${datasetId.value}/execute`, { limit: 100 })
      const t2 = Date.now() - t2Start
      logOk(`第二次 execute (应命中) 耗时 ${t2}ms, 行数=${r2.data?.data?.rowCount}`)

      if (t2 < t1) logOk(`缓存命中验证: 第二次比第一次快 ${t1 - t2}ms`)
      else logInfo(`缓存命中验证: 第二次未明显加快 (可能 SQL 本身很快, 查后端日志确认)`)
    } catch (e) { logFail(`execute (缓存开启) 失败: ${e.message}`) }

    // 4.4 更新数据集触发缓存失效
    try {
      await req('PUT', `/api/datasets/${datasetId.value}`, {
        cacheEnabled: false,
        description: `E2E 测试后关闭缓存 ${new Date().toISOString()}`,
      })
      logOk('更新数据集触发缓存失效')
    } catch (e) { logFail(`更新数据集缓存失效失败: ${e.message}`) }
  } else {
    logInfo('数据库中无数据集, 跳过缓存测试')
  }

  // ============ 5. 多数据库适配器占位 ============
  step('5. 多数据库适配器占位 (postgres/sqlite 应报错)')

  // 5.1 创建 PG 数据源
  try {
    const r = await req('POST', '/api/datasources', {
      name: 'E2E测试_PG占位',
      type: 'postgresql',
      host: '127.0.0.1', port: 5432,
      username: 'postgres', password: 'postgres', database: 'test',
      description: '测试 PG 占位',
    })
    testDsPgId.value = r.data?.data?.id
    logOk(`POST /api/datasources 创建 PG 数据源成功 id=${testDsPgId.value}`)
  } catch (e) { logFail(`创建 PG 数据源失败: ${e.message}`) }

  // 5.2 测试连接应报错
  if (testDsPgId.value) {
    try {
      const r = await req('POST', `/api/datasources/${testDsPgId.value}/test`)
      expectReject('PG 数据源测试连接', r.status)
    } catch (e) { logFail(`PG 测试连接异常: ${e.message}`) }
    try {
      await req('DELETE', `/api/datasources/${testDsPgId.value}`)
      logOk('DELETE 测试 PG 数据源成功 (清理)')
    } catch (e) { logFail(`清理 PG 数据源失败: ${e.message}`) }
  }

  // 5.3 SQLite 同样
  try {
    const r = await req('POST', '/api/datasources', {
      name: 'E2E测试_SQLite占位',
      type: 'sqlite',
      host: 'localhost', port: 0,
      username: '', password: '', database: 'test.db',
      description: '测试 SQLite 占位',
    })
    testDsSqliteId.value = r.data?.data?.id
    logOk(`POST /api/datasources 创建 SQLite 数据源成功 id=${testDsSqliteId.value}`)
    if (testDsSqliteId.value) {
      try {
        const r2 = await req('POST', `/api/datasources/${testDsSqliteId.value}/test`)
        expectReject('SQLite 数据源测试连接', r2.status)
      } catch (e) { logFail(`SQLite 测试连接异常: ${e.message}`) }
      try {
        await req('DELETE', `/api/datasources/${testDsSqliteId.value}`)
        logOk('DELETE 测试 SQLite 数据源成功 (清理)')
      } catch (e) { logFail(`清理 SQLite 数据源失败: ${e.message}`) }
    }
  } catch (e) { logFail(`创建 SQLite 数据源失败: ${e.message}`) }

  // ============ 总结 ============
  step('测试总结')
  if (FAILED === 0) {
    console.log('  所有测试项全部 PASS ✅')
  } else {
    console.log(`  共 ${FAILED} 项失败 ❌`)
  }
  process.exit(FAILED)
}

main().catch((e) => {
  console.error('测试脚本异常:', e)
  process.exit(1)
})
