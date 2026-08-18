import request from '@/utils/request'

/** 菜单树节点 */
export interface MenuTreeNode {
  id: number
  name: string
  parentId: number
  orderNum: number
  path?: string | null
  component?: string | null
  query?: string | null
  isFrame: boolean
  isCache: boolean
  menuType: 'M' | 'C' | 'F'
  visible: boolean
  status: number
  perms?: string | null
  icon: string
  children?: MenuTreeNode[]
}

/** 当前用户菜单树 */
export function getMyMenuTree() {
  return request.get('/api/menus/me/tree')
}

/** 当前用户权限码 */
export function getMyPerms() {
  return request.get('/api/menus/me/perms')
}

/** 菜单列表 (管理端) */
export function getMenuList(params?: { keyword?: string; status?: number }) {
  return request.get('/api/menus', { params })
}

/** 菜单树选择 (父菜单下拉 + 角色分配) */
export function getMenuTreeSelect(excludeId?: number) {
  return request.get('/api/menus/tree/select', { params: { excludeId } })
}

/** 菜单详情 */
export function getMenuById(id: number) {
  return request.get(`/api/menus/${id}`)
}

/** 新增菜单 */
export function createMenu(data: Record<string, any>) {
  return request.post('/api/menus', data)
}

/** 修改菜单 */
export function updateMenu(id: number, data: Record<string, any>) {
  return request.put(`/api/menus/${id}`, data)
}

/** 删除菜单 */
export function deleteMenu(id: number) {
  return request.delete(`/api/menus/${id}`)
}

/** 查询角色已分配菜单ID列表 */
export function getRoleMenuIds(roleId: number) {
  return request.get(`/api/roles/${roleId}/menus`)
}

/** 分配角色菜单 */
export function assignRoleMenus(roleId: number, menuIds: number[]) {
  return request.put(`/api/roles/${roleId}/menus`, { menuIds })
}
