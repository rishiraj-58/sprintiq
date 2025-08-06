import { create } from 'zustand';
import { createAuthSlice, type AuthState } from './slices/authSlice';
import { createWorkspaceSlice, type WorkspaceState } from './slices/workspaceSlice';
import { createProjectSlice, type ProjectState } from './slices/projectSlice';
import { createTaskSlice, type TaskState } from './slices/taskSlice';
import { createUISlice, type UIState } from './slices/uiSlice';

export type StoreState = AuthState & WorkspaceState & ProjectState & TaskState & UIState;

export const useStore = create<StoreState>()((...args) => ({
  ...createAuthSlice(...args),
  ...createWorkspaceSlice(...args),
  ...createProjectSlice(...args),
  ...createTaskSlice(...args),
  ...createUISlice(...args),
})); 