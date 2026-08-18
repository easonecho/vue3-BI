/**
 * 系统配置 API (P2-4)
 */
import request from '@/utils/request';

export interface SystemConfig {
  id: number;
  configKey: string;
  configName: string;
  configValue: string | null;
  configType: 'string' | 'number' | 'boolean' | 'json';
  description: string | null;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface SystemConfigForm {
  configKey: string;
  configName: string;
  configValue?: string | null;
  configType?: SystemConfig['configType'];
  description?: string;
  sort?: number;
}

export const getSystemConfigList = (keyword?: string) =>
  request.get<SystemConfig[]>('/api/system-configs', { params: { keyword } });

export const getSystemConfigByKey = (configKey: string) =>
  request.get<SystemConfig>(`/api/system-configs/key/${configKey}`);

export const createSystemConfig = (data: SystemConfigForm) =>
  request.post<SystemConfig>('/api/system-configs', data);

export const updateSystemConfig = (id: number, data: Partial<SystemConfigForm>) =>
  request.put<SystemConfig>(`/api/system-configs/${id}`, data);

export const deleteSystemConfig = (id: number) =>
  request.delete(`/api/system-configs/${id}`);

export const batchDeleteSystemConfig = (ids: number[]) =>
  request.post('/api/system-configs/batch-delete', { ids });
