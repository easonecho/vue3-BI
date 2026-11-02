# 项目结构文档（拆分后）

> - 项目：`vue3-bi`
> - 技术栈：Vue 3.5 + TypeScript + Pinia + Element Plus + Vite 8 + Vitest 3
> - 文档更新时间：2026-11-02
> - 文档定位：记录大文件拆分与目录重整后的最终结构，作为新增功能、代码评审和后续拆分的落位依据。

## 1. 结构概览

拆分与目录重整遵循三条核心规则：

1. **页面只做组合**：页面入口统一为 `index.vue`，只负责拼装组件、组织页面级状态，不堆放大段模板、接口调用和复杂计算。
2. **业务域自治**：`views/<domain>/` 内部按 `components / composables / utils / styles` 分层；复杂子域继续使用同名子目录。
3. **依赖单向流动**：页面 → 展示组件 / composable → 纯函数工具；`utils/` 不反向依赖组件或 Pinia store。

当前规模：

| 指标 | 数量 |
| --- | --- |
| `src/` 源码文件（`.ts` / `.vue` / `.less` / `.css`） | 470 |
| 单元测试文件 | 66 |
| 单元测试用例 | 586 |
| BI 组件定义目录 | 60 |

## 2. 顶层目录

```text
vue3-bi/
├─ docs/                        # 项目文档
│  └─ PROJECT_STRUCTURE.md      # 本文件
├─ public/                      # 静态资源
├─ scripts/                     # 构建辅助脚本
│  └─ gen-api-types.mjs         # OpenAPI 类型生成
├─ src/                         # 前端源码
├─ e2e-test.mjs                 # 端到端冒烟脚本
├─ vite.config.ts               # 构建、代理、分包配置
├─ vitest.config.ts             # 单元测试配置
├─ tsconfig.json                # TypeScript 配置（@/* -> src/*）
├─ eslint.config.ts             # ESLint 配置
├─ .oxlintrc.json               # Oxlint 配置
├─ Dockerfile / nginx.conf      # 部署配置
├─ docker-compose.yml
└─ package.json
```

## 3. src 顶层职责

```text
src/
├─ api/             # 服务端接口层（按后端业务模块一文件）
├─ components/      # 全局通用组件
├─ directives/      # 全局指令（权限）
├─ i18n/            # 国际化入口、组合式 API 与语言包
├─ layouts/         # 主布局、菜单与页头
├─ plugins/         # 插件加载器与插件 SDK
├─ router/          # 路由表与守卫
├─ stores/          # Pinia 全局状态
├─ styles/          # 全局样式与主题变量
├─ types/           # 全局类型声明
├─ utils/           # 全局工具（HTTP、公开看板上下文）
├─ views/           # 页面（按业务域组织）
├─ App.vue
└─ main.ts
```

| 目录 | 放什么 | 不放什么 |
| --- | --- | --- |
| `api/` | 接口函数、请求/响应类型、模块聚合导出 | 页面状态、UI 逻辑 |
| `components/` | 跨业务复用的展示组件 | 某个页面专用的业务组件 |
| `layouts/` | 全局布局、菜单、页头 | 具体业务页面 |
| `router/` | 路由表、登录态与权限守卫 | 页面内跳转逻辑 |
| `stores/` | 跨页面共享状态、编辑器状态与持久化 | 单个组件的局部状态 |
| `utils/` | 与业务域无关的工具函数 | 依赖组件实例的代码 |
| `views/` | 页面组合根与业务域实现 | 全局通用能力 |

## 4. views 统一分层

业务域内部统一使用以下结构；子目录按需创建，不强制每个域都有全部目录。

```text
views/<domain>/
├─ index.vue          # 页面组合根：拼装组件、组织页面级状态
├─ components/        # 页面专用展示组件（PascalCase）
├─ composables/       # 状态、副作用、接口调用编排（useXxx.ts）
├─ utils/             # 纯函数与纯类型（xxx-utils.ts）
├─ styles/            # 页面级 Less 片段（xxx.less）
└─ <sub-domain>/      # 复杂子域，内部继续按同样方式分层
   ├─ components/
   ├─ composables/
   ├─ utils/
   └─ styles/
```

