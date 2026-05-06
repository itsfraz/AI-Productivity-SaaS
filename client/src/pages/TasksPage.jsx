import { useState, useEffect } from 'react';
import api from '../services/api';
import TaskBoard from '../components/TaskBoard';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', category: 'Work', deadline: '' });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks');
      setTasks(data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskMove = async (taskId, newStatus) => {
    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t._id === taskId ? { ...t, status: newStatus } : t));

    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (error) {
      setTasks(previousTasks); // Revert on failure
      console.error('Failed to move task');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(t => t._id !== taskId));
    } catch (error) {
      console.error('Failed to delete task');
    }
  };

  const handleComplete = async (taskId) => {
    handleTaskMove(taskId, 'completed');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/tasks', newTask);
      setTasks([data, ...tasks]);
      setShowModal(false);
      setNewTask({ title: '', description: '', priority: 'medium', category: 'Work', deadline: '' });
    } catch (error) {
      console.error('Failed to create task');
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-gray-500">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Management</h1>
          <p className="text-gray-500 dark:text-dark-muted mt-1">Organize and prioritize your work efficiently.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-1" /> New Task
        </button>
      </header>

      {/* Task Filters Placeholder (Future Iteration) */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['All', 'Work', 'Personal', 'High Priority'].map(filter => (
          <button key={filter} className="px-4 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
            {filter}
          </button>
        ))}
      </div>

      <TaskBoard 
        tasks={tasks} 
        onTaskMove={handleTaskMove} 
        onDelete={handleDelete}
        onComplete={handleComplete}
      />

      {/* Create Task Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Task</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                  <input required type="text" className="input-field" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="What needs to be done?" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea className="input-field min-h-[80px]" value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Add details..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Deadline</label>
                    <input type="date" className="input-field" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-dark-border rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TasksPage;
