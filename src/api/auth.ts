/**
 * 认证模块 API
 */
import { post, get } from '@/utils/request'
import type { LoginResult, RefreshResult, User } from './types'

/** 登录请求参数 */
export interface LoginParams {
  username: string
  password: string
}

/** 注册请求参数 */
export interface RegisterParams {
  username: string
  password: string
  email?: string
  nickname?: string
}

/** 用户登录 */
export function login(data: LoginParams) {
  return post<LoginResult>('/api/auth/login', data)
}

/** 用户注册 */
export function register(data: RegisterParams) {
  return post<LoginResult>('/api/auth/register', data)
}

/** 获取当前登录用户信息 */
export function getProfile() {
  return get<User>('/api/auth/profile')
}

/** 刷新 token (refresh token 存于 HttpOnly Cookie, 自动随请求携带, 无需传参) */
export function refreshToken() {
  return post<RefreshResult>('/api/auth/refresh', {})
}

/** 登出 (服务端从 Cookie 读取 refresh token 并拉黑, 同时清除认证 Cookie) */
export function logout() {
  return post<void>('/api/auth/logout', {})
}
