import { StateCreator } from 'zustand';
import { type Task, type Comment } from '@/db/schema';

interface TaskWithAssignee extends Omit<Task, 'assigneeId'> {
  assigneeId: string | null;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

interface TaskCreate {
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  projectId: string;
  assigneeId?: string;
}

interface TaskUpdate {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
}

interface CommentWithAuthor {
  id: string;
  content: string;
  taskId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
}

interface TaskFilters {
  status?: string;
  priority?: string;
  assigneeId?: string;
}

interface TaskWithDetails {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  projectId: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  dueDate: Date | null;
  workspaceId: string;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
}

export interface TaskState {
  tasks: TaskWithAssignee[];
  currentTask: TaskWithDetails | null;
  comments: CommentWithAuthor[];
  filters: TaskFilters;
  isLoading: boolean;
  isCurrentTaskLoading: boolean;
  isCommentsLoading: boolean;
  error: string | null;
  currentTaskError: string | null;
  commentsError: string | null;
  fetchTasks: (projectId: string) => Promise<void>;
  fetchTaskById: (taskId: string) => Promise<void>;
  fetchComments: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  createTask: (data: TaskCreate) => Promise<Task>;
  updateTask: (taskId: string, data: TaskUpdate) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  setCurrentTask: (task: TaskWithDetails | null) => void;
  setError: (error: string | null) => void;
}

export const createTaskSlice: StateCreator<TaskState> = (set, get) => ({
  tasks: [],
  currentTask: null,
  comments: [],
  filters: {},
  isLoading: false,
  isCurrentTaskLoading: false,
  isCommentsLoading: false,
  error: null,
  currentTaskError: null,
  commentsError: null,

  fetchTasks: async (projectId) => {
    try {
      set({ isLoading: true, error: null });
      const state = get();
      const { filters } = state;
      
      // Build query parameters
      const params = new URLSearchParams({ projectId });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
      
      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const tasks = await response.json();
      set({ tasks, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error fetching tasks:', error);
    }
  },

  createTask: async (data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const newTask = await response.json();
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false,
      }));
      return newTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error creating task:', error);
      throw error;
    }
  },

  updateTask: async (taskId, data) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? updatedTask : task
        ),
        isLoading: false,
      }));
      return updatedTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      set({ isLoading: true, error: null });
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ error: errorMessage, isLoading: false });
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  fetchTaskById: async (taskId) => {
    try {
      set({ isCurrentTaskLoading: true, currentTaskError: null });
      const response = await fetch(`/api/tasks/${taskId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch task details');
      }
      const task = await response.json();
      set({ currentTask: task, isCurrentTaskLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ currentTaskError: errorMessage, isCurrentTaskLoading: false });
      console.error('Error fetching task by ID:', error);
    }
  },

  setCurrentTask: (task) => {
    set({ currentTask: task });
  },

  fetchComments: async (taskId) => {
    try {
      set({ isCommentsLoading: true, commentsError: null });
      const response = await fetch(`/api/tasks/${taskId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const comments = await response.json();
      set({ comments, isCommentsLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ commentsError: errorMessage, isCommentsLoading: false });
      console.error('Error fetching comments:', error);
    }
  },

  addComment: async (taskId, content) => {
    try {
      set({ isCommentsLoading: true, commentsError: null });
      const response = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        throw new Error('Failed to add comment');
      }

      const newComment = await response.json();
      set((state) => ({
        comments: [newComment, ...state.comments],
        isCommentsLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      set({ commentsError: errorMessage, isCommentsLoading: false });
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  setFilters: (filters) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  setError: (error) => {
    set({ error });
  },
});