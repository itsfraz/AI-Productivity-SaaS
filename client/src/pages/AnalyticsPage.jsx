import { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Activity, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import WeeklyReportCard from '../components/WeeklyReportCard';

const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        api.get('/analytics'),
        api.get('/ai/reports')
      ]);
      
      const analyticsRes = results[0];
      const reportsRes = results[1];

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data);
      } else {
        setError('Failed to load productivity analytics.');
      }

      if (reportsRes.status === 'fulfilled') {
        setReports(reportsRes.value.data);
      }
    } catch (error) {
      console.error('Failed to fetch analytics', error);
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-gray-500">Loading insights...</div>;
  if (error) return (
    <div className="flex flex-col h-64 items-center justify-center text-red-500">
      <AlertTriangle className="w-12 h-12 mb-4 opacity-80" />
      <p className="mb-4 font-medium text-red-700 dark:text-red-400">{error}</p>
      <button onClick={fetchAnalytics} className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium">Retry</button>
    </div>
  );
  if (!analytics) return null;

  const { productivityScore, stats, burnout, trends } = analytics;

  const hasFocusData = trends?.some(t => t.focusHours > 0);
  const hasTaskData = trends?.some(t => t.tasksDone > 0);

  return (
    <div className="space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Productivity Analytics</h1>
        <p className="text-gray-500 dark:text-dark-muted mt-1">Deep dive into your performance metrics.</p>
      </header>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 border-l-4 border-primary-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">Productivity Score</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{productivityScore}%</h3>
            </div>
            <Activity className="w-6 h-6 text-primary-500" />
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">Tasks Completed</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.completedTasks} <span className="text-sm font-normal text-gray-400">/ {stats.totalTasks}</span></h3>
            </div>
            <CheckCircle className="w-6 h-6 text-blue-500" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">Habit Consistency</p>
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.totalStreaks} <span className="text-sm font-normal text-gray-400">days</span></h3>
            </div>
            <Target className="w-6 h-6 text-orange-500" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={`glass-card p-6 border-l-4 ${burnout.riskLevel === 'High' ? 'border-red-500' : burnout.riskLevel === 'Moderate' ? 'border-yellow-500' : 'border-green-500'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-muted">Burnout Risk</p>
              <h3 className={`text-2xl font-bold mt-2 ${burnout.riskLevel === 'High' ? 'text-red-600' : burnout.riskLevel === 'Moderate' ? 'text-yellow-600' : 'text-green-600'}`}>
                {burnout.riskLevel}
              </h3>
            </div>
            <AlertTriangle className={`w-6 h-6 ${burnout.riskLevel === 'High' ? 'text-red-500' : burnout.riskLevel === 'Moderate' ? 'text-yellow-500' : 'text-green-500'}`} />
          </div>
        </motion.div>
      </div>

      {/* Burnout AI Warning (If Applicable) */}
      {burnout.riskLevel !== 'Low' && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`p-4 rounded-xl border ${burnout.riskLevel === 'High' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'} flex items-start gap-4`}>
          <AlertTriangle className={`w-6 h-6 mt-0.5 flex-shrink-0 ${burnout.riskLevel === 'High' ? 'text-red-500' : 'text-yellow-500'}`} />
          <div>
            <h4 className={`font-semibold ${burnout.riskLevel === 'High' ? 'text-red-800 dark:text-red-300' : 'text-yellow-800 dark:text-yellow-300'}`}>AI Coach Warning</h4>
            <p className={`text-sm mt-1 ${burnout.riskLevel === 'High' ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>{burnout.message}</p>
          </div>
        </motion.div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Focus Hours Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Focus Hours (Weekly)</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-72 w-full relative">
            {!hasFocusData && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-[2px] rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">No focus sessions this week</p>
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">Start a timer to see your trends!</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="focusHours" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} animationDuration={1500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Task Completion Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Task Completion Volume</h2>
          </div>
          <div className="h-72 w-full relative">
            {!hasTaskData && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 dark:bg-[#09090b]/60 backdrop-blur-[2px] rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
                <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">No tasks completed this week</p>
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">Finish a task to see your volume!</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="tasksDone" fill="#22c55e" radius={[4, 4, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* Weekly Reports Section */}
      {reports.length > 0 && (
        <div className="mt-12 space-y-4">
          <header className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Weekly Retrospectives</h2>
            <p className="text-gray-500 dark:text-dark-muted mt-1">Your personalized weekly performance breakdowns.</p>
          </header>
          
          <div className="space-y-4">
            {reports.map((report, idx) => (
              <WeeklyReportCard key={report._id} report={report} isLatest={idx === 0} initiallyExpanded={idx === 0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
