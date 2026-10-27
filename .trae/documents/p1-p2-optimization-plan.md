# P1 / P2 优化实施计划

## Context

P0（文件数据集、计算字段、导出、行级权限）已完成并通过验证。本次继续按此前差距分析的优先级实施：

- P1：图表联动/钻取、告警订阅、Token 嵌入分享
- P2：抽取模式、插件 SDK、数据血缘、模板市场完善

现状要点（已确认）：

- `src/stores/linkage.ts` 已有筛选器值与订阅模型，`filter/Widget.vue` 会写入筛选值，但**没有任何图表消费这些值**，全局筛选器目前是「空转」。
- 各图表通过 `useDatasetBinding` 取数并在 Widget 内做字段映射；30 个 ECharts 图表共用 `_shared/BaseChart.vue`，事件可在此集中处理，无需逐图改点击逻辑。
- 分享体系已存在（`Dashboard.shareToken/sharePassword/shareExpiresAt` + `/api/public/dashboards/:token`），但**匿名访问时图表取数仍走需登录的 `/api/datasets/:id/execute`**，公开分享页/iframe 实际拿不到数据。
- 定时任务调度器 `src/utils/scheduler.ts` 已存在，但只记录日志，无告警模型与评估逻辑。
- 组件注册体系为自动扫描 `component-defs/*/index.ts`，模板市场页面已存在。

本计划先完成 P1 三项，逐项验证后再进入 P2（P2 逐项落地，不一次性铺开）。

---

## P1-A 图表联动与钻取（前端）

### 目标

1. 全局筛选器（filter 组件）真正生效：按筛选器字段名过滤所有含该字段的数据集行。
2. 图表点击联动：点击柱/线/饼等数据项，其他图表按该维度值过滤；再次点击同一项取消。
3. 钻取：图表配置 `drillFields` 后，点击逐层下钻，图表内显示面包屑与「返回」。

### 方案

- 新增纯函数 `src/views/bi-editor/composables/linkage-filter.ts`
  - `applyRowFilters(rows, { globalFilters, linkFilters, drillFilters, componentId })`
  - 规则：字段不存在于行 → 忽略该条件（避免误伤不同数据集）；`${key}_start/_end` 支持日期区间；逗号分隔值支持多选 IN；联动/钻取按字符串等值匹配；多条件 AND。
- 扩展 `src/stores/linkage.ts`
  - `linkFilters`（`{ sourceId, sourceName, field, value }`）、`linkageEnabled`、`drillStates`（componentId → `{field,value}[]`）
  - `toggleLinkFilter` / `clearLinkFiltersBySource` / `clearLinkFilters`
  - `pushDrill` / `popDrill` / `resetDrill` / `getDrillStack`
- `src/views/bi-editor/composables/useDatasetBinding.ts`
  - 通过 `getCurrentInstance()?.props.comp?.id` 取组件 ID（不改 22 处调用点）。
  - 缓存改为保存全量行，`rows` 改为 computed：先按联动/钻取/全局筛选过滤，再等距采样到 2000 行，保证筛选结果不被采样丢弃。
  - 联动筛选值变化时自动重算（computed 依赖 store，无需额外 watch）。
- `src/views/bi-editor/component-defs/_shared/BaseChart.vue`
  - 初始化/重建后绑定 ECharts `click`：`componentType === 'series'` 时取 `params.name`。
  - 字段解析优先级：`dataConfig.categoryField → nameField → xField → labelField`。
  - 有 `drillFields` 且未到最后一层：`pushDrill`（自身过滤，不联动）。
  - 无钻取配置：`linkageEnabled` 时 `toggleLinkFilter`（跨图联动）。
  - 增加包裹层与浮层 chip：显示「联动: field = value ×」或「钻取: A / B 返回」，chip 内可清除。
- 钻取字段配置：给 `bar-chart / line-chart / area-chart / pie-chart / pie-rose-chart / combo-chart` 的 `dataBindingSchema` 增加 `drillFields`（`type: 'category', multiple: true`），对应 Widget 的类目/名称字段改为「钻取栈深度决定的有效字段」。
- 在 `src/views/preview/index.vue`、`src/views/share/index.vue` 挂载时开启 `linkageEnabled`；编辑器不开启（避免与选中交互冲突），但全局筛选器始终生效。

### 验证

- `npx vue-tsc --noEmit`、`npx eslint`（改动文件）。
- 手动：配置两个同数据集图表 → 预览页点击柱子 → 另一图过滤、源图不变；再次点击取消；filter 组件选值后图表变化；配置 drillFields 后逐层下钻与返回正常。

---

## P1-B 告警订阅（后端 + 数据集页弹窗）

### 目标

按数据集配置告警规则（聚合值 vs 阈值 + cron），定时评估生成告警事件；数据集中提供管理入口，不新增菜单/路由。

### 方案

- Prisma 新增模型 + 迁移 `prisma/migrations/5_alert_subscriptions/migration.sql`（列名驼峰，仅审计 4 个 snake_case）：
  - `AlertRule`：datasetId、name、field、aggregate(count/sum/avg/max/min)、operator(gt/gte/lt/lte/eq/ne)、threshold Float、cron、enabled、webhookUrl、lastRunAt、lastValue、creatorId、tenantId + 审计字段。
  - `AlertEvent`：ruleId、ruleName、datasetId、value、threshold、message、status(unread/read)、createdAt。
