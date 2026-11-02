# 项目目录结构与分层规范

> 适用范围：`vue3-bi` 前端工程（Vue 3 + TypeScript + Pinia + Vite）。
> 目标：页面只做组合，业务逻辑、纯函数与样式各自归位，目录按业务域可独立演进。

## 1. 顶层结构

```text
vue3-bi/
├─ docs/                     # 项目文档（本文件）
├─ public/                   # 静态资源
├─ scripts/                  # OpenAPI 类型生成等构建脚本
├─ src/                      # 前端源码
├─ e2e-test.mjs              # 端到端冒烟脚本
├─ vite.config.ts            # 构建 / 代理 / 分包配置
├─ vitest.config.ts          # 单元测试配置
├─ tsconfig.json             # TS 配置（@/* -> src/*）
├─ Dockerfile / nginx.conf   # 部署配置
└─ package.json
```

## 2. src 顶层职责

```text
src/
├─ api/             # 服务端接口层（按后端业务模块一文件）
├─ components/       # 全局通用组件（编辑器、主题、语言、错误边界）
├─ directives/       # 全局指令（权限）
├─ i18n/             # 国际化入口与语言包
├─ layouts/          # 主布局（侧边栏、页头、布局 composable）
├─ plugins/          # 插件加载器与插件 SDK
├─ router/           # 路由表、登录态与权限守卫
├─ stores/           # Pinia 全局状态
├─ styles/           # 全局样式与主题变量
├─ types/            # 全局类型声明（路由、第三方库补丁）
├─ utils/            # 全局工具（HTTP 请求、公共看板上下文）
├─ views/            # 页面（按业务域组织）
├─ App.vue
└─ main.ts
```

| 目录 | 放什么 | 不放什么 |
| --- | --- | --- |
| `api/` | 接口函数、请求/响应类型、模块聚合导出 | 页面状态、UI 逻辑 |
| `components/` | 跨业务复用的展示组件 | 某个页面专用的业务组件（放该域 `components/`） |
| `layouts/` | 全局布局、菜单、页头 | 具体业务页面 |
| `router/` | 路由表、守卫 | 页面内跳转逻辑（放 composable 或页面） |
| `stores/` | 跨页面共享状态与持久化 | 单个组件的局部状态 |
| `utils/` | 与业务域无关的工具 | 依赖组件实例的代码 |
| `views/` | 页面组合根与业务域实现 | 全局通用能力 |

## 3. views 统一分层

业务域内部按以下约定组织；目录按需创建，不强制每个域都有全部子目录。

```text
views/<domain>/
├─ index.vue          # 页面组合根：只负责拼装与路由级状态
├─ components/        # 页面专用子组件（PascalCase）
├─ composables/       # 状态、副作用、接口调用编排（useXxx.ts）
├─ utils/             # 纯函数与纯类型（xxx-utils.ts）
├─ styles/            # 页面级 Less 片段（xxx.less）
└─ <sub-domain>/      # 复杂子域，内部再按同样方式分层
   ├─ components/
   ├─ composables/
   └─ utils/
```

约束：

1. `index.vue` 不直接堆放接口调用、复杂计算和大段模板；编排逻辑进 `composables/`，纯计算进 `utils/`，展示进 `components/`。
2. 测试文件与被测文件同目录，命名为 `*.test.ts`，不单独建测试目录。
3. 样式优先 scoped；需要跨组件复用时抽 `styles/*.less` 并由组合根 `@import`。
4. 同一业务域内部用相对路径；跨业务域、跨 `src` 顶层目录统一用 `@/` 别名。

## 4. 各业务域结构

### 4.1 BI 编辑器（`views/bi-editor/`）

