/**
 * vue-router 路由元信息类型扩展（模块增强）
 * 让 router/index.ts 里的 meta.permissions 拥有类型提示
 *
 * 注意：文件需要是一个 module（含 export）才能触发 module augmentation，
 * 否则 `declare module 'vue-router'` 会覆盖 vue-router 自身的类型。
 */
export {}

declare module 'vue-router' {
  interface RouteMeta {
    /** 路由标题（页面标题） */
    title?: string
    /** 公开路由（无需登录） */
    public?: boolean
    /** 需要登录 */
    requiresAuth?: boolean
    /**
     * 路由级权限码列表（任一命中即放行）
     * - 留空表示不校验
     * - 命中规则见 stores/menu.ts 的 hasAnyPerms（含 '*' 通配）
     */
    permissions?: string[]
  }
}