约定：

1. `index.vue` 不直接堆放接口调用、复杂计算和大段模板；编排逻辑进 `composables/`，纯计算进 `utils/`，展示进 `components/`。
2. 测试文件与被测文件同目录，命名为 `*.test.ts`，不单独建测试目录。
3. 样式优先使用 `scoped`；需要跨组件复用时抽到 `styles/*.less`，由组合根 `@import`。
4. 同一业务域内部使用相对路径；跨业务域、跨 `src` 顶层目录统一使用 `@/` 别名。
5. 除特别说明外，本文目录树省略同目录的 `*.test.ts` 测试文件。

## 5. 业务域详细结构

### 5.1 系统管理（`views/system/`）

复杂业务域收敛为子目录，单页管理保留平铺。

```text
views/system/
├─ users/
│  ├─ index.vue                       # 用户管理页组合根
│  ├─ components/
│  │  ├─ UserFilterBar.vue            # 查询筛选栏
│  │  ├─ UserTable.vue                # 用户表格
│  │  ├─ UserFormDialog.vue           # 新增/编辑用户
│  │  ├─ UserRoleDialog.vue           # 角色分配
│  │  └─ UserPasswordDialog.vue       # 重置密码
│  ├─ composables/
│  │  └─ useUserManagement.ts         # 列表加载、分页、增删改操作
│  └─ utils/
│     └─ user-utils.ts                # 角色标签、表单校验等纯函数
├─ datasets/
│  ├─ index.vue                       # 数据集管理页组合根
│  ├─ components/
│  │  ├─ DatasetUploadDialog.vue      # 上传数据集
│  │  ├─ DatasetEditDialog.vue        # 编辑入口
│  │  ├─ DatasetEditFileTab.vue       # 文件信息
│  │  ├─ DatasetExtractTab.vue        # 数据抽取
│  │  ├─ DatasetFieldsTab.vue         # 字段配置
│  │  ├─ DatasetParamsTab.vue         # 参数配置
│  │  ├─ DatasetColumnPermissions.vue # 列级权限
│  │  ├─ DatasetRowPermissions.vue    # 行级权限
│  │  ├─ DatasetRowPermissionFormDialog.vue
│  │  ├─ DatasetAlerts.vue            # 告警订阅
│  │  ├─ DatasetAlertRulesTab.vue     # 告警规则
│  │  ├─ DatasetAlertEventsTab.vue    # 告警事件
│  │  ├─ DatasetAlertRuleFormDialog.vue
│  │  └─ DataLineage.vue              # 数据血缘
│  ├─ composables/
│  │  ├─ useDatasetAlerts.ts          # 告警列表与操作
│  │  ├─ useDatasetAlertRuleForm.ts   # 规则表单
│  │  └─ useDatasetRowPermissions.ts  # 行级权限列表
│  └─ utils/
│     ├─ dataset-alert-utils.ts       # 告警条件文案、周期格式化
│     ├─ dataset-edit-utils.ts        # 数据集编辑辅助
│     └─ row-permission-utils.ts      # 行权限表达式与校验
├─ roles.vue
├─ departments.vue
├─ menus.vue
├─ datasources.vue
├─ dicts.vue
├─ configs.vue
├─ positions.vue
├─ logs.vue
├─ monitor.vue
├─ usage.vue
└─ scheduled-tasks.vue
```

### 5.2 看板（`views/dashboard/`）

