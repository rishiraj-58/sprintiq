import { useStore } from '../index';

export const useTask = () => {
  const tasks = useStore((state) => state.tasks);
  const isLoading = useStore((state) => state.isLoading);
  const error = useStore((state) => state.error);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const createTask = useStore((state) => state.createTask);
  const updateTask = useStore((state) => state.updateTask);
  const deleteTask = useStore((state) => state.deleteTask);
  const setError = useStore((state) => state.setError);

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    setError,
  };
};