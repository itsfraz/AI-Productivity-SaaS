import { useState, useEffect } from 'react';
import { Bell, Check, Trophy, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    // In production, use WebSockets (Socket.io) to listen for new notifications.
    // For MVP, polling every minute is an acceptable temporary substitute.
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'achievement': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'reminder': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'alert': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'ai_nudge': return <Sparkles className="w-5 h-5 text-primary-500" />;
      default: return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-gray-500 dark:text-dark-muted hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-dark-bg"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-80 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-gray-100 dark:border-dark-border z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 dark:border-dark-border flex items-center justify-between bg-gray-50/50 dark:bg-dark-bg/50">
                <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1">
                    <Check className="w-3 h-3" /> Mark all read
                  </button>
                )}
              </div>
              
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-dark-muted text-sm">
                    No new notifications
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-dark-border/50">
                    {notifications.map(notif => (
                      <div 
                        key={notif._id} 
                        onClick={() => { if(!notif.read) markAsRead(notif._id); }}
                        className={`p-4 flex items-start gap-3 transition-colors cursor-pointer ${notif.read ? 'opacity-60 bg-transparent' : (notif.type === 'ai_nudge' ? 'bg-primary-50/50 dark:bg-primary-900/20 hover:bg-primary-100/50 dark:hover:bg-primary-900/30' : 'bg-blue-50/30 dark:bg-zinc-800/50 hover:bg-gray-50 dark:hover:bg-dark-border/50')} ${notif.type === 'ai_nudge' ? 'border-l-2 border-primary-500' : ''}`}
                      >
                        <div className="mt-0.5">{getIcon(notif.type)}</div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{notif.title}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{notif.message}</p>
                          <span className="text-[10px] text-gray-400 dark:text-dark-muted mt-2 block">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5"></div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