```text
views/dashboard/
├─ index.vue                          # 看板管理页组合根
├─ components/
│  ├─ DashboardPageHeader.vue
│  ├─ DashboardFilterBar.vue
│  ├─ DashboardGrid.vue
│  ├─ DashboardPagination.vue
│  ├─ DashboardCard.vue
│  ├─ DashboardCreateDialog.vue
│  ├─ DashboardCreateInfoForm.vue
│  ├─ DashboardCreateTemplatePicker.vue
│  ├─ DashboardRenameDialog.vue
│  ├─ DashboardGroupDialog.vue
│  ├─ DashboardMoveGroupDialog.vue
│  ├─ DashboardShareDialog.vue
│  ├─ DashboardSaveTemplateDialog.vue
│  ├─ DashboardVersionDialog.vue
│  ├─ DashboardVersionSaveDialog.vue
│  ├─ DashboardVersionDetailDialog.vue
│  ├─ DashboardVersionTable.vue
│  └─ report/                         # 报表订阅子域
│     ├─ ReportSubscriptionDialog.vue
│     ├─ ReportSubscriptionFormDialog.vue
│     ├─ ReportSubscriptionsTab.vue
│     ├─ ReportDeliveriesTab.vue
│     └─ ReportSnapshotPreview.vue
├─ composables/
│  ├─ useDashboardList.ts             # 列表、筛选、分页
│  ├─ useDashboardCreate.ts           # 新建看板
│  ├─ useDashboardActions.ts          # 重命名、分组、分享、删除
│  ├─ useDashboardVersions.ts         # 版本列表与保存
│  └─ report/                         # 报表订阅子域
│     ├─ useReportSubscriptions.ts
│     ├─ useReportDeliveries.ts
│     └─ useSubscriptionForm.ts
└─ utils/
   ├─ dashboard-version-utils.ts      # 版本号、时间等格式化
   └─ report-utils.ts                 # 报表状态与摘要格式化
```

### 5.3 看板模板（`views/dashboard-templates/`）

```text
views/dashboard-templates/
├─ index.vue                          # 模板管理页组合根
├─ components/
│  ├─ TemplatePageHeader.vue
│  ├─ TemplateFilterBar.vue
│  ├─ TemplateGrid.vue
│  ├─ TemplateCard.vue
│  └─ ApplyTemplateDialog.vue
└─ composables/
   ├─ useTemplatePage.ts              # 页面级动作与状态
   ├─ useTemplateList.ts              # 列表、筛选、分页
   ├─ useTemplateActions.ts           # 应用、删除等操作
   └─ useTemplateApply.ts             # 应用模板到新看板
```

### 5.4 素材（`views/material/`）

```text
views/material/
├─ index.vue                          # 素材管理页组合根
├─ components/
│  ├─ MaterialFilterBar.vue
│  ├─ MaterialGrid.vue
│  ├─ MaterialCard.vue
│  ├─ MaterialPreviewDialog.vue
│  └─ MaterialUploadDialog.vue
├─ composables/
│  ├─ useMaterialList.ts
│  ├─ useMaterialPreview.ts
│  └─ useMaterialUpload.ts
└─ utils/
   └─ material-utils.ts               # 类型、大小、时间格式化
```

### 5.5 BI 编辑器（`views/bi-editor/`）

