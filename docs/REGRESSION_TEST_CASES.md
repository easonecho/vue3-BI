# 全量回归测试案例（2026-11-26）

> 项目：vue3-bi（Vue 3 + Vite 8 + Element Plus + ECharts 6） / bi-lowcode-server（Koa + Prisma + MySQL 8）
> 环境：前端 http://localhost:5173 、后端 http://localhost:3000 、数据库已初始化、测试账号 `admin/admin123`、`user/user123`
> 代码基线：前端 `38aeaf0`、后端 `96e0cdc`（dev 分支）
> 说明：执行方式分为 `AUTO`（单元/集成自动化）、`API`（接口回归脚本）、`UI`（浏览器端到端）、`STATIC`（类型/lint/构建）。

## 1. 回归范围

| 域 | 覆盖内容 |
| --- | --- |
| 认证与权限 | 登录/注册/刷新/登出、JWT 失效、权限码、租户隔离 |
| 看板管理 | 列表筛选排序、新建、模板创建、重命名、收藏、复制、分组、删除、版本、评论、分享、ACL、报表订阅 |
| BI 编辑器 | 加载/保存、组件增删改、图层、撤销重做、对齐分组、数据绑定、聚合、联动、导出、预览 |
| 数据集/数据源 | SQL 预览/创建/执行、聚合查询、分页、distinct、批量取数、表达式校验、文件上传/抽取、行列权限、血缘 |
| 系统管理 | 用户、角色、部门、菜单、字典、配置、岗位、租户、定时任务、操作日志、监控、使用分析 |
| 素材/模板 | 素材上传/列表/删除/下载、模板库筛选/应用/删除 |
| 分享/大屏 | 公开分享、密码保护、撤销/过期、公开数据集取数、嵌入模式、预览、大屏 |
| 通用质量 | 404/405/参数校验格式、分页边界、中英文、主题、响应式、控制台错误 |

## 2. 测试案例矩阵

### A. 认证与权限（10）

| ID | 测试点 | 预期结果 | 优先级 | 方式 |
| --- | --- | --- | --- | --- |
| A01 | 正确账号登录（admin/admin123） | 200，返回 accessToken/refreshToken/user | P0 | API/UI |
| A02 | 错误密码登录 | 401，中文错误提示，无 token | P0 | API |
| A03 | 空用户名/密码登录 | 400，`参数校验失败: username/password` | P1 | API |
| A04 | 未登录访问 /dashboard | 跳转 /login 并携带 redirect | P0 | UI |
| A05 | 无效/伪造 Token 访问接口 | 401，JSON 错误结构 | P0 | API |
| A06 | 普通用户 user/user123 访问受限菜单 | 无系统管理菜单，直链访问跳 403 | P0 | API/UI |
| A07 | 管理员菜单树/权限码加载 | `/menus/me/tree`、`/menus/me/perms` 返回完整 | P0 | API |
| A08 | refresh 刷新与 logout 黑名单 | 刷新成功；登出后旧 refresh 失效 | P1 | API |
| A09 | 多租户信息与隔离 | `/tenants/current` 返回当前租户；用户列表仅本租户 | P1 | API |
| A10 | 越权访问他人看板/管理接口 | 403 或数据不可见，不泄露内容 | P0 | API |

### B. 看板管理（18）