```text
views/bi-editor/
├─ index.vue                    # 编辑器组合根（Header + LeftPanel + CanvasArea + RightPanel）
├─ component-defs/              # 组件元数据、Schema 与注册表
│  ├─ index.ts / registry.ts / types.ts
│  ├─ schema/                   # 属性 Schema、默认值、预设、图表通用配置
│  ├─ _shared/                  # BaseChart、ECharts 配置与共享 props
│  └─ <component>/              # 每个可视化组件一个目录：index.ts + Widget.vue
├─ components/
│  ├─ canvas/                   # 画布：CanvasArea、组件渲染、吸附线、分组框、右键菜单
│  ├─ header/                   # 顶部工具栏拆分（左/中/右、缩放、模板弹窗）
│  ├─ left-panel/               # 组件库、图层列表及其实用工具
│  ├─ property/                 # 属性字段渲染、表格/素材字段、数据绑定
│  ├─ right-panel/              # 属性/样式/画布配置面板
│  ├─ HeaderToolbar.vue
│  ├─ LeftPanel.vue
│  ├─ RightPanel.vue
│  └─ widget-registry.ts
├─ composables/                 # 画布交互、标尺、导入导出、数据绑定、视口裁剪等
├─ utils/                       # 画布坐标变换、标尺刻度等纯函数
├─ constants/                   # 画布常量
└─ types/                       # 编辑器领域类型
```

画布相关状态集中在 `src/stores/bi-editor/`：

```text
stores/bi-editor/
├─ index.ts             # 对外组合的 store API
├─ editor-session.ts    # 加载/保存会话、乐观锁冲突处理
├─ editor-draft.ts      # 本地草稿读写
├─ editor-layout.ts     # 布局序列化/应用
├─ use-components.ts    # 组件级 API
├─ component-ops/       # 组件 CRUD、选中、层级、分组、对齐等纯操作
├─ canvas-align.ts / canvas-export.ts / clipboard.ts / history.ts / metadata.ts
└─ use-canvas.ts        # 画布级 API
```

### 4.2 系统管理（`views/system/`）

复杂业务域收敛为子目录，单页管理保留平铺：

```text
views/system/
├─ datasets/
│  ├─ index.vue                 # 数据集管理页
│  ├─ components/               # 编辑、上传、字段、参数、抽取、行/列权限、告警、血缘
│  ├─ composables/              # 告警、规则表单、行级权限列表
│  └─ utils/                    # 数据集编辑、告警、行权限纯函数
├─ users/
│  ├─ index.vue                 # 用户管理页
│  ├─ components/               # 筛选栏、表格、表单/角色/密码弹窗
│  ├─ composables/              # 用户列表与操作
│  └─ utils/                    # 角色标签、表单校验规则
├─ roles.vue / departments.vue / menus.vue
├─ datasources.vue
├─ dicts.vue / configs.vue / positions.vue
├─ logs.vue / monitor.vue / usage.vue
└─ scheduled-tasks.vue
```

### 4.3 看板、模板与素材

```text
views/dashboard/
├─ index.vue
├─ components/
│  ├─ Dashboard*.vue            # 列表、筛选、卡片、分页、创建、版本、分享、分组
│  └─ report/                   # 报表订阅、投递记录、快照预览
├─ composables/
│  ├─ useDashboard*.ts          # 列表、创建、操作、版本
│  └─ report/                   # 订阅、投递、订阅表单
└─ utils/                       # 版本格式化、报表格式化

views/dashboard-templates/
├─ index.vue
├─ components/                  # 模板卡片、筛选、应用、页头
└─ composables/                 # 模板列表、应用、页面动作

views/material/
├─ index.vue
├─ components/                  # 素材卡片、筛选、网格、预览、上传
├─ composables/                 # 列表、预览、上传
└─ utils/                       # 类型、大小、时间格式化
```

### 4.4 预览、大屏与分享

```text
views/preview/
├─ index.vue                    # 预览组合根
├─ components/                  # DashboardScreen、PreviewToolbar
├─ composables/                 # 预览会话、工具栏行为、模板缩略图
├─ utils/                       # 时间与缩略图工具
└─ styles/                      # 预览页样式

views/screen/
├─ index.vue                    # 大屏组合根
├─ components/                  # KPI、比率、排行面板
├─ composables/                 # 图表实例、大屏数据会话
├─ utils/                       # 图表 option、数值格式化
└─ styles/                      # 大屏样式

views/share/index.vue           # 公开分享 / iframe 嵌入（复用画布只读渲染）
views/login/index.vue           # 登录页
views/error/403.vue / 404.vue   # 错误页
views/api-demo/index.vue        # 接口调用演示页
```