```text
views/bi-editor/
├─ index.vue                          # 编辑器组合根
├─ component-defs/                    # 组件元数据、Schema 与注册表
│  ├─ index.ts
│  ├─ registry.ts
│  ├─ types.ts
│  ├─ schema/
│  │  ├─ defaults.ts                  # 默认属性
│  │  ├─ options.ts                   # 选项定义
│  │  ├─ presets.ts                   # 预设配置
│  │  ├─ props.ts                     # 通用属性
│  │  └─ text.ts                      # 文本属性
│  ├─ _shared/
│  │  ├─ BaseChart.vue                # 图表基类组件
│  │  ├─ echarts-config.ts
│  │  ├─ echarts-options.ts
│  │  └─ props.ts
│  └─ <component>/                    # 60 个组件定义目录
│     ├─ index.ts                     # 元数据、默认值与 Schema
│     └─ Widget.vue                   # 画布渲染组件
├─ components/
│  ├─ HeaderToolbar.vue               # 顶部工具栏组合根
│  ├─ LeftPanel.vue                   # 左侧面板组合根
│  ├─ RightPanel.vue                  # 右侧面板组合根
│  ├─ widget-registry.ts              # Widget 注册
│  ├─ canvas/                         # 画布渲染与交互
│  │  ├─ CanvasArea.vue
│  │  ├─ CanvasComponentItem.vue
│  │  ├─ CanvasInfoBar.vue
│  │  ├─ CanvasSnapLines.vue
│  │  ├─ ComponentRenderer.vue
│  │  ├─ GroupBox.vue
│  │  ├─ ContextMenu.vue
│  │  ├─ canvas-area.less
│  │  └─ canvas-area-global.less
│  ├─ header/                         # 顶部工具栏子组件
│  │  ├─ HeaderLeft.vue
│  │  ├─ HeaderCenter.vue
│  │  ├─ HeaderRight.vue
│  │  ├─ HeaderZoomControl.vue
│  │  └─ HeaderTemplateDialog.vue
│  ├─ left-panel/                     # 组件库与图层
│  │  ├─ ComponentLibraryTab.vue
│  │  ├─ LayerListTab.vue
│  │  ├─ useLayerList.ts
│  │  ├─ layer-list-utils.ts
│  │  └─ layer-list.less
│  ├─ property/                       # 属性字段渲染与数据绑定
│  │  ├─ PropFieldRenderer.vue
│  │  ├─ PropAssetField.vue
│  │  ├─ PropTableEditor.vue
│  │  ├─ PropTableCellEditor.ts
│  │  ├─ AssetPicker.vue
│  │  └─ DataBindingPanel.vue
│  └─ right-panel/                    # 属性/样式/画布配置
│     ├─ PropsTab.vue
│     ├─ PropsSinglePanel.vue
│     ├─ PropsMultiPanel.vue
│     ├─ StyleTab.vue
│     ├─ CanvasTab.vue
│     ├─ AlignActions.vue
│     ├─ GroupActions.vue
│     ├─ ComponentCodeConfig.vue
│     └─ shared.less
├─ composables/
│  ├─ useCanvas.ts                    # 键盘快捷键与画布入口
│  ├─ useCanvasCoordinates.ts          # 坐标换算
│  ├─ useCanvasInteraction.ts          # 画布交互编排
│  ├─ useCanvasPan.ts                 # 平移
│  ├─ useCanvasWheel.ts               # 滚轮缩放
│  ├─ useCanvasPointerDelegation.ts   # 指针事件委派
│  ├─ useCanvasTransform.ts           # 缩放与变换状态
│  ├─ useCanvasFit.ts                 # 自适应画布
│  ├─ useCanvasGroupDrag.ts           # 分组拖拽
│  ├─ useCanvasExportPng.ts           # 导出 PNG
│  ├─ useCanvasContextMenu.ts         # 右键菜单
│  ├─ useRulerGuides.ts               # 标尺与参考线
│  ├─ useSmartGuides.ts               # 智能吸附
│  ├─ useMarqueeSelect.ts             # 框选
│  ├─ useViewportCulling.ts           # 视口裁剪
│  ├─ useHeaderDocumentActions.ts     # 文档级操作
│  ├─ useHeaderSelection.ts           # 顶部选择状态
│  ├─ useHeaderExport.ts              # 顶部导出
│  ├─ useChartAggregation.ts          # 图表聚合
│  ├─ useDatasetBinding.ts            # 数据集绑定
│  ├─ useDatasetSemantics.ts          # 数据集语义
│  ├─ aggregate-request.ts            # 聚合请求编排
│  ├─ dataset-worker.ts               # 数据集 Worker 通信
│  └─ linkage-filter.ts               # 联动过滤
├─ utils/
│  ├─ canvas-transform-utils.ts       # 画布坐标变换纯函数
│  └─ ruler-guides-utils.ts           # 标尺刻度纯函数
├─ constants/
│  └─ canvas-constants.ts
└─ types/
   └─ index.ts
```

`component-defs/` 当前包含 60 个组件定义目录，按用途大致分为：

| 类型 | 示例 |
| --- | --- |
| 图表 | `line-chart`、`bar-chart`、`pie-chart`、`area-chart`、`combo-chart`、`scatter-chart`、`heatmap-chart`、`sankey-chart` |
| 指标 | `kpi-card`、`stat-card`、`progress`、`gauge`、`indicator` |
| 表格/列表 | `table`、`tree-table`、`scroll-table`、`rank-list`、`description-list` |
| 文本/媒体 | `text`、`title-bar`、`image`、`video-player`、`qrcode`、`icon` |
| 筛选/装饰 | `filter`、`dropdown-filter`、`date-picker`、`divider`、`decor-border` |
| 三维/地图 | `bar3d-chart`、`china-map` |
| 金融 | `candlestick-chart`、`macd-chart`、`volume-chart` |

