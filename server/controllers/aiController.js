import { callAI } from '../config/ai.js';
import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import FocusSession from '../models/FocusSession.js';
import Conversation from '../models/Conversation.js';
import WeeklyReport from '../models/WeeklyReport.js';
import User from '../models/User.js';
import { z } from 'zod';

const intentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("task"),
    title: z.string(),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    category: z.string().default("Work"),
    deadline: z.string().optional()
  }),
  z.object({
    type: z.literal("habit"),
    title: z.string(),
    frequency: z.enum(["daily", "weekly"])
  })
]);

const getOpenAITools = () => {
  return [
    {
      type: "function",
      function: {
        name: "createTask",
        description: "Create a new task for the user.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "The task title" },
            priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Task priority" },
            category: { type: "string", description: "Category of the task (e.g. Work, Personal)" },
            deadline: { type: "string", description: "ISO 8601 date string for the deadline" }
          },
          required: ["title"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "updateTaskStatus",
        description: "Update the status of an existing task.",
        parameters: {
          type: "object",
          properties: {
            taskId: { type: "string", description: "The ID of the task" },
            status: { type: "string", enum: ["todo", "in-progress", "completed"], description: "The new status" }
          },
          required: ["taskId", "status"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "createHabit",
        description: "Create a new habit to track.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "The habit title" },
            frequency: { type: "string", enum: ["daily", "weekly"], description: "How often to complete the habit" }
          },
          required: ["title"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "logFocusSession",
        description: "Log a completed focus session.",
        parameters: {
          type: "object",
          properties: {
            durationInMinutes: { type: "number", description: "Duration in minutes" },
            sessionType: { type: "string", enum: ["pomodoro", "deep_work"], description: "Type of focus session" }
          },
          required: ["durationInMinutes"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "getProductivitySummary",
        description: "Get a summary of the user's tasks and habits.",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      }
    }
  ];
};

const executeTool = async (functionCall, userId) => {
  const { name, arguments: argsJson } = functionCall;
  const args = JSON.parse(argsJson || "{}");
  switch (name) {
    case 'createTask': {
      const task = await Task.create({ ...args, user: userId });
      return { success: true, task };
    }
    case 'updateTaskStatus': {
      const task = await Task.findOneAndUpdate(
        { _id: args.taskId, user: userId },
        { status: args.status },
        { new: true }
      );
      return { success: true, task };
    }
    case 'createHabit': {
      const habit = await Habit.create({ ...args, user: userId });
      return { success: true, habit };
    }
    case 'logFocusSession': {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - args.durationInMinutes * 60000);
      const session = await FocusSession.create({
        user: userId,
        durationInMinutes: args.durationInMinutes,
        sessionType: args.sessionType || 'pomodoro',
        startTime,
        endTime
      });
      return { success: true, session };
    }
    case 'getProductivitySummary': {
      const tasks = await Task.find({ user: userId, status: { $ne: 'completed' } });
      const completedTasks = await Task.countDocuments({ user: userId, status: 'completed' });
      const habits = await Habit.find({ user: userId });
      return {
        pendingTasks: tasks.length,
        pendingTasksList: tasks.map(t => ({ id: t._id, title: t.title, priority: t.priority })),
        completedTasks,
        habits: habits.map(h => ({ id: h._id, title: h.title, streak: h.streak }))
      };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
};

export const chatWithAI = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { message, conversationId } = req.body;
    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let conversation = null;
    if (conversationId) {
      conversation = await Conversation.findOne({ _id: conversationId, user: userId });
    }
    if (!conversation) {
      conversation = await Conversation.create({ user: userId, messages: [] });
    }

    conversation.messages.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Map DB history to OpenAI format
    const messages = [
      { role: "system", content: "You are a productivity AI assistant. Use function calls to interact with the user's tasks and habits. Be concise." }
    ];

    const recentMessages = conversation.messages.slice(-20);
    for (const msg of recentMessages) {
      if (msg.role === 'user') {
        messages.push({ role: "user", content: msg.parts[0].text });
      } else if (msg.role === 'model') {
        if (msg.parts[0].text) {
          messages.push({ role: "assistant", content: msg.parts[0].text });
        } else if (msg.parts[0].functionCall) {
          messages.push({ 
            role: "assistant", 
            content: null,
            tool_calls: [{
              id: "call_" + msg.parts[0].functionCall.name,
              type: "function",
              function: {
                name: msg.parts[0].functionCall.name,
                arguments: JSON.stringify(msg.parts[0].functionCall.args || {})
              }
            }]
          });
        }
      } else if (msg.role === 'function') {
        messages.push({
          role: "tool",
          tool_call_id: "call_" + msg.parts[0].functionResponse.name,
          content: JSON.stringify(msg.parts[0].functionResponse.response)
        });
      }
    }

    const tools = getOpenAITools();

    const { stream } = await callAI({
      messages,
      tools,
      stream: true,
    });

    let fullText = '';
    let toolCallName = '';
    let toolCallArgs = '';
    let hasToolCall = false;

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      if (delta.content) {
        fullText += delta.content;
        res.write(`data: ${JSON.stringify({ type: 'text', content: delta.content })}\n\n`);
      }

      if (delta.tool_calls && delta.tool_calls.length > 0) {
        hasToolCall = true;
        const toolCall = delta.tool_calls[0];
        if (toolCall.function?.name) toolCallName += toolCall.function.name;
        if (toolCall.function?.arguments) toolCallArgs += toolCall.function.arguments;
      }
    }

    let finalFunctionCall = null;
    let finalFunctionResponse = null;

    if (hasToolCall && toolCallName) {
      finalFunctionCall = { name: toolCallName, arguments: toolCallArgs };
      let parsedArgs = {};
      try { parsedArgs = JSON.parse(toolCallArgs); } catch(e) {}
      
      res.write(`data: ${JSON.stringify({ type: 'tool_call', name: toolCallName, args: parsedArgs })}\n\n`);
      
      let toolResult;
      try {
        toolResult = await executeTool(finalFunctionCall, userId);
      } catch (err) {
        toolResult = { error: err.message };
      }

      finalFunctionResponse = {
        name: toolCallName,
        response: toolResult
      };

      messages.push({
        role: "assistant",
        content: null,
        tool_calls: [{
          id: "call_" + toolCallName,
          type: "function",
          function: { name: toolCallName, arguments: toolCallArgs }
        }]
      });
      messages.push({
        role: "tool",
        tool_call_id: "call_" + toolCallName,
        content: JSON.stringify(toolResult)
      });

      const { stream: secondStream } = await callAI({
        messages,
        stream: true,
      });

      for await (const chunk of secondStream) {
        const delta = chunk.choices[0]?.delta;
        if (delta && delta.content) {
          fullText += delta.content;
          res.write(`data: ${JSON.stringify({ type: 'text', content: delta.content })}\n\n`);
        }
      }
    }

    // Save history matching Gemini DB schema format
    if (hasToolCall && toolCallName) {
      let parsedArgs = {};
      try { parsedArgs = JSON.parse(toolCallArgs); } catch(e) {}
      
      conversation.messages.push({
        role: 'model',
        parts: [{ functionCall: { name: toolCallName, args: parsedArgs } }]
      });
      conversation.messages.push({
        role: 'function',
        parts: [{ functionResponse: finalFunctionResponse }]
      });
    }

    if (fullText) {
      conversation.messages.push({
        role: 'model',
        parts: [{ text: fullText }]
      });
    }

    await conversation.save();

    res.write(`data: ${JSON.stringify({ type: 'done', conversationId: conversation._id })}\n\n`);
    res.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  }
};

export const getConversationHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findOne({ _id: conversationId, user: req.user._id });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    res.status(200).json(conversation);
  } catch (error) {
    next(error);
  }
};

