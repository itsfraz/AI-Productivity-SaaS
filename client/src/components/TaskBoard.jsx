import { useState } from 'react';
import { motion } from 'framer-motion';
import { GripVertical, Clock, Tag, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

const priorityColors = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400',
  high: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400',
};

const TaskCard = ({ task, onDragStart, onDelete, onComplete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      draggable
      onDragStart={(e) => onDragStart(e, task._id)}
      className="bg-white dark:bg-dark-card p-4 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all group"
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className={`text-xs font-semibold px-2 py-1 rounded-md ${priorityColors[task.priority]}`}>
            {task.priority.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-muted">
          <Tag className="w-3.5 h-3.5" />
          {task.category}
        </div>
        {task.deadline && (
          <div className={`flex items-center gap-1.5 text-xs ${new Date(task.deadline) < new Date() && task.status !== 'completed' ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-dark-muted'}`}>
            {new Date(task.deadline) < new Date() && task.status !== 'completed' ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            {new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const TaskBoard = ({ tasks, onTaskMove, onDelete, onComplete }) => {
  const columns = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-100 dark:bg-slate-800' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-50 dark:bg-blue-900/20' },
    { id: 'completed', title: 'Completed', color: 'bg-green-50 dark:bg-green-900/20' }
  ];

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    onTaskMove(taskId, columnId);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px]">
      {columns.map((column) => (
        <div 
          key={column.id}
          className={`${column.color} rounded-2xl p-4 flex flex-col`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">{column.title}</h3>
            <span className="bg-white dark:bg-dark-card text-gray-500 dark:text-dark-muted text-xs font-bold px-2 py-1 rounded-full shadow-sm">
              {tasks.filter(t => t.status === column.id).length}
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
            {tasks
              .filter(task => task.status === column.id)
              .map(task => (
                <TaskCard 
                  key={task._id} 
                  task={task} 
                  onDragStart={handleDragStart}
                  onDelete={onDelete}
                  onComplete={onComplete}
                />
              ))}
            
            {tasks.filter(t => t.status === column.id).length === 0 && (
              <div className="h-24 border-2 border-dashed border-gray-300 dark:border-dark-border rounded-xl flex items-center justify-center text-sm text-gray-400">
                Drop tasks here
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;
