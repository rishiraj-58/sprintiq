import { useStore } from '../index';

export const useTask = () => {
  const tasks = useStore((state) => state.tasks);
  const currentTask = useStore((state) => state.currentTask);
  const comments = useStore((state) => state.comments);
  const filters = useStore((state) => state.filters);
  const isLoading = useStore((state) => state.isLoading);
  const isCurrentTaskLoading = useStore((state) => state.isCurrentTaskLoading);
  const isCommentsLoading = useStore((state) => state.isCommentsLoading);
  const error = useStore((state) => state.error);
  const currentTaskError = useStore((state) => state.currentTaskError);
  const commentsError = useStore((state) => state.commentsError);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const fetchTaskById = useStore((state) => state.fetchTaskById);
  const fetchComments = useStore((state) => state.fetchComments);
  const addComment = useStore((state) => state.addComment);
  const setFilters = useStore((state) => state.setFilters);
  const clearFilters = useStore((state) => state.clearFilters);
  const createTask = useStore((state) => state.createTask);
  const updateTask = useStore((state) => state.updateTask);
  const deleteTask = useStore((state) => state.deleteTask);
  const setCurrentTask = useStore((state) => state.setCurrentTask);
  const setError = useStore((state) => state.setError);

  return {
    tasks,
    currentTask,
    comments,
    filters,
    isLoading,
    isCurrentTaskLoading,
    isCommentsLoading,
    error,
    currentTaskError,
    commentsError,
    fetchTasks,
    fetchTaskById,
    fetchComments,
    addComment,
    setFilters,
    clearFilters,
    createTask,
    updateTask,
    deleteTask,
    setCurrentTask,
    setError,
  };
};