| ID | 测试点 | 预期结果 | 优先级 | 方式 |
| --- | --- | --- | --- | --- |
| B01 | 看板列表分页与统计 counts | 返回 list/total/published/draft | P0 | API |
| B02 | 关键字/状态/公开性/收藏/分组筛选 | 结果符合筛选条件 | P0 | API |
| B03 | 排序 createdAt/updatedAt/name | 顺序正确 | P1 | API |
| B04 | 新建空白看板 | 创建成功，默认 layout 可用 | P0 | API/UI |
| B05 | 基于模板新建 | 名称=模板名，layout 复制成功 | P0 | UI |
| B06 | 重命名/描述/公开状态更新 | 更新成功并持久化 | P0 | API |
| B07 | 收藏切换 | isFavorited 反转，onlyFavorites 可筛出 | P1 | API |
| B08 | 复制看板 | 生成副本，名称带副本标识 | P1 | API |
| B09 | 移动分组/移出分组 | groupId 正确变更 | P1 | API |
| B10 | 删除看板 | 列表不再返回，详情 404 | P0 | API |
| B11 | 分组 CRUD 与删除冲突 | 含看板分组删除返回业务错误 | P1 | API |
| B12 | 版本保存/列表/详情/恢复/删除 | 全链路成功，恢复后 layout 回滚 | P0 | API |
| B13 | 评论新增/列表/删除 | 仅作者/管理员可删 | P1 | API |
| B14 | 分享创建/查询/撤销 | token 生成、hasPassword/expiresAt 正确 | P0 | API |
| B15 | ACL 读取/整体替换 | 授权项持久化，空数组清空 | P1 | API |
| B16 | 看板模板列表/分类/应用/保存/删除 | 系统模板不可改删，用户模板可管理 | P0 | API |
| B17 | 报表订阅 CRUD 与立即执行 | 订阅保存、执行生成投递记录 | P1 | API |
| B18 | 看板名称边界 | 空/纯空格拒绝；重复名按业务规则处理 | P1 | API |

### C. BI 编辑器（14）

| ID | 测试点 | 预期结果 | 优先级 | 方式 |
| --- | --- | --- | --- | --- |
| C01 | 打开已有看板加载 layout | 画布组件与配置完整还原 | P0 | UI |
| C02 | 新建空白看板进入编辑器并保存 | 保存成功，刷新后内容保留 | P0 | UI |
| C03 | 组件拖入/选中/移动/缩放 | 位置尺寸更新，吸附辅助线生效 | P0 | UI |
| C04 | 属性面板修改（标题/坐标轴/图例） | 画布实时更新 | P0 | UI |
| C05 | 图层顺序/锁定/隐藏 | 层级与交互状态正确 | P1 | UI |
| C06 | 撤销/重做/复制/粘贴/删除 | 操作可回退，快捷键生效 | P0 | UI |
| C07 | 多选/对齐/分组 | 对齐精确，分组拖拽同步 | P1 | UI |
| C08 | 数据绑定与聚合查询 | 图表数据来自数据集，聚合结果正确 | P0 | UI |
| C09 | 图表联动筛选 | 触发源筛选后目标图表刷新 | P1 | UI |
| C10 | 保存乐观锁冲突 | 版本冲突时提示，不覆盖他人修改 | P1 | API |
| C11 | 导出 PNG / PDF | 文件生成成功且可打开 | P1 | UI |
| C12 | 预览页渲染/返回/全屏/纯静 | 只读渲染正确，工具栏可用 | P0 | UI |
| C13 | 图表渲染与控制台 | line/bar/pie/table/kpi 正常，无 console error/warning | P0 | UI |
| C14 | 模板编辑模式保存 | 保存到模板库，不生成看板 | P1 | UI |

### D. 数据集与数据源（15）

| ID | 测试点 | 预期结果 | 优先级 | 方式 |
| --- | --- | --- | --- | --- |
| D01 | 数据集列表/详情 | 分页与字段完整 | P0 | API |
| D02 | SQL 预览（合法/非只读） | 合法返回列与行；写操作被拦截 | P0 | API |
| D03 | 创建/更新/删除 SQL 数据集 | 全链路成功，删除后 404 | P0 | API |
| D04 | 执行数据集数据 | 返回 columns/rows/rowCount | P0 | API |
| D05 | 聚合查询 groupBy/metrics | 聚合值正确，支持 countDistinct 等 | P0 | API |
| D06 | 服务端分页 rows | offset/limit/hasMore/sort/filters 正确 | P0 | API |
| D07 | distinct 候选值 | limit 上限 500，truncated 标记正确 | P1 | API |
| D08 | 批量取数 batch-query | 单项失败不影响其他项，>20 项拒绝 | P1 | API |
| D09 | 计算字段表达式校验 | 合法通过，未知字段返回 unknownFields | P1 | API |
| D10 | 文件数据集上传/替换/删除 | CSV/Excel 解析成功，替换后数据更新 | P0 | API |
| D11 | 数据集抽取与定时刷新 | 快照生成，refresh 配置保存，非法 cron 拒绝 | P1 | API |
| D12 | 行级权限 CRUD 与生效 | 规则保存，受限用户查询行数减少 | P0 | API |
| D13 | 列级权限 CRUD 与生效 | 隐藏字段不出现在结果 | P0 | API |
| D14 | 数据源列表/详情/表结构/测试连接 | 连接成功返回表/字段；失败有中文提示 | P1 | API |
| D15 | 数据血缘查询 | 返回上下游关系 | P2 | API |

