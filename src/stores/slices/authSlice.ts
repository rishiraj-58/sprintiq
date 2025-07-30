import { StateCreator } from 'zustand';
import { Profile } from '@/db/schema';

export interface AuthState {
  profile: Profile | null;
  isLoading: boolean;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthState> = (set) => ({
  profile: null,
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
}); 