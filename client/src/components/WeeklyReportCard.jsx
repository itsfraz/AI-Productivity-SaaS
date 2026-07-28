import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, AlertTriangle, Lightbulb, Copy, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const WeeklyReportCard = ({ report, isLatest = false, initiallyExpanded = false }) => {
  const [expanded, setExpanded] = useState(initiallyExpanded || isLatest);
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const { weekStart, weekEnd, summary, strength, improvement, suggestion, stats } = report;

  const dateRange = `${format(new Date(weekStart), 'MMM d')} - ${format(new Date(weekEnd), 'MMM d, yyyy')}`;

  const copyToClipboard = (e) => {
    e.stopPropagation();
    const text = `Weekly Productivity Recap (${dateRange})\n\nSummary: ${summary}\n\nKey Strength: ${strength}\n\nArea for Improvement: ${improvement}\n\nGoal for Next Week: ${suggestion}\n\nStats:\n- Tasks: ${stats.tasksCompleted}\n- Focus: ${stats.focusMinutes} min\n- Habits: ${stats.habitsCompleted}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card overflow-hidden ${isLatest ? 'border-primary-500/50 shadow-lg shadow-primary-500/10' : ''}`}
    >
      <div 
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/50 dark:hover:bg-zinc-800/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isLatest ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              Weekly Retrospective
              {isLatest && <span className="text-[10px] uppercase tracking-wider bg-primary-500 text-white px-2 py-0.5 rounded-full font-semibold">Latest</span>}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{dateRange}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {expanded && (
            <button 
              onClick={copyToClipboard}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-md text-xs font-medium transition-colors"
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy summary'}
            </button>
          )}
          <div className="p-1 text-zinc-400">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-zinc-100 dark:border-zinc-800/60"
          >
            <div className="p-6 space-y-6">
              <div>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm">
                  {summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-green-800 dark:text-green-300 text-sm">Key Strength</h4>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-400/90 leading-relaxed">{strength}</p>
                </div>
                
                <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    <h4 className="font-semibold text-orange-800 dark:text-orange-300 text-sm">Improvement Area</h4>
                  </div>
                  <p className="text-sm text-orange-700 dark:text-orange-400/90 leading-relaxed">{improvement}</p>
                </div>
                
                <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <h4 className="font-semibold text-primary-800 dark:text-primary-300 text-sm">Next Week's Focus</h4>
                  </div>
                  <p className="text-sm text-primary-700 dark:text-primary-400/90 leading-relaxed">{suggestion}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Tasks Done</p>
                    <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{stats.tasksCompleted}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Focus Minutes</p>
                    <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{stats.focusMinutes}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Habits Complete</p>
                    <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">{stats.habitsCompleted}</p>
                  </div>
                </div>
              </div>
              
              <div className="sm:hidden flex justify-end">
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-md text-xs font-medium transition-colors w-full justify-center"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied' : 'Copy summary'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WeeklyReportCard;