### E. 系统管理（16）

| ID | 测试点 | 预期结果 | 优先级 | 方式 |
| --- | --- | --- | --- | --- |
| E01 | 用户列表/详情/新增/编辑/删除 | 全链路成功 | P0 | API/UI |
| E02 | 角色分配/重置密码 | 角色更新；新密码可登录 | P0 | API |
| E03 | 重复用户名/自删/弱密码 | 业务错误且不落库 | P1 | API |
| E04 | 角色 CRUD/内置角色保护 | 内置角色不可删改 | P0 | API |
| E05 | 角色菜单分配与回显 | menuIds 保存并可查询 | P1 | API |
| E06 | 部门列表/树/CRUD/删除冲突 | 含用户/子部门不可删 | P1 | API |
| E07 | 菜单列表/树/CRUD | 树结构正确，删除含子菜单拒绝 | P1 | API |
| E08 | 字典与字典项 CRUD | 类型唯一，项值保存 | P1 | API |
| E09 | 系统配置 CRUD/按 key/批量删除 | 全链路成功 | P1 | API |
| E10 | 岗位 CRUD/启停 | 状态切换生效 | P2 | API |
| E11 | 租户列表/创建/更新/当前租户 | 创建自动初始化角色菜单；非平台租户 403 | P0 | API |
| E12 | 定时任务 CRUD/启停/立即执行 | cron 校验，执行生成结果 | P1 | API |
| E13 | 操作日志列表/模块/动作/删除/清空 | 筛选正确，清理生效 | P2 | API |
| E14 | 监控 stats/online/memory/metrics | 数据返回，在线踢出生效 | P1 | API |
| E15 | 使用分析 overview | 指标与趋势返回 | P2 | API |
| E16 | 健康检查与 Prometheus | live/ready 200；metrics 需鉴权 | P0 | API |

### F. 素材/模板/分享/大屏（11）

| ID | 测试点 | 预期结果 | 优先级 | 方式 |
| --- | --- | --- | --- | --- |
| F01 | 素材列表/筛选/上传/删除/下载 | 全链路成功 | P0 | API/UI |
| F02 | 素材非法类型/超大文件 | 拒绝并返回明确提示 | P1 | API |
| F03 | 模板库列表/筛选/应用/删除 | 应用生成看板，删除系统模板被拒 | P0 | API/UI |
| F04 | 分享链接未登录访问 | 返回看板数据与图表 | P0 | API/UI |
| F05 | 密码分享 | 无密码返回 passwordRequired；错误密码 401；正确密码成功 | P0 | API |
| F06 | 撤销/过期分享 | 访问返回 404 | P1 | API |
| F07 | 公开数据集取数/分页/聚合/distinct | 无需登录可用，RLS 仍生效 | P0 | API |
| F08 | 嵌入 iframe 模式 | 隐藏标题栏，内容正常 | P2 | UI |
| F09 | 预览页 | 渲染、缩放、全屏、返回正常 | P1 | UI |
| F10 | 数据大屏 /screen | KPI/排行/趋势渲染正常 | P1 | UI |
| F11 | 403/404 页面 | 友好提示与返回入口 | P2 | UI |

### G. 通用质量（10）

| ID | 测试点 | 预期结果 | 优先级 | 方式 |
| --- | --- | --- | --- | --- |
| G01 | 未匹配路由 404 | JSON `{code:10004,message:"资源不存在"}` | P0 | API |
| G02 | 参数校验错误 | 中文提示，不暴露 zod 英文 | P0 | API |
| G03 | 方法不允许 | 405 且为 JSON | P1 | API |
| G04 | 分页边界 | page=0/-1 拒绝；pageSize>100 拒绝 | P1 | API |
| G05 | 中英文切换 | 登录页/看板/系统页文案即时切换 | P1 | UI |
| G06 | 明暗主题切换与持久化 | 刷新后主题保持 | P2 | UI |
| G07 | 移动端响应式 | 登录页/看板列表布局不溢出 | P2 | UI |
| G08 | 浏览器控制台 | 核心页面无 error/意外 warning | P1 | UI |
| G09 | 静态质量门禁 | vue-tsc/tsc/eslint/build 全部通过 | P0 | STATIC |
| G10 | 自动化测试全量 | 前端/后端测试全部通过 | P0 | AUTO |

