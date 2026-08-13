import { useState, useCallback, memo, useMemo } from 'react';
import api from '../services/api';
import { AnimatePresence } from 'framer-motion';
import { Plus, Flame, Shield, Trash2, Check, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import QuickAddBar from '../components/QuickAddBar';

const HeatmapSquare = memo(({ completed, isToday }) => (
  <div className={`w-6 h-6 rounded-md border ${
    completed 
      ? 'bg-green-500 border-green-600' 
      : isToday 
        ? 'bg-gray-100 dark:bg-dark-border border-gray-300 dark:border-gray-600 border-dashed'
        : 'bg-gray-50 dark:bg-dark-bg border-gray-200 dark:border-dark-border'
  }`} />
));

const HabitCard = memo(({ habit, isCompletedToday, onLog, onDelete }) => {
  const completed = isCompletedToday;
  
  const pastWeek = useMemo(() => {
    const squares = [];
    for(let i=6; i>=0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const isToday = i === 0;
      
      let dayCompleted = false;
      if (isToday) {
        dayCompleted = completed;
      } else if (habit.completionLog && habit.completionLog.length > 0) {
        dayCompleted = habit.completionLog.some(logDate => {
          const log = new Date(logDate);
          return log.getDate() === d.getDate() && 
                 log.getMonth() === d.getMonth() && 
                 log.getFullYear() === d.getFullYear();
        });
      } else {
        dayCompleted = habit.streak > i;
      }
      
      squares.push(<HeatmapSquare key={i} completed={dayCompleted} isToday={isToday} />);
    }
    return squares;
  }, [habit.completionLog, habit.streak, completed]);

  return (
    <div className="glass-card p-6 relative overflow-hidden group">
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
          <button onClick={() => onDelete(habit._id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-end gap-2 mb-6">
        <Flame className={`w-8 h-8 ${habit.streak > 0 ? 'text-orange-500' : 'text-gray-300 dark:text-dark-muted'}`} />
        <div>
          <div className="text-3xl font-black text-gray-900 dark:text-white leading-none">{habit.streak}</div>
          <div className="text-xs text-gray-500 dark:text-dark-muted font-medium uppercase tracking-wider mt-1">Day Streak</div>
        </div>
      </div>

      <div className="mb-6">
        <div className="text-xs text-gray-500 dark:text-dark-muted mb-2 font-medium">Past 7 Days</div>
        <div className="flex gap-1.5">
          {pastWeek}
        </div>
      </div>

      <button 
        onClick={() => onLog(habit._id)}
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
    </div>
  );
});

const HabitsPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const { data: habits = [], isLoading: loading, isError, refetch } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data } = await api.get('/habits');
      return data;
    }
  });

  const createHabitMutation = useMutation({
    mutationFn: async (title) => {
      const { data } = await api.post('/habits', { title, frequency: 'daily' });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setNewTitle('');
      setShowModal(false);
    }
  });

  const deleteHabitMutation = useMutation({
    mutationFn: async (habitId) => {
      await api.delete(`/habits/${habitId}`);
    },
    onMutate: async (habitId) => {
      await queryClient.cancelQueries({ queryKey: ['habits'] });
      const previousHabits = queryClient.getQueryData(['habits']);
      queryClient.setQueryData(['habits'], old => old?.filter(h => h._id !== habitId));
      return { previousHabits };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(['habits'], context.previousHabits);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const logHabitMutation = useMutation({
    mutationFn: async (habitId) => {
      const { data } = await api.post(`/habits/${habitId}/log`);
      return data;
    },
    onSuccess: (data, habitId) => {
      if (data.recoveryUsed) {
        alert('Streak freeze used! Your streak was saved.');
      }
      queryClient.setQueryData(['habits'], old => 
        old?.map(h => h._id === habitId ? data.habit : h)
      );
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to log habit');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    }
  });

  const isCompletedToday = useCallback((habit) => {
    if (!habit.lastCompleted) return false;
    const today = new Date();
    const last = new Date(habit.lastCompleted);
    return last.getDate() === today.getDate() && 
           last.getMonth() === today.getMonth() && 
           last.getFullYear() === today.getFullYear();
  }, []);

  const handleLogHabit = useCallback((habitId) => {
    logHabitMutation.mutate(habitId);
  }, [logHabitMutation]);

  const handleDelete = useCallback((habitId) => {
    deleteHabitMutation.mutate(habitId);
  }, [deleteHabitMutation]);

  const handleCreate = useCallback((e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createHabitMutation.mutate(newTitle);
  }, [newTitle, createHabitMutation]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-zinc-200 dark:border-zinc-700 border-t-primary-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading habits...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col h-64 items-center justify-center text-red-500">
        <p className="mb-4 font-medium text-red-700 dark:text-red-400">Failed to load habits.</p>
        <button onClick={() => refetch()} className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors font-medium">Retry</button>
      </div>
    );
  }

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

      <QuickAddBar defaultType="habit" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.map((habit) => (
          <HabitCard
            key={habit._id}
            habit={habit}
            isCompletedToday={isCompletedToday(habit)}
            onLog={handleLogHabit}
            onDelete={handleDelete}
          />
        ))}
      </div>

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

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm" onClick={() => setShowModal(false)}>
            <div 
              onClick={e => e.stopPropagation()}
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
                
                <button type="submit" className="btn-primary w-full py-2.5" disabled={createHabitMutation.isPending}>
                  {createHabitMutation.isPending ? 'Starting...' : 'Start Habit'}
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HabitsPage;