画布状态集中在 `src/stores/bi-editor/`：

```text
stores/bi-editor/
├─ index.ts               # 对外组合的 store API
├─ editor-session.ts      # 加载/保存会话、乐观锁冲突
├─ editor-draft.ts        # 本地草稿读写
├─ editor-layout.ts       # 布局序列化/应用
├─ use-components.ts      # 组件级 API
├─ use-canvas.ts          # 画布级 API
├─ canvas-align.ts
├─ canvas-export.ts
├─ clipboard.ts
├─ history.ts
├─ metadata.ts
└─ component-ops/         # 组件操作纯逻辑
   ├─ align.ts
   ├─ component-crud.ts
   ├─ component-index.ts
   ├─ drag-preview.ts
   ├─ group-bounds.ts
   ├─ group-selection.ts
   ├─ layer-order.ts
   ├─ selection.ts
   └─ types.ts
```

### 5.6 预览与大屏（`views/preview/`、`views/screen/`）

```text
views/preview/
├─ index.vue                          # 预览页组合根
├─ components/
│  ├─ DashboardScreen.vue             # 复用画布只读渲染
│  └─ PreviewToolbar.vue              # 浮动工具栏
├─ composables/
│  ├─ usePreviewSession.ts            # 加载、刷新、返回
│  ├─ usePreviewToolbar.ts            # 工具栏显隐、全屏、纯静模式
│  └─ useTemplateThumbnail.ts         # 模板缩略图
├─ utils/
│  └─ preview-utils.ts                # 时间与缩略图工具
└─ styles/
   └─ preview.less

views/screen/
├─ index.vue                          # 数据大屏组合根
├─ components/
│  ├─ ScreenKpiCards.vue
│  ├─ ScreenRatePanel.vue
│  └─ ScreenRankingPanel.vue
├─ composables/
│  ├─ useScreenCharts.ts              # ECharts 实例与渲染
│  └─ useScreenDashboard.ts           # 大屏数据会话与全屏
├─ utils/
│  ├─ screen-chart-options.ts         # 图表 option
│  └─ screen-utils.ts                 # 数值格式化
└─ styles/
   └─ screen.less
```

### 5.7 其他页面

```text
views/share/index.vue       # 公开分享 / iframe 嵌入（复用画布只读渲染）
views/login/index.vue       # 登录页
views/error/403.vue         # 403
views/error/404.vue         # 404
views/api-demo/index.vue    # 接口调用演示
```

## 6. 全局支撑层

### 6.1 API 层

```text
api/
├─ index.ts               # 聚合导出
├─ types.ts               # 通用实体类型
├─ auth.ts / user.ts / role.ts / department.ts / menu.ts / position.ts
├─ dataset.ts / datasource.ts / lineage.ts / chart.ts / export.ts
├─ dashboard.ts / dashboard-group.ts / dashboard-template.ts / dashboard-version.ts
├─ report.ts / material.ts / share.ts
├─ scheduled-task.ts / operation-log.ts / monitor.ts / usage.ts / alert.ts
├─ dict.ts / system-config.ts
├─ contract.test.ts       # 前后端接口契约测试
└─ generated/
   ├─ openapi.d.ts        # 自动生成，禁止手改
   └─ openapi-paths.json
```

约定：

- 新接口按后端模块新增 `api/<module>.ts`，文件名为领域名或小写短横线。
- 通用响应结构放 `types.ts`；模块专属请求/响应类型放模块文件本身。
- 页面优先按需导入：`import { getDatasetList } from '@/api/dataset'`；需要聚合时使用 `@/api`。
- `api/generated/` 由 `pnpm gen:api-types` 生成，不手工修改。

### 6.2 全局组件与布局

```text
components/
├─ ErrorBoundary.vue
├─ LangSwitcher.vue
├─ MonacoEditor.vue
├─ SqlEditor.vue
└─ ThemeSwitcher.vue

layouts/
├─ SystemLayout.vue
├─ layout-menu-utils.ts
├─ components/
│  ├─ LayoutHeader.vue
│  └─ SidebarMenu.vue
└─ composables/
   └─ useSystemLayout.ts
```