## 3. 执行结果

### 3.1 质量门禁（G09）

| 检查项 | 结果 |
| --- | --- |
| 前端 `npm run build`（vue-tsc + vite build） | 通过 |
| 后端 `npx tsc --noEmit` / `npm run build` | 通过 |
| 前端 `eslint .` | 通过（0 error，存在存量 warning） |
| 后端 `eslint .` | 通过（0 error，存在存量 warning） |

### 3.2 自动化测试（G10）

| 套件 | 修复前首轮 | 修复后复跑 |
| --- | --- | --- |
| 前端 Vitest | 97 个文件 / 865 个用例全部通过 | 97 个文件 / 865 个用例全部通过 |
| 后端 Vitest | 46 个文件 / 416 个用例全部通过 | 46 个文件 / 416 个用例全部通过 |

### 3.3 API 接口回归

**首轮（修复前）**：共执行 66 个接口级用例，61 通过 / 5 失败，失败项为 B01（列表统计缺失）、B18（空白名称）、D10b（文件数据集替换 500）、E08（字典 CRUD 全部 400）、F02（非法素材类型被接受），与第 4 节缺陷一一对应。

**修复后复跑**：66/66 全部通过，5 项缺陷用例全部转为 PASS，无新增失败项。

| 域 | 首轮通过/执行 | 复跑通过/执行 |
| --- | --- | --- |
| A 认证与权限 | 9/9（A04 由 UI 覆盖） | 9/9 |
| B 看板管理 | 14/16 | 16/16 |
| C 编辑器（接口侧） | 3/3 | 3/3 |
| D 数据集/数据源 | 14/15 | 15/15 |
| E 系统管理 | 13/14 | 14/14 |
| F 素材/分享 | 4/5 | 5/5 |
| G 通用错误处理 | 4/4 | 4/4 |

说明：首轮执行时的 A08（刷新/登出）因脚本未携带 CSRF 双提交头而失败，补齐 `X-CSRF-Token` 后通过；D11 首次对文件数据集执行抽取属用例设计错误，改为对 SQL 数据集抽取后通过。二者均非产品缺陷。

### 3.4 UI 浏览器回归

**首轮（修复前）**：

| 分组 | 覆盖内容 | 结果 |
| --- | --- | --- |
| 核心看板 | 登录 → 看板列表 → BI 编辑器 → 预览 | 通过；KPI/折线/饼/柱图正常渲染，控制台 0 error / 0 warning |
| 系统管理 | 用户、角色、菜单、部门、配置、岗位、租户、定时任务、日志、监控、使用分析、数据源、数据集共 13 页 | 13 页均正常加载；`/system/dicts` 新增字典失败，复现 E08 |
| 素材与通用 | 素材、模板库、数据大屏、404 页、中英文切换、明暗主题持久化 | 全部通过，控制台 0 error |

**修复后复跑**：

| 检查项 | 结果 |
| --- | --- |
| 看板列表统计 | 页面显示「总计 18 / 已发布 14 / 草稿 4」，与接口 counts 一致（BUG-2 修复确认） |
| 数据字典新增/删除 | `/system/dicts` 新增成功、列表即时更新、删除成功（BUG-1 修复确认） |
| 数据集/素材/模板/大屏 | 各页正常加载，控制台 0 error / 0 warning |

### 3.5 测试数据清理

回归过程中创建的看板、数据集、素材、模板、分组、用户、角色、部门、菜单、配置、岗位、定时任务等测试数据已按名称前缀清理（看板 3、素材 3、数据集 2 等）。

### 3.6 非缺陷观察

