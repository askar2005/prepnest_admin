import { apiClient } from './client';

export async function fetchCollection(path: string, query: Record<string, string | number | undefined> = {}) {
  const { data } = await apiClient.get(path, { params: query });
  return data as { items: any[]; page: number; limit: number; total: number };
}
