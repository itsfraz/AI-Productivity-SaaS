import { Outlet, Link, useLocation } from 'react-router-dom';
import { memo, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, CheckSquare, Activity, Moon, Sun, Settings, TrendingUp, Clock, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationBell from '../components/NotificationBell';

const SidebarItem = memo(({ icon: Icon, label, to, isActive }) => (
  <Link 
    to={to} 
    className="relative group block mb-1.5 outline-none"
  >
    {isActive && (
      <motion.div 
        layoutId="sidebar-active"
        className="absolute inset-0 bg-primary-50 dark:bg-primary-500/10 rounded-xl"
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      />
    )}
    <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 z-10 ${
      isActive 
        ? 'text-primary-600 dark:text-primary-400 font-semibold' 
        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50'
    }`}>
      <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary-500 dark:text-primary-400' : 'group-hover:text-zinc-900 dark:group-hover:text-zinc-100'}`} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[15px]">{label}</span>
    </div>
  </Link>
));

const DashboardLayout = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-[#000000] text-zinc-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside 
        className="w-[260px] bg-white dark:bg-[#09090b] border-r border-zinc-200 dark:border-zinc-800/60 flex flex-col z-20 flex-shrink-0"
      >
        <div className="h-[72px] flex items-center px-6 border-b border-zinc-200/50 dark:border-zinc-800/40">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 text-white font-bold text-xl mr-3 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">
            Focus<span className="text-primary-500">AI</span>
          </h2>
        </div>
        
        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
          <div className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 px-2">Menu</div>
          <SidebarItem icon={LayoutDashboard} label="Overview" to="/" isActive={location.pathname === '/'} />
          <SidebarItem icon={CheckSquare} label="Tasks" to="/tasks" isActive={location.pathname === '/tasks'} />
          <SidebarItem icon={Activity} label="Habits" to="/habits" isActive={location.pathname === '/habits'} />
          <SidebarItem icon={Clock} label="Focus Mode" to="/focus" isActive={location.pathname === '/focus'} />
          <SidebarItem icon={TrendingUp} label="Analytics" to="/analytics" isActive={location.pathname === '/analytics'} />
        </nav>

        <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/40 space-y-1">
          <SidebarItem icon={Settings} label="Settings" to="/settings" isActive={location.pathname === '/settings'} />
          <button 
            onClick={toggleTheme}
            className="relative flex items-center gap-3 w-full px-4 py-3 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 rounded-xl transition-all duration-200 outline-none"
          >
            {isDark ? <Sun className="w-5 h-5 text-zinc-400" strokeWidth={2} /> : <Moon className="w-5 h-5 text-zinc-600" strokeWidth={2} />}
            <span className="text-[15px] font-medium">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Navbar */}
        <header className="h-[72px] bg-white/70 dark:bg-[#000000]/70 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-between px-8 z-10 sticky top-0">
          <div className="flex items-center text-sm text-zinc-500 dark:text-zinc-400 font-medium capitalize tracking-wide">
            {location.pathname === '/' ? 'Dashboard Overview' : location.pathname.substring(1)}
          </div>
          <div className="flex items-center gap-5">
            <NotificationBell />
            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-600 dark:from-zinc-300 dark:to-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-white dark:text-zinc-900 font-bold text-sm transition-transform group-hover:scale-105">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-3 w-56 glass-panel opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 transform origin-top-right group-hover:translate-y-0 translate-y-2">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/60">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{user?.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors font-medium"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content - No more AnimatePresence remounting! */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-primary-500/5 dark:from-primary-500/10 to-transparent pointer-events-none -z-10" />
          <div className="max-w-[1200px] mx-auto w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