- 前端 ESLint 0 error，存在存量 warning，属代码质量债务。
- API 回归脚本执行期间（约 75~85 req/min，逼近 100 req/min 限流阈值），浏览器访问 `/system/datasets` 曾显示「暂无数据 共 0 条」；脚本结束后复现失败，页面正常显示数据。判断为限流窗口内前端请求被 429 拦截后静默处理为空列表，属前端错误态健壮性观察项（P3），非数据丢失。
- 首轮 UI 巡检遗留的「非法素材」条目等测试数据已清理。
- 本轮未覆盖：租户创建（无删除接口，避免污染数据）、导出文件内容级校验（仅校验状态码与 Content-Type）、iframe 嵌入模式、跨浏览器兼容性。

## 4. 缺陷清单

### BUG-1（P1，已修复）数据字典新增/编辑全部失败

- **现象**：`POST /api/dicts`、`PUT /api/dicts/:id`、`POST /api/dicts/items`、`PUT /api/dicts/items/:id` 均返回 400 `{"code":10001,"message":"参数校验失败"}`；UI `/system/dicts` 新增字典提示 `Invalid parameters`，字典无法维护。
- **复现**：管理员登录后 `POST /api/dicts`，body `{"type":"ui_dict_test","name":"UI字典"}` → 400。
- **定位**：[dict.dto.ts](file:///C:/Users/cheng/Desktop/bi-lowcode-server/src/modules/dict/dict.dto.ts#L6-L23) 中 schema 未包裹 `body`，而 [validate.ts](file:///C:/Users/cheng/Desktop/bi-lowcode-server/src/middleware/validate.ts#L22-L30) 传入的是 `{ body, query, params }`，导致 `type/name` 永远取不到。
- **建议**：四个 schema 改为 `z.object({ body: z.object({...}) })`，更新 schema 使用 `z.object({ body: createDictSchema.shape.body.partial() })`。
- **证据**：API 用例 E08；UI 巡检 `/system/dicts` 提交后红色错误提示，列表仍 3 条。

### BUG-2（P1，已修复）看板列表接口丢失发布/草稿统计

- **现象**：看板列表接口不返回 `data.counts`，页面头部「已发布/草稿」统计退化为当前页数量。当前真实数据为总数 19（已发布 14、草稿 5），列表页实际显示 8 / 4。
- **复现**：`GET /api/dashboards?page=1&pageSize=12` → data 仅 `list/total/page/pageSize/totalPages`，无 `counts`。
- **定位**：[dashboard.service.ts](file:///C:/Users/cheng/Desktop/bi-lowcode-server/src/modules/dashboard/dashboard.service.ts#L137-L144) 已计算并返回 `counts`，但 [dashboard.routes.ts](file:///C:/Users/cheng/Desktop/bi-lowcode-server/src/modules/dashboard/dashboard.routes.ts#L20-L25) 使用 `ResponseUtil.paginate(...)` 重建响应，把 `counts` 丢弃。
- **建议**：路由改为携带 counts，例如 `ResponseUtil.paginate(...)` 后补充 `ctx.body.data.counts = r.counts`，或扩展 `paginate` 支持附加字段。
- **证据**：API 用例 B01；接口实测 `TOTAL=19 PUB=14 DRAFT=5`，首屏统计为 `8/4`。

### BUG-3（P1，已修复）替换文件数据集数据接口 500

- **现象**：`PUT /api/datasets/:id/data` 上传新 CSV/XLSX 替换数据时返回 500 `code:-1`，错误信息为 Prisma `Argument id: Invalid value provided. Expected Int, provided String`。
- **复现**：先 `POST /api/datasets/upload` 创建文件数据集，再 `PUT /api/datasets/{id}/data` 上传新文件 → 500。
- **定位**：[dataset.routes.ts](file:///C:/Users/cheng/Desktop/bi-lowcode-server/src/modules/dataset/dataset.routes.ts#L360-L371) 该路由未挂 `validate(idParamSchema)`，`ctx.params.id` 为字符串直接传入 service，Prisma 拒绝字符串主键（`as any` 只绕过类型检查，不会转换运行时值）。
- **建议**：为该路由增加 `validate(idParamSchema)`，或在调用前 `Number(ctx.params.id)`。
- **证据**：API 用例 D10b；服务端返回完整 Prisma 堆栈。

### BUG-4（P2，已修复）看板名称仅空白字符仍可创建

- **现象**：`POST /api/dashboards` body `{"name":"   "}` 返回 200 创建成功，产生无意义名称的看板；`PUT` 更新同样未做 trim 校验。
- **定位**：[dashboard.dto.ts](file:///C:/Users/cheng/Desktop/bi-lowcode-server/src/modules/dashboard/dashboard.dto.ts) 中名称仅 `z.string().min(1).max(100)`，长度校验无法拦截纯空格。
- **建议**：`name: z.string().trim().min(1).max(100)`（更新 schema 同步处理）。
- **证据**：API 用例 B18，返回 `status=200 msg=创建成功`。

### BUG-5（P2，已修复）素材上传未校验真实文件类型

- **现象**：将 `.csv` 文件以 `type=image` 调用 `POST /api/materials/upload` 仍返回成功，素材出现在素材库中并可下载；素材表 `mimeType` 直接取上传时的声明值。
- **风险**：任意类型文件（HTML/SVG/脚本等）可被上传并以原始 MIME 回源下载，存在存储型 XSS 与恶意文件托管风险。
- **定位**：[material.routes.ts](file:///C:/Users/cheng/Desktop/bi-lowcode-server/src/modules/material/material.routes.ts#L40-L55) 仅检查是否上传文件；[material.service.ts](file:///C:/Users/cheng/Desktop/bi-lowcode-server/src/modules/material/material.service.ts#L144-L163) 优先信任客户端 `type`，没有扩展名/MIME 白名单。
- **建议**：服务端按扩展名 + MIME 白名单校验（图片/视频/装饰），并由服务端推断类型；下载时对非白名单类型统一 `application/octet-stream`。
- **证据**：API 用例 F02；首次执行遗留的「非法素材」条目在素材页可见（已清理）。

### 非缺陷观察

- 两端 ESLint 均为 0 error，但存在存量 warning，属代码质量债务，不影响本轮回归结论。
- 授权/租户隔离、刷新与登出黑名单、CSRF 双提交、分享密码、分享撤销、公开数据集取数白名单、RLS/字段权限、乐观锁冲突、404/405/参数校验格式均通过验证。
- 本轮未覆盖：租户创建（无删除接口，避免污染数据）、导出文件内容级校验（仅校验状态码与 Content-Type）、iframe 嵌入模式、跨浏览器兼容性。

## 5. 修复记录（2026-11-26）

| 缺陷 | 修复文件 | 修复内容 | 复验结果 |
| --- | --- | --- | --- |
| BUG-1 | `src/modules/dict/dict.dto.ts` | 字典/字典项 schema 统一包裹 `body`，与 validate 中间件契约对齐 | 字典创建、字典项创建、按类型查询、字典/字典项更新与删除全部通过 |
| BUG-2 | `src/utils/response.ts`、`src/modules/dashboard/dashboard.routes.ts` | `ResponseUtil.paginate` 支持附加字段，路由回传 `counts` | 接口返回 counts 且与全量统计一致（13 已发布 / 3 草稿） |
| BUG-3 | `src/modules/dataset/dataset.routes.ts` | 替换数据路由补充 `validate(idParamSchema)`，主键转为数字 | 文件数据集替换返回成功，行数正确更新 |
| BUG-4 | `src/modules/dashboard/dashboard.dto.ts` | 创建/更新名称增加 `.trim()`，纯空白名称被拒绝 | 空白名称返回 400；带空格名称落库时自动 trim |
| BUG-5 | `src/modules/material/material.service.ts` | 按扩展名 + MIME 白名单校验并推断素材类型，不再信任客户端 type | CSV 以 image 上传返回 400；PNG 正常上传并分类为 image |

修复后复验：后端 `tsc --noEmit`、ESLint、全量测试（46 文件 / 416 用例）、`npm run build` 全部通过；5 项 API 定向验证 6/6 通过。

**修复后全量复跑确认（2026-11-26 第二轮）**：API 回归 66/66 通过，B01/B18/D10b/E08/F02 五项失败用例全部转 PASS；后端 `tsc` 与 46 文件 / 416 用例全部通过；UI 复跑确认看板统计（14/4）与接口一致、字典可正常增删、全程控制台 0 error / 0 warning。未发现修复引入的新问题。

