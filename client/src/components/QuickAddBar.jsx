import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const QuickAddBar = ({ defaultType = 'task' }) => {
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const queryClient = useQueryClient();
  const inputRef = useRef(null);

  const parseMutation = useMutation({
    mutationFn: async (text) => {
      const { data } = await api.post('/ai/parse-intent', { text });
      return data;
    },
    onSuccess: (data) => {
      setParsedResult(data);
      setIsParsing(false);
    },
    onError: () => {
      setIsParsing(false);
      // Fallback
      setParsedResult({
        type: defaultType,
        title: input,
        priority: 'medium',
        category: 'Work',
        frequency: 'daily'
      });
    }
  });

  const confirmMutation = useMutation({
    mutationFn: async (data) => {
      if (data.type === 'task') {
        return api.post('/tasks', {
          title: data.title,
          priority: data.priority,
          category: data.category,
          deadline: data.deadline
        });
      } else {
        return api.post('/habits', {
          title: data.title,
          frequency: data.frequency
        });
      }
    },
    onSuccess: (res, variables) => {
      if (variables.type === 'task') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['habits'] });
      }
      setParsedResult(null);
      setInput('');
      inputRef.current?.focus();
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isParsing) return;
    setIsParsing(true);
    setParsedResult(null);
    parseMutation.mutate(input);
  };

  const handleConfirm = () => {
    confirmMutation.mutate(parsedResult);
  };

  const handleDiscard = () => {
    setParsedResult(null);
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-3xl mb-8 relative z-30">
      <form onSubmit={handleSubmit} className="relative group">
        <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${isParsing ? 'text-primary-500' : 'text-zinc-400 group-focus-within:text-primary-500'}`}>
          {isParsing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isParsing || !!parsedResult}
          placeholder="Try: 'finish deck by Friday, urgent'"
          className="w-full bg-white dark:bg-dark-card border border-zinc-200 dark:border-dark-border text-zinc-900 dark:text-zinc-100 rounded-xl pl-11 pr-4 py-3.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-zinc-400 disabled:opacity-70 disabled:cursor-not-allowed"
        />
        {isParsing && (
          <motion.div 
            className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none overflow-hidden"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        )}
      </form>

      <AnimatePresence>
        {parsedResult && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 p-4 bg-white dark:bg-dark-card border border-zinc-200 dark:border-dark-border rounded-xl shadow-xl z-20"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary-500 bg-primary-50 dark:bg-primary-900/20 px-2 py-1 rounded">
                  {parsedResult.type} Detected
                </span>
                <div className="flex gap-2">
                  <button onClick={handleDiscard} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                  <button onClick={handleConfirm} disabled={confirmMutation.isPending} className="p-1.5 text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors flex items-center gap-1 px-3 text-sm font-medium disabled:opacity-50">
                    <Check className="w-4 h-4" />
                    {confirmMutation.isPending ? 'Saving...' : 'Confirm'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Title</label>
                  <input 
                    type="text" 
                    value={parsedResult.title || ''}
                    onChange={e => setParsedResult({...parsedResult, title: e.target.value})}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500 transition-colors"
                  />
                </div>
                
                {parsedResult.type === 'task' && (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Priority</label>
                      <select 
                        value={parsedResult.priority || 'medium'}
                        onChange={e => setParsedResult({...parsedResult, priority: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500 transition-colors"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Category</label>
                      <input 
                        type="text" 
                        value={parsedResult.category || ''}
                        onChange={e => setParsedResult({...parsedResult, category: e.target.value})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Deadline</label>
                      <input 
                        type="date" 
                        value={parsedResult.deadline ? parsedResult.deadline.split('T')[0] : ''}
                        onChange={e => setParsedResult({...parsedResult, deadline: e.target.value ? new Date(e.target.value).toISOString() : ''})}
                        className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500 transition-colors"
                      />
                    </div>
                  </>
                )}
                
                {parsedResult.type === 'habit' && (
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Frequency</label>
                    <select 
                      value={parsedResult.frequency || 'daily'}
                      onChange={e => setParsedResult({...parsedResult, frequency: e.target.value})}
                      className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary-500 transition-colors"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuickAddBar;
