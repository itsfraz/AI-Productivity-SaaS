import { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const defaultData = [
  { name: 'Mon', score: 0, tasks: 0 },
  { name: 'Tue', score: 0, tasks: 0 },
  { name: 'Wed', score: 0, tasks: 0 },
  { name: 'Thu', score: 0, tasks: 0 },
  { name: 'Fri', score: 0, tasks: 0 },
  { name: 'Sat', score: 0, tasks: 0 },
  { name: 'Sun', score: 0, tasks: 0 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-3 rounded-lg shadow-xl">
        <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
        <p className="text-primary-500 text-sm font-medium">Score: {payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

const ActivityChart = ({ data }) => {
  // If the backend doesn't send trends, fallback to defaultData
  // Since the backend returns 'focusHours' and 'tasksDone', we map it to match Recharts 'score' and 'tasks'
  const chartData = data && data.length > 0 
    ? data.map(item => ({ name: item.day, score: item.focusHours * 10 || 0, tasks: item.tasksDone || 0 })) 
    : defaultData;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-6 col-span-1 lg:col-span-2"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Productivity Trend</h2>
          <p className="text-sm text-gray-500 dark:text-dark-muted">Your focus score over the last 7 days</p>
        </div>
        <select className="bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-sm rounded-lg px-3 py-1.5 outline-none text-gray-600 dark:text-gray-300">
          <option>This Week</option>
          <option>Last Week</option>
        </select>
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#22c55e" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorScore)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default ActivityChart;
