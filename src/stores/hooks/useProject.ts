import { useStore } from '../index';

export const useProject = () => {
  const projects = useStore((state) => state.projects);
  const currentProject = useStore((state) => state.currentProject);
  const isLoading = useStore((state) => state.isLoading);
  const error = useStore((state) => state.error);
  const fetchProjects = useStore((state) => state.fetchProjects);
  const createProject = useStore((state) => state.createProject);
  const updateProject = useStore((state) => state.updateProject);
  const deleteProject = useStore((state) => state.deleteProject);
  const setCurrentProject = useStore((state) => state.setCurrentProject);

  return {
    projects,
    currentProject,
    isLoading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
  };
}; 