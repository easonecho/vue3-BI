/**
 * 操作日志 API
 */
import request from '@/utils/request';

export interface OperationLogItem {
  id: number;
  userId: number | null;
  username: string | null;
  module: string;
  action: string;
  method: string;
  path: string;
  params: unknown;
  ip: string | null;
  userAgent: string | null;
  status: number;
  duration: number | null;
  errorMsg: string | null;
  createdAt: string;
}

export interface LogListQuery {
  page?: number;
  pageSize?: number;
  module?: string;
  action?: string;
  username?: string;
  status?: number;
  startTime?: string;
  endTime?: string;
}

export const getLogList = (params: LogListQuery) =>
  request.get<{ list: OperationLogItem[]; total: number }>('/api/operation-logs', { params });

export const getLogModules = () =>
  request.get<string[]>('/api/operation-logs/modules');

export const getLogActions = () =>
  request.get<string[]>('/api/operation-logs/actions');

export const deleteLog = (id: number) =>
  request.delete(`/api/operation-logs/${id}`);

export const batchDeleteLogs = (ids: number[]) =>
  request.delete<{ count: number }>('/api/operation-logs/batch/delete', { data: { ids } });

export const cleanAllLogs = () =>
  request.delete<{ count: number }>('/api/operation-logs/all/clean');
