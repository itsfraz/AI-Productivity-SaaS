import { memo, useCallback, useMemo, useState } from 'react';
import { GripVertical, Clock, Tag, Trash2, CheckCircle, AlertCircle, Sparkles, Loader2, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const priorityColors = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
};

const TaskCard = memo(({ task, onDragStart, onDelete, onComplete }) => {
  const queryClient = useQueryClient();
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);

  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';
  const formattedDeadline = task.deadline 
    ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
    : null;

  const breakdownMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/ai/breakdown-task/${task._id}`);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['tasks'], old => 
        old?.map(t => t._id === task._id ? data : t)
      );
      setShowSubtasks(true);
    },
    onSettled: () => {
      setIsBreakingDown(false);
    }
  });

  const toggleSubtaskMutation = useMutation({
    mutationFn: async (subtaskId) => {
      const { data } = await api.patch(`/tasks/${task._id}/subtasks/${subtaskId}`);
      return data;
    },
    onMutate: async (subtaskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      queryClient.setQueryData(['tasks'], old => 
        old?.map(t => {
          if (t._id === task._id) {
            return {
              ...t,
              subtasks: t.subtasks.map(st => st._id === subtaskId ? { ...st, completed: !st.completed } : st)
            };
          }
          return t;
        })
      );
      return { previousTasks };
    },
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['tasks'], context.previousTasks);
    }
  });

  const handleBreakdown = (e) => {
    e.stopPropagation();
    setIsBreakingDown(true);
    breakdownMutation.mutate();
  };

  const handleToggleSubtask = (e, subtaskId) => {
    e.stopPropagation();
    toggleSubtaskMutation.mutate(subtaskId);
  };

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = hasSubtasks ? task.subtasks.filter(st => st.completed).length : 0;
  const progressPercentage = hasSubtasks ? Math.round((completedSubtasks / task.subtasks.length) * 100) : 0;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task._id)}
      className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-shadow group flex flex-col"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${priorityColors[task.priority]}`}>
            {task.priority.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!hasSubtasks && task.status !== 'completed' && (
            <button 
              onClick={handleBreakdown} 
              disabled={isBreakingDown}
              className="p-1 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded disabled:opacity-50"
              title="Break down with AI"
            >
              {isBreakingDown ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </button>
          )}
          {task.status !== 'completed' && (
            <button onClick={() => onComplete(task._id)} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded">
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => onDelete(task._id)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <h4 className={`font-medium mb-1 ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
        {task.title}
      </h4>
      
      {task.description && (
        <p className="text-sm text-gray-500 dark:text-dark-muted mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {hasSubtasks && (
        <div className="mt-2 mb-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-2 border border-zinc-100 dark:border-zinc-700/50">
          <div 
            className="flex items-center justify-between cursor-pointer group/st"
            onClick={() => setShowSubtasks(!showSubtasks)}
          >
            <div className="flex items-center gap-2">
              <div className="relative w-4 h-4 rounded-full border-2 border-zinc-200 dark:border-zinc-600 overflow-hidden flex items-center justify-center">
                {progressPercentage === 100 ? (
                  <CheckCircle className="w-4 h-4 text-green-500 absolute bg-white dark:bg-zinc-800 rounded-full" />
                ) : (
                  <div className="absolute bottom-0 left-0 right-0 bg-primary-500 transition-all duration-300" style={{ height: `${progressPercentage}%` }} />
                )}
              </div>
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                {completedSubtasks}/{task.subtasks.length} done
              </span>
            </div>
            <div className="text-zinc-400 group-hover/st:text-zinc-600 dark:group-hover/st:text-zinc-300">
              {showSubtasks ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
          
          <AnimatePresence>
            {showSubtasks && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {task.subtasks.map(st => (
                    <div 
                      key={st._id} 
                      className="flex items-start gap-2 cursor-pointer group/item"
                      onClick={(e) => handleToggleSubtask(e, st._id)}
                    >
                      <button className={`mt-0.5 flex-shrink-0 transition-colors ${st.completed ? 'text-green-500' : 'text-zinc-300 dark:text-zinc-600 group-hover/item:text-primary-400'}`}>
                        {st.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                      <span className={`text-xs flex-1 ${st.completed ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {st.title}
                        {st.estimatedMinutes && (
                          <span className="ml-2 text-[10px] text-zinc-400 bg-zinc-200/50 dark:bg-zinc-700/50 px-1 rounded inline-block">
                            {st.estimatedMinutes}m
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="mt-auto pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-muted">
          <Tag className="w-3.5 h-3.5" />
          {task.category}
        </div>
        {formattedDeadline && (
          <div className={`flex items-center gap-1.5 text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-dark-muted'}`}>
            {isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            {formattedDeadline}
          </div>
        )}
      </div>
    </div>
  );
});

const TaskBoard = memo(({ tasks, onTaskMove, onDelete, onComplete }) => {
  const columns = useMemo(() => [
    { id: 'todo', title: 'To Do', color: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'completed', title: 'Completed', color: 'bg-green-50 dark:bg-green-900/20' }
  ], []);

  // Pre-compute tasks per column once instead of filtering 3x per column render
  const tasksByColumn = useMemo(() => {
    const map = { 'todo': [], 'in-progress': [], 'completed': [] };
    tasks.forEach(task => {
      if (map[task.status]) {
        map[task.status].push(task);
      }
    });
    return map;
  }, [tasks]);

  const handleDragStart = useCallback((e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onTaskMove(taskId, columnId);
  }, [onTaskMove]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px]">
      {columns.map((column) => {
        const columnTasks = tasksByColumn[column.id];
        return (
          <div 
            key={column.id}
            className={`${column.color} rounded-2xl p-4 flex flex-col`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">{column.title}</h3>
              <span className="bg-white dark:bg-dark-card text-gray-500 dark:text-dark-muted text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
              {columnTasks.map(task => (
                <TaskCard 
                  key={task._id} 
                  task={task} 
                  onDragStart={handleDragStart}
                  onDelete={onDelete}
                  onComplete={onComplete}
                />
              ))}
              
              {columnTasks.length === 0 && (
                <div className="h-24 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl flex items-center justify-center text-sm text-gray-400">
                  Drop tasks here
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default TaskBoard;
