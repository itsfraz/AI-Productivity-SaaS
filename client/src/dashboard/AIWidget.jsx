import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, X } from 'lucide-react';
import api from '../services/api';

const AIWidget = () => {
  const [loading, setLoading] = useState(false);
  const [schedule, setSchedule] = useState(null);

  const handleGeneratePlan = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/schedule');
      setSchedule(data.schedule);
    } catch (error) {
      setSchedule("Failed to generate schedule. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative overflow-hidden rounded-xl border border-indigo-200 dark:border-indigo-900/50 shadow-xl col-span-1"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20"></div>
        
        <div className="relative p-6 z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Coach Insights</h2>
          </div>

          <div className="space-y-4 flex-1">
            <div className="p-4 bg-white/60 dark:bg-dark-bg/60 backdrop-blur-sm border border-white/40 dark:border-white/10 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                You are currently on a <span className="font-semibold text-primary-500">12-day streak</span>! Based on your usual patterns, you are most productive between 10 AM and 1 PM. Try scheduling your deep work then.
              </p>
            </div>
            
            <div className="p-4 bg-white/60 dark:bg-dark-bg/60 backdrop-blur-sm border border-white/40 dark:border-white/10 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Notice: You pushed 3 tasks from yesterday. Consider breaking them down into smaller sub-tasks to avoid burnout.
              </p>
            </div>
          </div>

          <button 
            onClick={handleGeneratePlan}
            disabled={loading}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/20 dark:hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-300 font-medium rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate Daily Plan'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </motion.div>

      {/* AI Schedule Result Modal */}
      <AnimatePresence>
        {schedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Smart Schedule</h2>
                </div>
                <button onClick={() => setSchedule(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="prose dark:prose-invert prose-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {schedule}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIWidget;