## 5. API 层约定

```text
api/
├─ index.ts             # 聚合导出（命名空间 + 按需命名导出）
├─ types.ts             # 通用实体类型（User/Role/Dataset/Dashboard 等）
├─ user.ts              # 用户相关接口（原 user.service.ts）
├─ auth.ts / menu.ts / role.ts / department.ts ...
├─ dataset.ts / datasource.ts / chart.ts / export.ts ...
├─ dashboard*.ts / report.ts / material.ts / monitor.ts ...
└─ generated/
   ├─ openapi.d.ts      # 自动生成，禁止手改
   └─ openapi-paths.json
```

- 新接口按后端模块新增 `api/<module>.ts`，文件名为小写短横线或领域名。
- 通用响应结构放 `types.ts`；模块专属请求/响应类型放模块文件本身。
- 页面优先按需导入：`import { getDatasetList } from '@/api/dataset'`；需要聚合时使用 `@/api`。

## 6. 命名规范

| 类型 | 规则 | 示例 |
| --- | --- | --- |
| 页面组合根 | `index.vue` | `views/dashboard/index.vue` |
| 展示组件 | PascalCase | `DashboardGrid.vue`、`UserTable.vue` |
| Composable | `use` 前缀 + camelCase | `useUserManagement.ts` |
| 纯函数工具 | kebab-case + `-utils` | `dataset-edit-utils.ts` |
| 样式片段 | kebab-case + `.less` | `canvas-area.less` |
| 单元测试 | 同目录 + `.test.ts` | `useUserManagement.test.ts` |
| Store | 业务域目录 + 语义文件名 | `stores/bi-editor/editor-session.ts` |

引用规则：

- 跨域 / 跨顶层目录：`@/api/...`、`@/stores/...`、`@/components/...`。
- 同域内：`./components/Xxx.vue`、`../utils/xxx-utils`。
- 避免超过两级的 `../../..`；出现时优先改用 `@/` 别名。

## 7. 新增功能落位清单

1. 新增单页管理：`views/system/<page>.vue` + 在 `router/index.ts` 注册。
2. 新增复杂业务域：建 `<domain>/index.vue`，按 `components/composables/utils` 分层。
3. 新增接口：`api/<module>.ts`，必要时在 `api/index.ts` 聚合。
4. 新增全局共享状态：`stores/<domain>.ts`；仅编辑器内部使用则放 `stores/bi-editor/`。
5. 新增 BI 可视化组件：`views/bi-editor/component-defs/<component>/`（`index.ts` + `Widget.vue`），再在注册表登记。
6. 新增测试：与被测文件同目录，覆盖纯函数与关键交互。

## 8. 验证命令

```bash
pnpm exec vitest run          # 全量单元测试
pnpm exec vue-tsc --noEmit    # 类型检查
pnpm exec eslint src --quiet  # 静态检查
pnpm exec vite build          # 生产构建
```

## 9. 本次目录调整记录

| 调整项 | 调整前 | 调整后 |
| --- | --- | --- |
| 用户管理 | `system/users.vue` + 公共 `components/`、`composables/`、`user-utils.ts` | `system/users/{index.vue,components,composables,utils}` |
| 数据集管理 | `system/datasets.vue` + 公共 `components/`、`composables/`、`dataset-alert-utils.ts` | `system/datasets/{index.vue,components,composables,utils}` |
| 预览页 | 组件/composable/工具/样式全部平铺 | `preview/{components,composables,utils,styles}` |
| 数据大屏 | 组件/composable/工具/样式全部平铺 | `screen/{components,composables,utils,styles}` |
| BI 画布组件 | `components/` 根目录平铺 | `components/canvas/` |
| 属性字段组件 | `components/` 根目录平铺 | `components/property/` |
| 报表订阅 | `dashboard/components`、`dashboard/composables` 混放 | `dashboard/components/report`、`dashboard/composables/report` |
| 工具函数 | `dashboard/`、`material/`、`bi-editor/composables/` 散落 | 各域 `utils/` 目录统一 |
| 用户接口 | `api/user.service.ts` | `api/user.ts` |