export const parseIntent = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const currentDate = new Date().toISOString();
    
    const prompt = `
You are an intent parser for a productivity app.
Parse the following text into a JSON object matching this schema exactly.
If it's a one-off action, it's a "task". If it's a recurring action, it's a "habit".
For tasks, resolve any relative dates (like "tomorrow", "next Friday") against the current date: ${currentDate}. Ensure deadline is an ISO 8601 date string. Priority defaults to "medium", but guess based on the text. Category defaults to "Work" or "Personal".
For habits, frequency must be "daily" or "weekly".

Schema:
{
  "type": "task" | "habit",
  "title": "string",
  "priority": "low" | "medium" | "high" | "urgent", // only if type is task
  "category": "string", // only if type is task
  "deadline": "string", // ISO 8601, optional, only if type is task
  "frequency": "daily" | "weekly" // only if type is habit
}

Text to parse: "${text}"
    `;

    let response = await callAI({
      messages: [{ role: "user", content: prompt }]
    });
    let rawText = response.choices[0].message.content;
    let parsedData;

    try {
      parsedData = JSON.parse(rawText);
      intentSchema.parse(parsedData);
    } catch (e) {
      // Retry once
      const retryPrompt = `${prompt}\n\nWARNING: Your previous response was invalid. Ensure it is strict JSON matching the schema. Error: ${e.message}`;
      response = await callAI({
        messages: [{ role: "user", content: retryPrompt }]
      });
      rawText = response.choices[0].message.content;
      parsedData = JSON.parse(rawText);
      intentSchema.parse(parsedData);
    }

    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Parse Intent Error:", error);
    res.status(500).json({ error: "Failed to parse intent" });
  }
};

