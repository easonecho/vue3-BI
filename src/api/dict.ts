/**
 * 数据字典 API
 */
import request from '@/utils/request';

export interface Dict {
  id: number;
  type: string;
  name: string;
  description: string | null;
  status: number;
  createdAt: string;
  updatedAt: string;
  _count?: { items: number };
}

export interface DictItem {
  id: number;
  dictId: number;
  label: string;
  value: string;
  sort: number;
  status: number;
  createdAt: string;
}

export interface DictWithItems extends Dict {
  items: DictItem[];
}

export const getDictList = (keyword?: string) =>
  request.get<Dict[]>('/api/dicts', { params: { keyword } });

export const getDictByType = (type: string) =>
  request.get<DictWithItems>(`/api/dicts/${type}`);

export const createDict = (data: { type: string; name: string; description?: string; status?: number }) =>
  request.post<Dict>('/api/dicts', data);

export const updateDict = (id: number, data: Partial<{ type: string; name: string; description?: string; status: number }>) =>
  request.put<Dict>(`/api/dicts/${id}`, data);

export const deleteDict = (id: number) =>
  request.delete(`/api/dicts/${id}`);

export const getDictItems = (dictId: number) =>
  request.get<DictItem[]>(`/api/dicts/${dictId}/items`);

export const createDictItem = (data: { dictId: number; label: string; value: string; sort?: number; status?: number }) =>
  request.post<DictItem>('/api/dicts/items', data);

export const updateDictItem = (id: number, data: Partial<{ label: string; value: string; sort: number; status: number }>) =>
  request.put<DictItem>(`/api/dicts/items/${id}`, data);

export const deleteDictItem = (id: number) =>
  request.delete(`/api/dicts/items/${id}`);