### 6.3 全局状态与工具

```text
stores/
├─ linkage.ts
├─ menu.ts
├─ theme.ts
├─ user.ts
└─ bi-editor/          # 见 5.5

utils/
├─ request.ts          # Axios 实例、拦截器与错误处理
└─ public-dashboard-context.ts

router/
└─ index.ts           # 路由表、登录态与权限守卫

plugins/
├─ plugin-loader.ts
└─ plugin-sdk.ts

directives/
└─ permission.ts

i18n/
├─ index.ts
├─ composables.ts
└─ locales/
   ├─ zh-CN.ts
   └─ en-US.ts

styles/
├─ global.less
└─ theme.css

types/
├─ router.d.ts
└─ scena-guides.d.ts
```

## 7. 依赖方向与引用规则

```text
views/<domain>/index.vue
   ├─ components/*          展示、接收 props、抛出事件
   ├─ composables/*         状态编排、接口调用、副作用
   │     ├─ api/*           服务端接口
   │     ├─ stores/*        跨页面或编辑器共享状态
   │     └─ utils/*         纯函数
   └─ styles/*              页面样式

components/*               优先只依赖 props / emit；确需局部交互时可调用同域 composable
utils/*                    只依赖类型与纯函数，不依赖组件实例、Pinia、Element Plus
```

引用规则：

- 跨业务域 / 跨 `src` 顶层目录：`@/api/...`、`@/stores/...`、`@/components/...`。
- 同一业务域内部：`./components/Xxx.vue`、`../utils/xxx-utils`。
- 避免超过两级的 `../../..`；出现时优先改用 `@/` 别名。
- 测试文件与被测文件同目录，使用相对路径导入被测模块。
- 全局通用能力放 `src/components`、`src/utils`、`src/stores`；只服务单个页面的实现留在该业务域。

## 8. 命名规范

| 类型 | 规则 | 示例 |
| --- | --- | --- |
| 页面组合根 | `index.vue` | `views/dashboard/index.vue` |
| 展示组件 | PascalCase | `DashboardGrid.vue`、`UserTable.vue` |
| Composable | `use` 前缀 + camelCase | `useUserManagement.ts` |
| 纯函数工具 | kebab-case + `-utils` | `dataset-edit-utils.ts` |
| 样式片段 | kebab-case + `.less` | `canvas-area.less` |
| 单元测试 | 同目录 + `.test.ts` | `useUserManagement.test.ts` |
| Store | 业务域目录 + 语义文件名 | `stores/bi-editor/editor-session.ts` |
| BI 组件定义 | `<component>/index.ts` + `Widget.vue` | `component-defs/kpi-card/index.ts` |

## 9. 新增功能落位

1. **新增单页管理**：`views/system/<page>.vue`，并在 `router/index.ts` 注册。
2. **新增复杂业务域**：建 `<domain>/index.vue`，按 `components / composables / utils / styles` 分层。
3. **页面出现大段模板**：拆到 `components/`，入口只保留组合逻辑。
4. **页面出现接口编排或副作用**：抽到 `composables/useXxx.ts`。
5. **页面出现可测试的纯计算**：抽到 `utils/xxx-utils.ts`，并补同目录单测。
6. **新增接口**：`api/<module>.ts`，必要时在 `api/index.ts` 聚合。
7. **新增全局共享状态**：`stores/<domain>.ts`；仅编辑器内部使用则放 `stores/bi-editor/`。
8. **新增 BI 可视化组件**：`views/bi-editor/component-defs/<component>/`（`index.ts` + `Widget.vue`），再在注册表登记。
9. **新增测试**：与被测文件同目录，覆盖纯函数与关键交互。

## 10. 拆分与目录调整记录

### 10.1 大文件拆分

