import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, Zap, ArrowRight, Sparkles } from 'lucide-react';
import StatCard from '../dashboard/StatCard';
import ActivityChart from '../dashboard/ActivityChart';
import AIWidget from '../dashboard/AIWidget';
import GamificationWidget from '../dashboard/GamificationWidget';
import api from '../services/api';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async (cancelled = false) => {
    setLoading(true);
    setError(null);
    try {
      const results = await Promise.allSettled([
        api.get('/tasks'),
        api.get('/analytics')
      ]);
      if (!cancelled) {
        const tasksRes = results[0];
        const analyticsRes = results[1];
        
        if (tasksRes.status === 'fulfilled' && analyticsRes.status === 'fulfilled') {
          setTasks(tasksRes.value.data);
          setAnalytics(analyticsRes.value.data);
        } else {
          setError('Failed to load dashboard data.');
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
      if (!cancelled) setError('An unexpected error occurred.');
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    fetchDashboardData(cancelled);
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="flex h-screen items-center justify-center">Loading dashboard...</div>;
  if (error) return (
    <div className="flex flex-col h-screen items-center justify-center text-red-500">
      <Sparkles className="w-12 h-12 mb-4 opacity-50" />
      <p className="mb-4 font-medium text-red-700 dark:text-red-400">{error}</p>
      <button onClick={() => fetchDashboardData()} className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors font-medium">Retry</button>
    </div>
  );

  const completedTasksCount = analytics?.stats?.completedTasks ?? 0;
  const totalTasksCount = analytics?.stats?.totalTasks ?? 0;
  const pendingTasksCount = totalTasksCount - completedTasksCount;

  const stats = [
    {
      title: "Productivity Score",
      value: `${analytics?.productivityScore ?? user?.productivityScore ?? 0}%`,
      subtitle: "vs last week",
      trend: "neutral",
      trendValue: "0%",
      icon: Activity
    },
    {
      title: "Active Streak",
      value: `${user?.currentStreak ?? 0} Days`,
      subtitle: `Personal best: ${user?.currentStreak ?? 0}`,
      trend: "neutral",
      trendValue: "0",
      icon: Zap
    },
    {
      title: "Tasks Completed",
      value: `${completedTasksCount} / ${totalTasksCount || 1}`,
      subtitle: `${pendingTasksCount} tasks remaining`,
      trend: "neutral",
      trendValue: "0",
      icon: CheckCircle
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-[80px] pointer-events-none -z-10" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-4">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">Daily Overview</span>
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Good Morning, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-purple-500">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-[15px]">
            Ready to conquer the day? You have {pendingTasksCount} pending tasks.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="hidden sm:block"
        >
          <div className="text-right">
            <p className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </p>
            <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
            </p>
          </div>
        </motion.div>
      </header>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} index={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <ActivityChart data={analytics?.trends} />
        </div>

        <div className="col-span-1 flex flex-col gap-6 h-full">
          <GamificationWidget />
          <AIWidget />
        </div>
      </div>

      {/* Tasks Overview Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-panel p-8 mt-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Action Items</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Your priority tasks for today</p>
          </div>
          <Link to="/tasks" className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors group">
            View All <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-4 text-zinc-500">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-4 text-zinc-500 bg-zinc-50/50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
              No tasks for today. Enjoy your day!
            </div>
          ) : (
            tasks.slice(0, 5).map((task) => {
              const isDone = task.status === 'completed';
              return (
                <motion.div 
                  key={task._id} 
                  whileHover={{ scale: 1.01 }}
                  className="group flex items-center justify-between p-4 rounded-xl bg-zinc-50/50 hover:bg-white dark:bg-zinc-900/50 dark:hover:bg-zinc-800/80 border border-zinc-200/50 dark:border-zinc-800/50 hover:shadow-sm transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isDone ? 'bg-primary-500 border-primary-500' : 'border-zinc-300 dark:border-zinc-600 group-hover:border-primary-400'}`}>
                      {isDone && <CheckCircle className="w-4 h-4 text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-[15px] font-medium ${isDone ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-700 dark:text-zinc-200'}`}>
                      {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md">
                      {task.category || 'General'}
                    </span>
                    <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 w-24 text-right">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No date'}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
