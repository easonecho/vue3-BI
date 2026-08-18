/**
 * 定时任务 API (P2-4)
 */
import request from '@/utils/request';

export interface ScheduledTask {
  id: number;
  name: string;
  cron: string;
  handler: string;
  params: Record<string, unknown> | null;
  status: number;
  description: string | null;
  lastRunAt: string | null;
  lastResult: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledTaskForm {
  name: string;
  cron: string;
  handler: string;
  params?: Record<string, unknown>;
  status?: number;
  description?: string;
}

export const getScheduledTaskList = (params?: { keyword?: string; status?: number }) =>
  request.get<ScheduledTask[]>('/api/scheduled-tasks', { params });

export const getScheduledTaskById = (id: number) =>
  request.get<ScheduledTask>(`/api/scheduled-tasks/${id}`);

export const createScheduledTask = (data: ScheduledTaskForm) =>
  request.post<ScheduledTask>('/api/scheduled-tasks', data);

export const updateScheduledTask = (id: number, data: Partial<ScheduledTaskForm>) =>
  request.put<ScheduledTask>(`/api/scheduled-tasks/${id}`, data);

export const deleteScheduledTask = (id: number) =>
  request.delete(`/api/scheduled-tasks/${id}`);

export const toggleScheduledTaskStatus = (id: number) =>
  request.put<ScheduledTask>(`/api/scheduled-tasks/${id}/toggle-status`);

export const runScheduledTask = (id: number) =>
  request.post<{ taskId: number; result: string; runAt: string }>(`/api/scheduled-tasks/${id}/run`);
