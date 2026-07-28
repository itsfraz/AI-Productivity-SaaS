import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, Calendar, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced semantic search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (error) {
        console.error('Semantic search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] sm:pt-[15vh]">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Palette */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-dark-card shadow-2xl rounded-2xl overflow-hidden border border-gray-100 dark:border-dark-border"
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-dark-border/50">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input 
              ref={inputRef}
              type="text"
              placeholder="Search tasks by meaning..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder-gray-400 text-lg"
            />
            {isSearching && (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
            )}
            <div className="ml-3 px-2 py-1 bg-gray-100 dark:bg-dark-bg text-xs text-gray-500 dark:text-gray-400 rounded">
              ESC
            </div>
          </div>

          {/* Results Area */}
          <div className="max-h-96 overflow-y-auto p-2">
            {!query.trim() ? (
              <div className="py-12 text-center flex flex-col items-center justify-center text-gray-500">
                <Sparkles className="w-8 h-8 text-primary-300 dark:text-primary-800 mb-3" />
                <p>Try searching for concepts like "budget stuff" or "next week"</p>
                <p className="text-xs mt-1 text-gray-400">Powered by AI Semantic Search</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Relevant Tasks
                </div>
                {results.map((task) => (
                  <div 
                    key={task._id}
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/tasks'); // In a real app, maybe highlight or open the specific task modal
                    }}
                    className="flex items-start p-3 hover:bg-primary-50 dark:hover:bg-primary-900/10 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="mt-1 mr-3 p-1.5 bg-gray-100 dark:bg-dark-bg rounded-lg group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30">
                      <CheckSquare className="w-4 h-4 text-gray-500 group-hover:text-primary-500" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                          {task.description}
                        </div>
                      )}
                    </div>
                    {task.deadline && (
                      <div className="flex items-center text-xs text-gray-400">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(task.deadline).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : !isSearching ? (
              <div className="py-12 text-center text-gray-500">
                No semantically relevant tasks found.
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CommandPalette;
