import { create } from 'zustand';
import { createAuthSlice, type AuthState } from './slices/authSlice';
import { createWorkspaceSlice, type WorkspaceState } from './slices/workspaceSlice';
import { createProjectSlice, type ProjectState } from './slices/projectSlice';
import { createUISlice, type UIState } from './slices/uiSlice';

export type StoreState = AuthState & WorkspaceState & ProjectState & UIState;

export const useStore = create<StoreState>()((...args) => ({
  ...createAuthSlice(...args),
  ...createWorkspaceSlice(...args),
  ...createProjectSlice(...args),
  ...createUISlice(...args),
})); 