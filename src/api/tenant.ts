/**
 * 租户管理模块 API
 */
import { get, post, put } from '@/utils/request'
import type { PageQuery } from './types'
import type { PaginateData } from '@/utils/request'

export interface Tenant {
  id: number
  code: string
  name: string
  status: number
  contact: string | null
  expiredAt: string | null
  maxUsers: number | null
  remark: string | null
  createdAt: string
  updatedAt: string
}

export interface TenantQuery extends PageQuery {
  keyword?: string
  status?: number
}

export interface CreateTenantPayload {
  code: string
  name: string
  contact?: string
  expiredAt?: string | null
  maxUsers?: number | null
  remark?: string
}

export interface UpdateTenantPayload extends Partial<Omit<CreateTenantPayload, 'code'>> {
  status?: number
}

/** 租户分页列表（仅平台租户管理员） */
export function getTenantList(params: TenantQuery) {
  return get<PaginateData<Tenant>>('/api/tenants', params as Record<string, unknown>)
}

/** 创建租户（自动初始化内置角色与菜单） */
export function createTenant(data: CreateTenantPayload) {
  return post<Tenant>('/api/tenants', data)
}

/** 更新租户资料/状态 */
export function updateTenant(id: number, data: UpdateTenantPayload) {
  return put<Tenant>(`/api/tenants/${id}`, data)
}

/** 当前登录租户信息 */
export function getCurrentTenant() {
  return get<Pick<Tenant, 'id' | 'code' | 'name' | 'status' | 'expiredAt'>>('/api/tenants/current')
}
