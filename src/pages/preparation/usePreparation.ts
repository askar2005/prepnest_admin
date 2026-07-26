import { useCallback, useState } from 'react';
import { apiClient } from '../../api/client';

export interface DashboardData {
  topics: number; notes: number; pdfs: number; mcqs: number; videos: number; pyqs: number; mockTests: number;
  totalAttempts: number; averageScore: number; highestScore: number; lowestScore: number;
  recentUploads: { title: string; createdAt: string; type: string }[];
  topTopic: { name: string; _count: { studyMaterials: number; mcqQuestions: number } } | null;
}

export interface TopicItem { id: string; name: string; slug: string; description: string | null; createdAt: string; _count: { studyMaterials: number; mcqQuestions: number; videos: number }; }

export interface NoteItem { id: string; title: string; type: string; content: string | null; externalUrl: string | null; searchText: string | null; createdAt: string; topic: { name: string } | null; }

export interface McqItem { id: string; question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string | null; difficulty: string | null; createdAt: string; topic: { name: string } | null; }

export interface VideoItem { id: string; title: string; youtubeUrl: string; thumbnail: string | null; duration: number | null; createdAt: string; topic: { name: string } | null; }

export interface PyqItem { id: string; year: number; title: string; pdfUrl: string | null; }

export interface MockTestItem { id: string; title: string; description: string; durationMinutes: number; negativeMarking: number; publishStatus: string; createdAt: string; _count: { questions: number }; }

export interface AnalyticsData {
  totalAttempts: number; averageScore: number; highestScore: number; lowestScore: number; completionRate: number;
  topTopic: { name: string; _count: { studyMaterials: number; mcqQuestions: number } } | null;
  popularNotes: { title: string; createdAt: string; type: string }[];
  mostAttemptedTest: { title: string; _count: { results: number } } | null;
}

export interface CategorySettings {
  id: string; name: string; slug: string;
  coverImage: string | null;
}

export function usePreparation(category: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/preparation/${category}`;

  const fetch = useCallback(async <T>(path: string): Promise<T> => {
    setLoading(true); setError(null);
    try { const { data } = await apiClient.get(path); return data as T; }
    catch (err: any) { const msg = err?.response?.data?.message || err?.message || 'Request failed'; setError(msg); throw err; }
    finally { setLoading(false); }
  }, []);

  const mutate = useCallback(async <T>(method: 'post' | 'put' | 'delete', path: string, body?: any): Promise<T> => {
    setLoading(true); setError(null);
    try { const { data } = await (apiClient as any)[method](path, body ?? undefined); return data as T; }
    catch (err: any) { const msg = err?.response?.data?.message || err?.message || 'Request failed'; setError(msg); throw err; }
    finally { setLoading(false); }
  }, []);

  return {
    loading, error,
    getDashboard: () => fetch<DashboardData>(`${base}/dashboard`),
    getTopics: () => fetch<{ items: TopicItem[]; total: number }>(`${base}/topics`),
    createTopic: (body: any) => mutate('post', `${base}/topics`, body),
    updateTopic: (id: string, body: any) => mutate('put', `/preparation/topics/${id}`, body),
    deleteTopic: (id: string) => mutate('delete', `/preparation/topics/${id}`),
    getNotes: () => fetch<{ items: NoteItem[]; total: number }>(`${base}/notes`),
    createNote: (body: any) => mutate('post', `${base}/notes`, body),
    updateNote: (id: string, body: any) => mutate('put', `/preparation/notes/${id}`, body),
    deleteNote: (id: string) => mutate('delete', `/preparation/notes/${id}`),
    getMcqs: () => fetch<{ items: McqItem[]; total: number }>(`${base}/mcqs`),
    createMcq: (body: any) => mutate('post', `${base}/mcqs`, body),
    updateMcq: (id: string, body: any) => mutate('put', `/preparation/mcqs/${id}`, body),
    deleteMcq: (id: string) => mutate('delete', `/preparation/mcqs/${id}`),
    bulkCreateMcqs: (body: { questions: any[] }) => mutate('post', `${base}/mcqs/bulk`, body),
    getVideos: () => fetch<{ items: VideoItem[]; total: number }>(`${base}/videos`),
    createVideo: (body: any) => mutate('post', `${base}/videos`, body),
    deleteVideo: (id: string) => mutate('delete', `/preparation/videos/${id}`),
    getPyqs: () => fetch<{ items: PyqItem[]; total: number }>(`${base}/pyqs`),
    createPyq: (body: any) => mutate('post', `${base}/pyqs`, body),
    deletePyq: (id: string) => mutate('delete', `/preparation/pyqs/${id}`),
    getMockTests: () => fetch<{ items: MockTestItem[]; total: number }>(`${base}/mock-tests`),
    createMockTest: (body: any) => mutate('post', `${base}/mock-tests`, body),
    updateMockTest: (id: string, body: any) => mutate('put', `/preparation/mock-tests/${id}`, body),
    deleteMockTest: (id: string) => mutate('delete', `/preparation/mock-tests/${id}`),
    getAnalytics: () => fetch<AnalyticsData>(`${base}/analytics`),
    getSettings: () => fetch<CategorySettings>(`${base}/settings`),
    updateSettings: (body: any) => mutate('put', `${base}/settings`, body),
    uploadCategoryImage: async (file: File): Promise<CategorySettings> => {
      const form = new FormData();
      form.append('coverImage', file);
      const { data } = await apiClient.post(`${base}/image`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data as CategorySettings;
    },
    deleteCategoryImage: () => mutate<CategorySettings>('delete', `${base}/image`),
  };
}