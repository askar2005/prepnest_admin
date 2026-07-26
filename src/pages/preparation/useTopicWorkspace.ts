import { useCallback, useState } from 'react';
import { apiClient } from '../../api/client';

export interface TopicDashboardData {
  notes: number; pdfs: number; mcqs: number; videos: number; pyqs: number; mockTests: number;
  totalAttempts: number; averageScore: number; highestScore: number;
  totalDownloads: number; studentsViewed: number; bookmarks: number; completionRate: number;
  recentUploads: { title: string; createdAt: string; type: string }[];
  recentMcqs: { question: string; createdAt: string }[];
  recentVideos: { title: string; createdAt: string }[];
}

export interface TopicDetail {
  id: string; name: string; slug: string; description: string | null; createdAt: string;
  _count: { studyMaterials: number; mcqQuestions: number; videos: number };
}

export interface NoteItem { id: string; title: string; pdfUrl: string | null; isPublished: boolean; createdAt: string; }
export interface McqItem { id: string; question: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; explanation: string | null; difficulty: string | null; isPublished: boolean; createdAt: string; }
export interface VideoItem { id: string; title: string; youtubeUrl: string; thumbnail: string | null; duration: number | null; description: string | null; tags: string | null; createdAt: string; }
export interface PyqItem { id: string; year: number; title: string; pdfUrl: string | null; description: string | null; }
export interface MockTestItem { id: string; title: string; description: string; durationMinutes: number; negativeMarking: number; publishStatus: string; createdAt: string; _count: { questions: number; results: number }; }
export interface ResourceItem { id: string; title: string; type: string; content: string | null; externalUrl: string | null; createdAt: string; }
export interface TopicAnalyticsData { totalAttempts: number; averageScore: number; highestScore: number; popularNotes: { title: string; createdAt: string; type: string }[]; popularVideos: { title: string; createdAt: string; views: number }[]; }

export function useTopicWorkspace(category: string, topicId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = `/preparation/${category}/topics/${topicId}`;

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
    getTopic: () => fetch<TopicDetail>(base),
    updateTopic: (body: any) => mutate('put', base, body),
    deleteTopic: () => mutate('delete', base),
    getDashboard: () => fetch<TopicDashboardData>(`${base}/dashboard`),
    getNotes: () => fetch<{ items: NoteItem[]; total: number }>(`${base}/notes`),
    createNote: (body: any) => mutate('post', `${base}/notes`, body),
    updateNote: (id: string, body: any) => mutate('put', `${base}/notes/${id}`, body),
    deleteNote: (id: string) => mutate('delete', `${base}/notes/${id}`),
    getMcqs: () => fetch<{ items: McqItem[]; total: number }>(`${base}/mcqs`),
    createMcq: (body: any) => mutate('post', `${base}/mcqs`, body),
    updateMcq: (id: string, body: any) => mutate('put', `${base}/mcqs/${id}`, body),
    deleteMcq: (id: string) => mutate('delete', `${base}/mcqs/${id}`),
    bulkCreateMcqs: (body: { questions: any[] }) => mutate('post', `${base}/mcqs/bulk`, body),
    bulkDeleteMcqs: (ids: string[]) => mutate('post', `${base}/mcqs/bulk-delete`, { ids }),
    getVideos: () => fetch<{ items: VideoItem[]; total: number }>(`${base}/videos`),
    createVideo: (body: any) => mutate('post', `${base}/videos`, body),
    deleteVideo: (id: string) => mutate('delete', `${base}/videos/${id}`),
    getPyqs: () => fetch<{ items: PyqItem[]; total: number }>(`${base}/pyqs`),
    createPyq: (body: any) => mutate('post', `${base}/pyqs`, body),
    deletePyq: (id: string) => mutate('delete', `${base}/pyqs/${id}`),
    getMockTests: () => fetch<{ items: MockTestItem[]; total: number }>(`${base}/mock-tests`),
    createMockTest: (body: any) => mutate('post', `${base}/mock-tests`, body),
    updateMockTest: (id: string, body: any) => mutate('put', `${base}/mock-tests/${id}`, body),
    deleteMockTest: (id: string) => mutate('delete', `${base}/mock-tests/${id}`),
    createMockTestWithQuestions: (body: any) => mutate('post', `${base}/mock-tests/with-questions`, body),
    getResources: () => fetch<{ items: ResourceItem[]; total: number }>(`${base}/resources`),
    getAnalytics: () => fetch<TopicAnalyticsData>(`${base}/analytics`),
    // Note APIs (new model)
    getNewNotes: async () => {
      const { items } = await fetch<{ items: NoteItem[]; total: number }>(`/topics/${topicId}/notes`);
      return items;
    },
    createNewNote: (body: { title: string; pdfUrl?: string | null; isPublished?: boolean }) => mutate<NoteItem>('post', `/topics/${topicId}/notes`, body),
    updateNewNote: (id: string, body: { title?: string; pdfUrl?: string | null; isPublished?: boolean }) => mutate<NoteItem>('put', `/notes/${id}`, body),
    deleteNewNote: (id: string) => mutate('delete', `/notes/${id}`),
  };
}
