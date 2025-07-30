import { StateCreator } from 'zustand';

export interface UIState {
  isSidebarOpen: boolean;
  isCreateWorkspaceModalOpen: boolean;
  isCreateProjectModalOpen: boolean;
  toggleSidebar: () => void;
  setCreateWorkspaceModalOpen: (isOpen: boolean) => void;
  setCreateProjectModalOpen: (isOpen: boolean) => void;
}

export const createUISlice: StateCreator<UIState> = (set) => ({
  isSidebarOpen: true,
  isCreateWorkspaceModalOpen: false,
  isCreateProjectModalOpen: false,

  toggleSidebar: () => 
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  setCreateWorkspaceModalOpen: (isOpen) => 
    set({ isCreateWorkspaceModalOpen: isOpen }),

  setCreateProjectModalOpen: (isOpen) => 
    set({ isCreateProjectModalOpen: isOpen }),
}); 