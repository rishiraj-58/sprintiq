import { useStore } from '../index';

export const useAuth = () => {
  const profile = useStore((state) => state.profile);
  const isLoading = useStore((state) => state.isLoading);
  const setProfile = useStore((state) => state.setProfile);
  const setLoading = useStore((state) => state.setLoading);

  return {
    profile,
    isLoading,
    setProfile,
    setLoading,
  };
}; 