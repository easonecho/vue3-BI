/**
 * 系统监控 API (P2-4)
 */
import request from '@/utils/request';

export interface SystemStats {
  users: number;
  roles: number;
  dashboards: number;
  datasets: number;
  datasources: number;
  charts: number;
  onlineUsers: number;
  positions: number;
  scheduledTasks: number;
  systemConfigs: number;
}

export interface OnlineUser {
  userId: number;
  username: string;
  nickname?: string;
  roleId: number;
  loginAt: string;
  lastActiveAt: string;
  ip: string;
}

export interface ProcessMemory {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
  uptime: number;
}

export const getSystemStats = () =>
  request.get<SystemStats>('/api/monitor/stats');

export const getOnlineUsers = () =>
  request.get<OnlineUser[]>('/api/monitor/online');

export const getProcessMemory = () =>
  request.get<ProcessMemory>('/api/monitor/memory');

export const forceLogout = (userId: number) =>
  request.delete<{ kicked: boolean }>(`/api/monitor/online/${userId}`);