| 原文件 | 拆分后落位 |
| --- | --- |
| `HeaderToolbar.vue`（745 行） | 59 行组合根 + `components/header/*` |
| `LeftPanel.vue`（911 行） | 194 行组合根 + `components/left-panel/*` |
| `RightPanel.vue`（1530 行） | 165 行组合根 + `components/right-panel/*`、`components/property/*` |
| `CanvasArea.vue`（808 行） | 组合根 + `components/canvas/*`、`composables/useCanvas*.ts` |
| `component-defs/types.ts` | `component-defs/schema/*` 领域模块 |
| `stores/bi-editor` 巨型文件（926 行） | store 组合根 + `editor-session` / `editor-draft` / `editor-layout` / `component-ops/*` |
| `use-components.ts`（1020 行） | 107 行 API + `component-ops/*` 纯操作 |
| 看板管理页（587 行） | 162 行组合根 + `Dashboard*` 组件与 composable |
| 新建看板/版本弹窗（436 / 370 行） | 82 / 139 行组合根 + 表单、模板选择、版本表格等子组件 |
| 定时报表弹窗（603 行） | 162 行组合根 + `dashboard/components/report/*` |
| 看板模板页（700 行） | 组合根 + `dashboard-templates/components|composables/*` |
| 素材管理页（682 行） | 92 行组合根 + `material/components|composables|utils/*` |
| 系统数据集编辑 / 行级权限 / 用户页 | 子组件 + `dataset-edit-utils` / `row-permission-utils` / `useUserManagement` |
| `DatasetAlerts.vue`（557 行） | 139 行组合根 + 告警规则/事件/表单子组件与 composable |
| `Preview` 页面 | 组合根 + `preview/components|composables|utils|styles/*` |
| `Screen` 页面 | 组合根 + `screen/components|composables|utils|styles/*` |
| `SystemLayout.vue`（614 行） | 130 行组合根 + `layouts/components/*`、`layouts/composables/useSystemLayout.ts` |

### 10.2 目录调整

| 调整项 | 调整前 | 调整后 |
| --- | --- | --- |
| 用户管理 | `system/users.vue` + 公共 `components/`、`composables/`、`user-utils.ts` | `system/users/{index.vue,components,composables,utils}` |
| 数据集管理 | `system/datasets.vue` + 公共 `components/`、`composables/`、`dataset-alert-utils.ts` | `system/datasets/{index.vue,components,composables,utils}` |
| 预览页 | 组件 / composable / 工具 / 样式全部平铺 | `preview/{components,composables,utils,styles}` |
| 数据大屏 | 组件 / composable / 工具 / 样式全部平铺 | `screen/{components,composables,utils,styles}` |
| BI 画布组件 | `components/` 根目录平铺 | `components/canvas/` |
| 属性字段组件 | `components/` 根目录平铺 | `components/property/` |
| 报表订阅 | `dashboard/components`、`dashboard/composables` 混放 | `dashboard/components/report`、`dashboard/composables/report` |
| 工具函数 | `dashboard/`、`material/`、`bi-editor/composables/` 散落 | 各域 `utils/` 目录统一 |
| 用户接口 | `api/user.service.ts` | `api/user.ts` |

## 11. 验证命令与结果

```bash
pnpm exec vitest run          # 全量单元测试
pnpm exec vue-tsc --noEmit    # 类型检查
pnpm exec eslint src --quiet  # 静态检查
pnpm exec vite build          # 生产构建
```

本次结构重整后的验证结果：

| 检查项 | 结果 |
| --- | --- |
| 单元测试 | 66 个测试文件、586 个用例全部通过 |
| 类型检查 | `vue-tsc --noEmit` 通过 |
| 静态检查 | `eslint src --quiet` 通过 |
| 生产构建 | `vite build` 通过（仅保留原有 `::v-deep` 与 chunk 体积警告） |

## 12. 目录维护清单

新增或移动文件时按以下顺序自检：

1. 页面入口是否仍只做组合，没有堆积大段模板或接口逻辑。
2. 展示组件是否放在业务域 `components/`，跨域复用才上升到 `src/components`。
3. 接口编排与副作用是否放在 `composables/`，纯计算是否放在 `utils/`。
4. 同域引用是否使用相对路径，跨域引用是否使用 `@/` 别名。
5. 是否出现 `../../..`；若出现，优先改用别名或调整模块归属。
6. 测试是否与被测文件同目录。
7. 是否同步更新本文档对应的目录树。
