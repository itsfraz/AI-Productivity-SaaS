import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, index }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel p-6 relative overflow-hidden group hover:shadow-glow transition-all duration-300"
    >
      {/* Background Gradient Blob for visual flair */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-[40px] group-hover:bg-primary-500/20 transition-all duration-500"></div>

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">{title}</h3>
          <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1.5 tracking-tight">{value}</p>
        </div>
        <div className="p-3 bg-white dark:bg-[#000000] rounded-2xl text-primary-500 border border-zinc-200/50 dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-110 duration-300">
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
      </div>

      <div className="flex items-center gap-2.5 mt-auto relative z-10">
        <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-0.5 ${
          trend === 'up' 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
            : trend === 'down'
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
        }`}>
          {trend === 'up' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          ) : trend === 'down' ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          ) : '−'}
          {trendValue}
        </span>
        <span className="text-[13px] font-medium text-zinc-400 dark:text-zinc-500">{subtitle}</span>
      </div>
    </motion.div>
  );
};

export default StatCard;
