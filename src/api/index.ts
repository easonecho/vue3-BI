/**
 * API 统一出口 - 按模块导出
 *
 * 使用方式:
 *   import { login, getDashboardList } from '@/api'
 */
export * as authApi from './auth'
export * as userApi from './user.service'
export * as datasourceApi from './datasource'
export * as datasetApi from './dataset'
export * as dashboardApi from './dashboard'
export * as chartApi from './chart'
export * as exportApi from './export'

// 同时保留命名导出便于按需引入
export * from './auth'
export * from './user.service'
export * from './datasource'
export * from './dataset'
export * from './dashboard'
export * from './chart'
export * from './export'