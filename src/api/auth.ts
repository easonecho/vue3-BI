/**
 * 认证模块 API
 */
import { post, get } from '@/utils/request'
import type { LoginResult, User } from './types'

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
  return post<User>('/api/auth/register', data)
}

/** 获取当前登录用户信息 */
export function getProfile() {
  return get<User>('/api/auth/profile')
}