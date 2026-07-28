import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Frown, Coffee, BrainCircuit, Activity, Sparkles, Info } from 'lucide-react';
import api from '../services/api';

const SHORT_BREAK = 5 * 60; // 5 minutes

const FocusPage = () => {
  const [focusDuration, setFocusDuration] = useState(25 * 60);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [distractions, setDistractions] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState(null);
  
  // Track start time to log session correctly
  const sessionStartTime = useRef(null);

  useEffect(() => {
    fetchAnalytics();
    fetchRecommendation();
  }, []);

  const fetchRecommendation = async () => {
    try {
      const { data } = await api.get('/ai/focus-recommendation');
      setAiRecommendation(data);
      
      const savedOverride = localStorage.getItem('focusDurationOverride');
      if (savedOverride) {
        const dur = parseInt(savedOverride, 10) * 60;
        setFocusDuration(dur);
        if (!isActive && !isBreak) setTimeLeft(dur);
      } else if (data && data.duration) {
        const dur = data.duration * 60;
        setFocusDuration(dur);
        if (!isActive && !isBreak) setTimeLeft(dur);
      }
    } catch (error) {
      console.error('Failed to fetch AI recommendation');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/focus');
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch focus analytics');
    }
  };

  useEffect(() => {
    let interval = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      clearInterval(interval);
      handleSessionEnd();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleSessionEnd = async () => {
    setIsActive(false);
    
    // Play sound (conceptually)
    // new Audio('/ding.mp3').play();
    
    if (!isBreak) {
      // Save session to backend
      const endTime = new Date();
      try {
        await api.post('/focus', {
          startTime: sessionStartTime.current || new Date(Date.now() - focusDuration * 1000),
          endTime,
          durationInMinutes: Math.round(focusDuration / 60),
          distractionsLogged: distractions,
          sessionType: 'pomodoro'
        });
        
        // Refresh analytics
        fetchAnalytics();
        
      } catch (error) {
        console.error('Failed to log session');
      }
      
      // Auto-start break
      setIsBreak(true);
      setTimeLeft(SHORT_BREAK);
    } else {
      // Break is over, back to work
      setIsBreak(false);
      setTimeLeft(focusDuration);
      setDistractions(0);
    }
  };

  const toggleTimer = () => {
    if (!isActive && !isBreak && timeLeft === focusDuration) {
      sessionStartTime.current = new Date();
    }
    setIsActive(!isActive);
  };

  const stopTimer = () => {
    setIsActive(false);
    setIsBreak(false);
    setTimeLeft(focusDuration);
    setDistractions(0);
    sessionStartTime.current = null;
  };

  const handleDurationChange = (e) => {
    const newDuration = parseInt(e.target.value, 10);
    setFocusDuration(newDuration * 60);
    if (!isActive && !isBreak) {
      setTimeLeft(newDuration * 60);
    }
    localStorage.setItem('focusDurationOverride', newDuration.toString());
  };

  const logDistraction = () => {
    if (isActive && !isBreak) {
      setDistractions(d => d + 1);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate circular progress
  const totalDuration = isBreak ? SHORT_BREAK : focusDuration;
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div className="space-y-8">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Focus Mode</h1>
        <p className="text-gray-500 dark:text-dark-muted mt-1">Eliminate distractions and get deep work done.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Timer Section */}
        <div className="lg:col-span-2 glass-card p-8 flex flex-col items-center justify-center min-h-[500px]">
          
          <div className="flex flex-col gap-4 mb-10 w-full max-w-md">
            <div className="flex gap-4 justify-center">
              <button 
                onClick={() => { setIsBreak(false); setTimeLeft(focusDuration); setIsActive(false); }}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${!isBreak ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-dark-border dark:text-gray-300'}`}
              >
                Focus
              </button>
              <button 
                onClick={() => { setIsBreak(true); setTimeLeft(SHORT_BREAK); setIsActive(false); }}
                className={`px-4 py-2 rounded-full font-medium transition-colors ${isBreak ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 dark:bg-dark-border dark:text-gray-300'}`}
              >
                Short Break
              </button>
            </div>

            {!isBreak && (
              <div className="flex flex-col gap-2 mt-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Session Length: {Math.round(focusDuration / 60)} min
                  </label>
                  {aiRecommendation && (
                    <div className="group relative flex items-center gap-1 text-xs font-semibold text-primary-600 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded-full cursor-pointer">
                      <Sparkles className="w-3 h-3" />
                      AI-Tuned for You
                      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                        <div className="font-bold mb-1">Recommended Time: {aiRecommendation.timeOfDay}</div>
                        <div>{aiRecommendation.reason}</div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="120" 
                  step="5"
                  disabled={isActive}
                  value={Math.round(focusDuration / 60)} 
                  onChange={handleDurationChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-dark-border accent-primary-500 disabled:opacity-50"
                />
              </div>
            )}
          </div>

          {/* Circular Timer UI */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-10">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-dark-border" />
              <circle 
                cx="128" cy="128" r="120" 
                stroke="currentColor" 
                strokeWidth="8" 
                fill="transparent" 
                strokeDasharray={2 * Math.PI * 120} 
                strokeDashoffset={2 * Math.PI * 120 * (1 - progressPercent / 100)} 
                className={`transition-all duration-1000 ease-linear ${isBreak ? 'text-blue-500' : 'text-primary-500'}`} 
                strokeLinecap="round"
              />
            </svg>
            <div className="text-center z-10">
              <h2 className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter tabular-nums">
                {formatTime(timeLeft)}
              </h2>
              <p className="text-sm font-medium text-gray-500 dark:text-dark-muted mt-2 uppercase tracking-widest">
                {isBreak ? 'Resting' : isActive ? 'Deep Work' : 'Paused'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTimer}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-transform active:scale-95 ${isActive ? 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600' : 'bg-primary-500 hover:bg-primary-600'}`}
            >
              {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
            <button 
              onClick={stopTimer}
              disabled={timeLeft === focusDuration && !isBreak}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-dark-border text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <Square className="w-5 h-5 fill-current" />
            </button>
          </div>

        </div>

        {/* Side Panel: Distractions & Analytics */}
        <div className="space-y-6">
          
          {/* Distraction Logger */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass-card p-6 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border-orange-100 dark:border-orange-900/30"
          >
            <div className="flex items-center gap-3 mb-4">
              <Frown className="w-6 h-6 text-orange-500" />
              <h3 className="font-bold text-gray-900 dark:text-white">Log Distraction</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Urge to check your phone? Log it instead to stay accountable.
            </p>
            <button 
              onClick={logDistraction}
              disabled={!isActive || isBreak}
              className="w-full py-2 bg-orange-100 hover:bg-orange-200 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 text-orange-700 dark:text-orange-400 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              I got distracted ({distractions})
            </button>
          </motion.div>

          {/* Session Analytics */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Your Focus Stats
            </h3>
            
            {analytics ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4" /> Total Focus Time
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {Math.round(analytics.totalFocusMinutes / 60 * 10) / 10} hrs
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Coffee className="w-4 h-4" /> Sessions Completed
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {analytics.totalSessions}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Frown className="w-4 h-4" /> Total Distractions
                  </span>
                  <span className="font-bold text-orange-500">
                    {analytics.totalDistractions}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500">Loading stats...</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default FocusPage;
