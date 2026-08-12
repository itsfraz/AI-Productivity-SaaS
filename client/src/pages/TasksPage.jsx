import { useState, useCallback, useMemo } from 'react';
import api from '../services/api';
import TaskBoard from '../components/TaskBoard';
import { AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QuickAddBar from '../components/QuickAddBar';

const TasksPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', category: 'Work', deadline: '' });

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      const { data } = await api.get('/tasks');
      return data;
    }
  });

  const categories = useMemo(() => {
    const defaults = ['All', 'Work', 'Personal', 'High Priority'];
    
    // Normalize task categories to Title Case to match defaults and prevent duplicates
    const normalizedCategories = tasks
      .map(t => t.category || 'General')
      .map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase());

    const custom = normalizedCategories.filter(c => !defaults.includes(c));
    return [...defaults, ...Array.from(new Set(custom))];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'All') return tasks;
    if (activeFilter === 'High Priority') {
      return tasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
    }
    return tasks.filter(t => (t.category || 'General').toLowerCase() === activeFilter.toLowerCase());
  }, [tasks, activeFilter]);

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }) => {
      const { data } = await api.put(`/tasks/${taskId}`, { status });
      return data;
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], old => 
        old?.map(t => t._id === taskId ? { ...t, status } : t)
      );
      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['tasks'], context.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: async ({ taskId, data }) => {
      const res = await api.put(`/tasks/${taskId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowModal(false);
      setEditingTaskId(null);
      setIsCustomCategory(false);
      setNewTask({ title: '', description: '', priority: 'medium', category: 'Work', deadline: '' });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      queryClient.setQueryData(['tasks'], old => old?.filter(t => t._id !== taskId));
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['tasks'], context.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task) => {
      const { data } = await api.post('/tasks', task);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowModal(false);
      setIsCustomCategory(false);
      setNewTask({ title: '', description: '', priority: 'medium', category: 'Work', deadline: '' });
    }
  });

  const handleTaskMove = useCallback((taskId, newStatus) => {
    updateTaskMutation.mutate({ taskId, status: newStatus });
  }, [updateTaskMutation]);

  const handleDelete = useCallback((taskId) => {
    deleteTaskMutation.mutate(taskId);
  }, [deleteTaskMutation]);

  const handleComplete = useCallback((taskId) => {
    updateTaskMutation.mutate({ taskId, status: 'completed' });
  }, [updateTaskMutation]);

  const handleEditClick = useCallback((task) => {
    setEditingTaskId(task._id);
    setIsCustomCategory(false);
    setNewTask({
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || 'medium',
      category: task.category || 'Work',
      deadline: task.deadline ? task.deadline.split('T')[0] : ''
    });
    setShowModal(true);
  }, []);

  const handleOpenNewModal = useCallback(() => {
    setEditingTaskId(null);
    setIsCustomCategory(false);
    
    // Default to the current active filter if it's a standard category, otherwise fallback to 'Work'
    let defaultCategory = 'Work';
    if (activeFilter !== 'All' && activeFilter !== 'High Priority') {
      defaultCategory = activeFilter;
    }
    
    setNewTask({ title: '', description: '', priority: 'medium', category: defaultCategory, deadline: '' });
    setShowModal(true);
  }, [activeFilter]);

  const handleSaveTask = useCallback((e) => {
    e.preventDefault();
    if (editingTaskId) {
      editTaskMutation.mutate({ taskId: editingTaskId, data: newTask });
    } else {
      createTaskMutation.mutate(newTask);
    }
  }, [editingTaskId, newTask, editTaskMutation, createTaskMutation]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-zinc-200 dark:border-zinc-700 border-t-primary-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading tasks...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Management</h1>
          <p className="text-gray-500 dark:text-dark-muted mt-1">Organize and prioritize your work efficiently.</p>
        </div>
        <button onClick={handleOpenNewModal} className="btn-primary">
          <Plus className="w-5 h-5 mr-1" /> New Task
        </button>
      </header>

      <QuickAddBar defaultType="task" />

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(filter => {
          const isActive = activeFilter === filter;
          return (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-primary-500 text-white shadow-md' 
                  : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-border'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>

      <TaskBoard 
        tasks={filteredTasks} 
        onTaskMove={handleTaskMove} 
        onDelete={handleDelete}
        onComplete={handleComplete}
        onEdit={handleEditClick}
      />

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div 
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingTaskId ? 'Edit Task' : 'Create New Task'}
                </h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveTask} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input required type="text" className="input-field" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="What needs to be done?" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea className="input-field min-h-[80px]" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Add details..." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                    <select className="input-field" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    {isCustomCategory ? (
                      <div className="flex items-center gap-2">
                        <input 
                          autoFocus
                          type="text" 
                          className="input-field" 
                          value={newTask.category} 
                          onChange={e => setNewTask({...newTask, category: e.target.value})} 
                          placeholder="Type new category..." 
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            setIsCustomCategory(false);
                            setNewTask({...newTask, category: 'Work'});
                          }}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <select 
                        className="input-field" 
                        value={newTask.category} 
                        onChange={e => {
                          if (e.target.value === '___new___') {
                            setIsCustomCategory(true);
                            setNewTask({...newTask, category: ''});
                          } else {
                            setNewTask({...newTask, category: e.target.value});
                          }
                        }}
                      >
                        {categories.filter(c => c !== 'All' && c !== 'High Priority').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="General">General</option>
                        <option value="___new___" className="font-semibold text-primary-600">+ Add custom category...</option>
                      </select>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                  <input type="date" className="input-field" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={createTaskMutation.isPending || editTaskMutation.isPending}>
                    {editingTaskId ? (editTaskMutation.isPending ? 'Saving...' : 'Save Changes') : (createTaskMutation.isPending ? 'Creating...' : 'Create Task')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksPage;
