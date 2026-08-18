/**
 * 岗位管理 API (P2-4)
 */
import request from '@/utils/request';

export interface Position {
  id: number;
  name: string;
  code: string;
  sort: number;
  status: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PositionForm {
  name: string;
  code: string;
  sort?: number;
  status?: number;
  description?: string;
}

export const getPositionList = (params?: { keyword?: string; status?: number }) =>
  request.get<Position[]>('/api/positions', { params });

export const getPositionById = (id: number) =>
  request.get<Position>(`/api/positions/${id}`);

export const createPosition = (data: PositionForm) =>
  request.post<Position>('/api/positions', data);

export const updatePosition = (id: number, data: Partial<PositionForm>) =>
  request.put<Position>(`/api/positions/${id}`, data);

export const deletePosition = (id: number) =>
  request.delete(`/api/positions/${id}`);

export const togglePositionStatus = (id: number) =>
  request.put<Position>(`/api/positions/${id}/toggle-status`);
