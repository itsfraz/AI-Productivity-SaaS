import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const QUICK_ACTIONS = [
  "Plan my day",
  "How am I doing?",
  "Suggest a habit"
];

const ChatAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  useEffect(() => {
    const savedId = localStorage.getItem('focusai_conversationId');
    if (savedId) {
      setConversationId(savedId);
      api.get(`/ai/chat/${savedId}`)
        .then(res => {
          if (res.data && res.data.messages) {
            const uiMessages = [];
            res.data.messages.forEach(m => {
               if (m.role === 'user' && m.parts[0].text) {
                 uiMessages.push({ id: Math.random(), role: 'user', content: m.parts[0].text });
               } else if (m.role === 'model') {
                 if (m.parts[0].text) {
                   uiMessages.push({ id: Math.random(), role: 'ai', content: m.parts[0].text });
                 } else if (m.parts[0].functionCall) {
                   uiMessages.push({ id: Math.random(), role: 'tool', name: m.parts[0].functionCall.name, args: m.parts[0].functionCall.args });
                 }
               }
            });
            setMessages(uiMessages);
          }
        })
        .catch(err => {
          console.error(err);
          localStorage.removeItem('focusai_conversationId');
          setMessages([{ id: 'init', role: 'ai', content: "Hi! I'm your AI Productivity Assistant. How can I help you focus today?" }]);
        });
    } else {
      setMessages([{ id: 'init', role: 'ai', content: "Hi! I'm your AI Productivity Assistant. How can I help you focus today?" }]);
    }
  }, []);

  const handleSend = async (textOverride) => {
    const text = textOverride || input;
    if (!text.trim() || isStreaming) return;
    
    setInput('');
    setMessages(prev => [...prev, { id: Math.random(), role: 'user', content: text }]);
    setIsStreaming(true);
    setStreamingText('');

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: text, conversationId }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let currentAItext = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'text') {
              currentAItext += data.content;
              setStreamingText(currentAItext);
            } else if (data.type === 'tool_call') {
              setMessages(prev => [...prev, { id: Math.random(), role: 'tool', name: data.name, args: data.args }]);
              // Optimistically invalidate queries depending on tool
              if (data.name.includes('Task')) {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
              }
              if (data.name.includes('Habit')) {
                queryClient.invalidateQueries({ queryKey: ['habits'] });
              }
            } else if (data.type === 'done') {
              if (data.conversationId && !conversationId) {
                setConversationId(data.conversationId);
                localStorage.setItem('focusai_conversationId', data.conversationId);
              }
            } else if (data.type === 'error') {
              setMessages(prev => [...prev, { id: Math.random(), role: 'ai', content: `Error: ${data.error}` }]);
            }
          }
        }
      }

      if (currentAItext) {
        setMessages(prev => [...prev, { id: Math.random(), role: 'ai', content: currentAItext }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { id: Math.random(), role: 'ai', content: "Sorry, I encountered an error connecting to the server." }]);
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  const renderToolMessage = (msg) => {
    let text = `Used tool: ${msg.name}`;
    if (msg.name === 'createTask') text = `Created task: ${msg.args.title}`;
    if (msg.name === 'updateTaskStatus') text = `Updated task status to ${msg.args.status}`;
    if (msg.name === 'createHabit') text = `Created habit: ${msg.args.title}`;
    if (msg.name === 'logFocusSession') text = `Logged focus session: ${msg.args.durationInMinutes} mins`;
    if (msg.name === 'getProductivitySummary') text = `Fetched productivity summary`;

    return (
      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg text-sm font-medium my-2 border border-green-200 dark:border-green-800/30 w-fit max-w-[85%] self-start">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <span>{text}</span>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary-500/30 hover:scale-105 transition-transform z-40"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-40 lg:hidden"
            />
            
            <motion.div
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-[#09090b] border-l border-zinc-200 dark:border-zinc-800 z-50 flex flex-col shadow-2xl"
            >
              <div className="h-[72px] border-b border-zinc-200/50 dark:border-zinc-800/40 flex items-center justify-between px-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">AI Assistant</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4">
                {messages.map((msg, idx) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.role === 'tool' ? (
                      renderToolMessage(msg)
                    ) : (
                      <div className={`p-3 rounded-2xl max-w-[85%] text-[15px] leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary-600 text-white rounded-tr-sm' 
                          : 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 rounded-tl-sm border border-zinc-200/50 dark:border-zinc-700/30'
                      }`}>
                        {msg.content}
                      </div>
                    )}
                  </div>
                ))}
                
                {isStreaming && (
                  <div className="flex flex-col items-start">
                    <div className="p-3 rounded-2xl max-w-[85%] text-[15px] leading-relaxed bg-zinc-100 dark:bg-zinc-800/60 text-zinc-800 dark:text-zinc-200 rounded-tl-sm border border-zinc-200/50 dark:border-zinc-700/30">
                      {streamingText || (
                        <div className="flex gap-1 items-center h-5">
                          <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                          <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                          <motion.div className="w-1.5 h-1.5 bg-zinc-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-zinc-200/50 dark:border-zinc-800/40 bg-white/50 dark:bg-[#09090b]/50 backdrop-blur-md">
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3 mb-1">
                  {QUICK_ACTIONS.map(action => (
                    <button 
                      key={action}
                      onClick={() => handleSend(action)}
                      disabled={isStreaming}
                      className="whitespace-nowrap px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
                    >
                      {action}
                    </button>
                  ))}
                </div>
                
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="relative flex items-center"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask me to create a task..."
                    disabled={isStreaming}
                    className="w-full bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-xl pl-4 pr-12 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-zinc-400"
                  />
                  <button 
                    type="submit"
                    disabled={!input.trim() || isStreaming}
                    className="absolute right-2 p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatAssistant;