- 新增 `src/modules/alert/{alert.dto.ts,alert.service.ts,alert.routes.ts}`
  - CRUD：`GET/POST/PUT/DELETE /api/alert-rules`、`GET/POST /api/alert-events`（列表/标记已读）。
  - 纯计算工具（可单测）：`aggregateRows(rows, field, aggregate)`、`compareValue(value, operator, threshold)`。
  - Webhook 使用 Node 内置 `fetch` + AbortController 超时，不新增依赖。
- `src/utils/scheduler.ts`
  - 导出 `matchCron`，新增 `evaluateAlertRules()`：每分钟匹配 cron、防同分钟重复执行、读取数据、计算聚合、超阈值写 `AlertEvent` + 可选 webhook。
  - 评估取数需带规则创建者上下文，避免 RLS/租户上下文缺失：给 `datasetService.execute` 增加可选 `contextOverride`（tenantId/userId/roleIds），不传时行为不变。
- 前端：
  - `src/api/alert.ts`
  - `src/views/system/components/DatasetAlerts.vue`：规则列表 + 新建/编辑 + 事件记录，复用 `DatasetRowPermissions.vue` 的弹窗与表单风格。
  - `src/views/system/datasets.vue` 行操作增加「告警」按钮。
- 单测 `tests/alert.test.ts`（聚合、比较、cron 匹配）。

### 验证

- 后端 `npx prisma generate && npx prisma migrate deploy`、`npx tsc --noEmit`、`npx vitest run`。
- 重启 3000 端口后端，实测：建规则 → 手动触发评估 → 生成事件 → 标记已读；webhook 可用 httpbin 或本地接口验证。

---

## P1-C Token 嵌入分享（后端 + 前端）

### 目标

1. 修复匿名分享页取不到数据的问题。
2. 提供 `/embed/:token` 纯净嵌入页与 iframe 代码一键复制。

### 方案

- 后端（复用现有 share token，不新增表）：
  - `share.routes.ts` 新增 `POST /api/public/dashboards/:token/datasets/:datasetId/execute`（已在 auth 白名单 `/api/public/dashboards/.+` 覆盖）。
  - `share.service.ts` 新增 `executePublicDataset(token, datasetId, { password, limit })`：
    - 校验 token、过期、密码；
    - 仅允许 layout 组件实际绑定的 datasetId（解析 `layout.components[].dataSource.datasetId`），防止枚举；
    - 以匿名上下文（仅 tenantId）走 `datasetService.execute(..., contextOverride)`，RLS 只命中「全员」规则。
- 前端：
  - `src/utils/public-dashboard-context.ts`：保存当前公开分享/嵌入的 `{ token, password }`。
  - `src/api/share.ts` 增加 `executePublicDataset`。
  - `useDatasetBinding`：检测到公开上下文时改走公开接口，数据形状保持一致。
  - 分享页在密码验证成功后写入上下文；无密码时直接写入。
  - 新增 `src/views/embed/index.vue` + 路由 `/embed/:token`：无工具栏、透明背景、铺满视口，复用 `DashboardScreen`；支持 `?password=`。
  - 现有分享弹窗增加「嵌入代码」复制（`<iframe src=".../embed/{token}" ...>`）；若弹窗位置需确认，在实施时定位现有分享入口后接入。

### 验证

- 后端类型检查 + 重启后：无痕窗口打开 `/share/:token` 图表有数据；`/embed/:token` 可 iframe 正常渲染；密码分享需密码、错误密码被拒绝；改动 layout 后非绑定 dataset 请求返回 404/403。
- 前端 `npx vue-tsc --noEmit`。

---

## P2（P1 验证通过后逐项实施）

1. **抽取模式**：新增 `DatasetExtract` 快照表 + 迁移；`datasetService.execute` 优先读快照；数据集编辑弹窗增加「抽取」Tab（立即抽取 / 定时刷新），复用文件数据集快照结构。
2. **插件 SDK**：`registry.ts` 增加运行时注册入口 `window.BI.registerComponent(def)` 与 manifest 动态加载；定义 `ComponentDefinition` 对外契约与示例插件，保持内置自动扫描不变。
3. **数据血缘**：后端 `GET /api/lineage?dashboardId=&datasetId=` 汇总 datasets → dashboards → components；前端 ECharts graph 弹窗展示（数据集页/看板页入口）。
4. **模板市场完善**：现有模板页已具备分类/预览/导入，补齐搜索、排序与「从模板新建」入口，不新建体系。

每项独立完成类型检查与测试后再进入下一项。

---

## 总体验证清单

- 后端：`npx prisma generate` → `npx prisma migrate deploy` → `npx tsc --noEmit` → `npx vitest run`
- 前端：`npx vue-tsc --noEmit`
- 运行：重启 3000 端口后端进程加载新代码
- 手工回归：联动/钻取、告警事件、匿名分享与嵌入、既有 P0 功能不回归
