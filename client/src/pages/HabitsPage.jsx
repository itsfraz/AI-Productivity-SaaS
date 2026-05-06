import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Flame, Shield, Trash2, Check, X } from 'lucide-react';

const HeatmapSquare = ({ completed, isToday }) => (
  <div className={`w-6 h-6 rounded-md border ${
    completed 
      ? 'bg-green-500 border-green-600' 
      : isToday 
        ? 'bg-gray-100 dark:bg-dark-border border-gray-300 dark:border-gray-600 border-dashed'
        : 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border'
  }`} />
);

const HabitsPage = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const { data } = await api.get('/habits');
      setHabits(data);
    } catch (error) {
      console.error('Failed to fetch habits', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogHabit = async (habitId) => {
    try {
      const { data } = await api.post(`/habits/${habitId}/log`);
      if (data.recoveryUsed) {
        alert('Streak freeze used! Your streak was saved.');
      }
      // Update local state
      setHabits(habits.map(h => h._id === habitId ? data.habit : h));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to log habit');
    }
  };

  const handleDelete = async (habitId) => {
    try {
      await api.delete(`/habits/${habitId}`);
      setHabits(habits.filter(h => h._id !== habitId));
    } catch (error) {
      console.error('Failed to delete habit');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const { data } = await api.post('/habits', { title: newTitle, frequency: 'daily' });
      setHabits([data, ...habits]);
      setNewTitle('');
      setShowModal(false);
    } catch (error) {
      console.error('Failed to create habit');
    }
  };

  // Check if a habit was completed today
  const isCompletedToday = (habit) => {
    if (!habit.lastCompleted) return false;
    const today = new Date();
    const last = new Date(habit.lastCompleted);
    return last.getDate() === today.getDate() && 
           last.getMonth() === today.getMonth() && 
           last.getFullYear() === today.getFullYear();
  };

  // Generate fake past week data for UI representation
  const generatePastWeek = (habit) => {
    const squares = [];
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const isToday = i === 0;
      
      // If it's today, we check actual completion. For past days, we fake it based on streak for demo purposes,
      // in reality we would map over habit.completionLog.
      const completed = isToday ? isCompletedToday(habit) : (habit.streak > i);
      
      squares.push(<HeatmapSquare key={i} completed={completed} isToday={isToday} />);
    }
    return squares;
  };

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-500">Loading habits...</div>;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Habit Tracker</h1>
          <p className="text-gray-500 dark:text-dark-muted mt-1">Build consistency. Protect your streak.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-1" /> New Habit
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit, index) => {
          const completed = isCompletedToday(habit);
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={habit._id} 
              className="glass-card p-6 relative overflow-hidden group"
            >
              {/* Status Header */}
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{habit.title}</h3>
                <div className="flex items-center gap-2">
                  {habit.recoveryAvailable ? (
                    <div className="flex items-center text-xs font-semibold text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded">
                      <Shield className="w-3 h-3 mr-1" /> Safe
                    </div>
                  ) : (
                    <div className="flex items-center text-xs font-semibold text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded">
                      No Freeze
                    </div>
                  )}
                  <button onClick={() => handleDelete(habit._id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Streak Info */}
              <div className="flex items-end gap-2 mb-6">
                <Flame className={`w-8 h-8 ${habit.streak > 0 ? 'text-orange-500' : 'text-gray-300 dark:text-dark-muted'}`} />
                <div>
                  <div className="text-3xl font-black text-gray-900 dark:text-white leading-none">{habit.streak}</div>
                  <div className="text-xs text-gray-500 dark:text-dark-muted font-medium uppercase tracking-wider mt-1">Day Streak</div>
                </div>
              </div>

              {/* Heatmap Visualization */}
              <div className="mb-6">
                <div className="text-xs text-gray-500 dark:text-dark-muted mb-2 font-medium">Past 7 Days</div>
                <div className="flex gap-1.5">
                  {generatePastWeek(habit)}
                </div>
              </div>

              {/* Action Button */}
              <button 
                onClick={() => handleLogHabit(habit._id)}
                disabled={completed}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  completed 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:from-orange-500 hover:to-orange-600 shadow-lg shadow-orange-500/20 active:scale-95'
                }`}
              >
                {completed ? (
                  <>
                    <Check className="w-5 h-5" /> Completed
                  </>
                ) : (
                  'Mark as Done'
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {habits.length === 0 && (
        <div className="glass-card p-12 text-center">
          <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Flame className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No habits yet</h2>
          <p className="text-gray-500 dark:text-dark-muted mb-6 max-w-sm mx-auto">Start building consistency by creating your first daily habit.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary mx-auto">
            Create Habit
          </button>
        </div>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Habit</h2>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">I want to...</label>
                  <input 
                    required 
                    type="text" 
                    className="input-field" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)} 
                    placeholder="e.g. Meditate for 10 minutes" 
                    autoFocus
                  />
                </div>
                
                <button type="submit" className="btn-primary w-full py-2.5">
                  Start Habit
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HabitsPage;
