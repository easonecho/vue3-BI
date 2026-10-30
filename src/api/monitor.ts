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

/** 运行指标摘要 (后端内存指标快照, 进程重启后清零) */
export interface MetricsSnapshot {
  http: {
    total: number;
    serverErrors: number;
    avgDurationMs: number;
    statuses: Array<{ status: string; count: number }>;
    topRoutes: Array<{ route: string; count: number; avgDurationMs: number }>;
  };
  loginFailures: Array<{ code: string; count: number }>;
  exportFailures: Array<{ type: string; format: string; count: number }>;
  schedulerFailures: Array<{ job: string; count: number }>;
  onlineUsers: number;
  uptimeSeconds: number;
  memoryMb: { rss: number; heapUsed: number; heapTotal: number };
}

export const getSystemStats = () =>
  request.get<SystemStats>('/api/monitor/stats');

export const getOnlineUsers = () =>
  request.get<OnlineUser[]>('/api/monitor/online');

export const getProcessMemory = () =>
  request.get<ProcessMemory>('/api/monitor/memory');

export const getRuntimeMetrics = () =>
  request.get<MetricsSnapshot>('/api/monitor/metrics');

export const forceLogout = (userId: number) =>
  request.delete<{ kicked: boolean }>(`/api/monitor/online/${userId}`);
