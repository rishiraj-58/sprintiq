import { useStore } from '../index';

export const useTask = () => {
  const tasks = useStore((state) => state.tasks);
  const currentTask = useStore((state) => state.currentTask);
  const isLoading = useStore((state) => state.isLoading);
  const isCurrentTaskLoading = useStore((state) => state.isCurrentTaskLoading);
  const error = useStore((state) => state.error);
  const currentTaskError = useStore((state) => state.currentTaskError);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const fetchTaskById = useStore((state) => state.fetchTaskById);
  const createTask = useStore((state) => state.createTask);
  const updateTask = useStore((state) => state.updateTask);
  const deleteTask = useStore((state) => state.deleteTask);
  const setCurrentTask = useStore((state) => state.setCurrentTask);
  const setError = useStore((state) => state.setError);

  return {
    tasks,
    currentTask,
    isLoading,
    isCurrentTaskLoading,
    error,
    currentTaskError,
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTask,
    deleteTask,
    setCurrentTask,
    setError,
  };
};