export const getWeeklyReports = async (req, res, next) => {
  try {
    const reports = await WeeklyReport.find({ user: req.user._id }).sort({ weekStart: -1 });
    res.status(200).json(reports);
  } catch (error) {
    next(error);
  }
};

export const getWeeklyReportById = async (req, res, next) => {
  try {
    const report = await WeeklyReport.findOne({ _id: req.params.id, user: req.user._id });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.status(200).json(report);
  } catch (error) {
    next(error);
  }
};

export const breakdownTask = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findOne({ _id: taskId, user: req.user._id });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const prompt = `
You are a productivity expert. Break down the following task into 3 to 6 concrete, actionable subtasks.
Task Title: "${task.title}"
Task Description: "${task.description || 'None'}"
Category: "${task.category}"

Return a JSON array of objects matching exactly this schema:
[
  {
    "title": "Actionable subtask title",
    "estimatedMinutes": 15 // number
  }
]
    `;

    const response = await callAI({
      messages: [{ role: "user", content: prompt }]
    });
    const rawText = response.choices[0].message.content;
    const subtasks = JSON.parse(rawText);

    task.subtasks = subtasks.map(st => ({
      title: st.title,
      estimatedMinutes: st.estimatedMinutes,
      completed: false
    }));
    await task.save();

    res.status(200).json(task);
  } catch (error) {
    console.error("Task Breakdown Error:", error);
    res.status(500).json({ error: "Failed to break down task" });
  }
};

export const getFocusRecommendation = async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();

    // Check cache
    if (user.focusRecommendation && user.focusRecommendation.updatedAt) {
      const cacheAgeMs = now.getTime() - user.focusRecommendation.updatedAt.getTime();
      if (cacheAgeMs < 24 * 60 * 60 * 1000) {
        return res.status(200).json(user.focusRecommendation);
      }
    }

    const sessions = await FocusSession.find({ user: user._id })
      .sort({ startTime: -1 })
      .limit(20);

    const defaultRecommendation = {
      duration: 25,
      timeOfDay: 'Anytime',
      reason: 'Not enough data yet. Sticking to the classic 25-minute Pomodoro.'
    };

    if (sessions.length < 5) {
      return res.status(200).json(defaultRecommendation);
    }

    const sessionData = sessions.map(s => ({
      duration: s.durationInMinutes,
      distractions: s.distractionsLogged,
      type: s.sessionType,
      hourOfDay: new Date(s.startTime).getHours()
    }));

    const prompt = `
You are an AI productivity coach. Analyze the user's last ${sessions.length} focus sessions:
${JSON.stringify(sessionData)}

Based on this data, recommend:
1. An optimal session length (duration in minutes, e.g., 25, 45, 60, 90).
2. An optimal time-of-day window (e.g., "Morning (8AM-11AM)").
3. A one-sentence explanation for your recommendation based on when they have the least distractions or longest sessions.

Return ONLY a JSON object matching this schema:
{
  "duration": Number,
  "timeOfDay": String,
  "reason": String
}
    `;

    const response = await callAI({
      messages: [{ role: "user", content: prompt }],
      enable_thinking: true,
      temperature: 0.9
    });
    const rawText = response.choices[0].message.content;
    const recommendation = JSON.parse(rawText);

    // Save to user model
    const focusRecommendation = {
      duration: recommendation.duration,
      timeOfDay: recommendation.timeOfDay,
      reason: recommendation.reason,
      updatedAt: now
    };

    await User.findByIdAndUpdate(user._id, { focusRecommendation });

    res.status(200).json(focusRecommendation);
  } catch (error) {
    console.error("Focus Recommendation Error:", error);
    res.status(500).json({ error: "Failed to generate focus recommendation" });
  }
};
