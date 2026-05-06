import { GoogleGenerativeAI } from '@google/generative-ai';
import Task from '../models/Task.js';

// Initialize Gemini API
// Note: In production, ensure process.env.GEMINI_API_KEY is set
const getAIModel = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

// @desc    Generate Smart Daily Schedule
// @route   POST /api/ai/schedule
// @access  Private
export const generateSmartSchedule = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Gather Context (Pending tasks)
    const pendingTasks = await Task.find({ user: userId, status: { $ne: 'completed' } });

    if (pendingTasks.length === 0) {
      return res.status(200).json({ message: "You have no pending tasks! Enjoy your day." });
    }

    // 2. Prompt Engineering
    const taskDescriptions = pendingTasks.map(t => `- ${t.title} (Priority: ${t.priority}, Category: ${t.category})`).join('\n');
    
    const prompt = `
      You are an expert AI Productivity Coach.
      Your client needs an optimized daily schedule.
      
      Here are their pending tasks:
      ${taskDescriptions}
      
      RULES:
      1. Prioritize 'urgent' and 'high' priority tasks for the morning (peak cognitive hours).
      2. Group similar categories together to reduce context switching.
      3. Recommend a time-block for each task.
      4. Keep the output concise, structured, and highly motivating.
      5. DO NOT use markdown code blocks, just return a clean string or structured text.
    `;

    // 3. AI Execution & Token Handling
    let aiResponse = "";
    try {
      const model = getAIModel();
      const result = await model.generateContent(prompt);
      aiResponse = result.response.text();
    } catch (aiError) {
      console.error("AI Generation Error:", aiError);
      // Fallback response if API key is missing or invalid
      aiResponse = "Your AI Coach is currently resting. Please check your API configuration. In the meantime, focus on your High Priority tasks first!";
    }

    res.status(200).json({ schedule: aiResponse });
  } catch (error) {
    next(error);
  }
};

// @desc    Get AI Coaching Advice based on current state
// @route   GET /api/ai/coach
// @access  Private
export const getCoachingAdvice = async (req, res, next) => {
  try {
    // Basic context for the prompt
    const prompt = `
      You are an elite productivity coach like David Goggins meets James Clear.
      Give a very short, punchy (2 sentences max) piece of advice to a user who is trying to stay focused today.
      No pleasantries, just action.
    `;

    let advice = "";
    try {
      const model = getAIModel();
      const result = await model.generateContent(prompt);
      advice = result.response.text();
    } catch (error) {
      advice = "Discipline equals freedom. Start your hardest task right now.";
    }

    res.status(200).json({ advice });
  } catch (error) {
    next(error);
  }
};
