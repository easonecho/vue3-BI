/**
 * 公开分享 / 嵌入页上下文
 *
 * 分享页与嵌入页无需登录, 图表取数不能走需要鉴权的 /api/datasets/:id/execute,
 * 而是走 /api/public/dashboards/:token/datasets/:id/execute。
 * useDatasetBinding 通过 getPublicDashboardContext() 判断当前是否处于公开访问场景。
 */
export interface PublicDashboardContext {
  token: string
  /** 看板访问密码 (无密码看板为 undefined) */
  password?: string
}

let current: PublicDashboardContext | null = null

export function setPublicDashboardContext(ctx: PublicDashboardContext): void {
  current = ctx
}

export function getPublicDashboardContext(): PublicDashboardContext | null {
  return current
}

export function clearPublicDashboardContext(): void {
  current = null
}
