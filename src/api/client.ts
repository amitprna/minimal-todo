import { fetchAuthSession } from 'aws-amplify/auth';
import { API_BASE } from '../aws-config';

async function getToken(): Promise<string> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) throw new Error('Not authenticated');
  return token;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return undefined as unknown as T;
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ── Categories ───────────────────────────────────────────────────────────────
export const api = {
  categories: {
    list: () => request<Category[]>('GET', '/categories'),
    create: (cat: Category) => request<Category>('POST', '/categories', cat),
    update: (id: string, cat: Partial<Category>) => request<Category>('PUT', `/categories/${id}`, cat),
    delete: (id: string) => request<void>('DELETE', `/categories/${id}`),
  },
  tasks: {
    list: () => request<Task[]>('GET', '/tasks'),
    create: (task: Task) => request<Task>('POST', '/tasks', task),
    update: (id: string, task: Task) => request<Task>('PUT', `/tasks/${id}`, task),
    delete: (id: string) => request<void>('DELETE', `/tasks/${id}`),
  },
  notes: {
    get: (categoryId: string) => request<{ categoryId: string; content: string }>('GET', `/notes/${categoryId}`),
    save: (categoryId: string, content: string) =>
      request<{ categoryId: string; content: string }>('PUT', `/notes/${categoryId}`, { content }),
  },
};

// ── Types (mirrors what's stored in DynamoDB) ─────────────────────────────────
export interface Category {
  id: string;
  name: string;
  color: string;
  order: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  categoryId: string;
  title: string;
  completed: boolean;
  pinned: boolean;
  subtasks: Subtask[];
  order: number;
}
