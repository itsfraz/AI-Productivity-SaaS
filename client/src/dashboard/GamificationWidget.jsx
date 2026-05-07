import { motion } from 'framer-motion';
import { Trophy, Star, Shield, Zap, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const GamificationWidget = () => {
  const { user } = useAuth();
  
  const achievements = user?.achievements || [];
  const points = user?.points || 0;
  const level = Math.floor(points / 100) + 1;
  const nextLevelPoints = level * 100;
  const progressPercent = (points % 100);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-card p-6 col-span-1 flex flex-col h-full bg-gradient-to-b from-white to-orange-50/30 dark:from-dark-card dark:to-orange-900/10 border-orange-100 dark:border-orange-900/30"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg text-white shadow-lg shadow-orange-500/30">
          <Trophy className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Your Progress</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        {/* Level Avatar & Ring */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-orange-100 dark:text-orange-900/30" />
            <circle 
              cx="48" cy="48" r="44" 
              stroke="currentColor" 
              strokeWidth="4" 
              fill="transparent" 
              strokeDasharray={2 * Math.PI * 44} 
              strokeDashoffset={2 * Math.PI * 44 * (1 - progressPercent / 100)} 
              className="text-orange-500 transition-all duration-1000 ease-out" 
              strokeLinecap="round"
            />
          </svg>
          <div className="z-10 flex flex-col items-center">
            <span className="text-xs text-orange-600 dark:text-orange-400 font-bold uppercase tracking-widest">Lvl</span>
            <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">{level}</span>
          </div>
        </div>

        {/* Points Info */}
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
            <Zap className="w-5 h-5 text-yellow-500 fill-current" />
            {points} XP
          </p>
          <p className="text-sm text-gray-500 dark:text-dark-muted mt-1">
            {nextLevelPoints - points} XP to Level {level + 1}
          </p>
        </div>

        {/* Recent Badges */}
        <div className="w-full pt-4 border-t border-gray-100 dark:border-dark-border">
          <h4 className="text-xs font-semibold text-gray-400 dark:text-dark-muted uppercase tracking-wider mb-3">Recent Badges</h4>
          <div className="flex gap-2">
            {achievements.length > 0 ? (
              achievements.slice(0, 3).map((ach, idx) => (
                <div key={idx} className="flex-1 bg-white/60 dark:bg-dark-bg/60 p-2 rounded-lg border border-white dark:border-white/5 flex flex-col items-center justify-center text-center gap-1" title={ach.badgeName}>
                  {ach.icon || <Shield className="w-5 h-5 text-blue-500" />}
                  <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400 truncate w-full">{ach.badgeName}</span>
                </div>
              ))
            ) : (
              <div className="w-full text-center py-2 text-xs text-gray-400 dark:text-dark-muted border border-dashed border-gray-200 dark:border-dark-border rounded-lg">
                No badges yet. Start completing tasks!
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GamificationWidget;
