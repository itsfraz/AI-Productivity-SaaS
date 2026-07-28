import { callAI } from '../config/ai.js';
import Task from '../models/Task.js';

// Note: This is a naive MVP for semantic search. 
// Sending full task lists to the LLM on every search won't scale.
// Recommend migrating to a proper embedding-based vector search 
// (e.g. MongoDB Atlas Vector Search or pgvector) once task volume grows.
export const semanticSearch = async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.trim().length === 0) {
      return res.status(200).json([]);
    }

    const tasks = await Task.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);

    if (tasks.length === 0) {
      return res.status(200).json([]);
    }

    const taskData = tasks.map(t => ({
      id: t._id,
      title: t.title,
      description: t.description || ""
    }));

    const prompt = `
You are a highly intelligent semantic search engine. The user is searching for: "${query}".
Here are the user's tasks:
${JSON.stringify(taskData)}

Identify the tasks that are most semantically relevant to the user's search query. Rank them from most relevant to least relevant. It is very important that you find tasks by meaning, not just exact keyword match.
Return ONLY a JSON array of the IDs (string) of the relevant tasks. If no tasks are relevant, return an empty array. Do not return any other text.
`;

    const response = await callAI({
      messages: [{ role: "user", content: prompt }],
    });
    const rawText = response.choices[0].message.content;
    let relevantIds = [];
    try {
      relevantIds = JSON.parse(rawText);
      if (!Array.isArray(relevantIds)) {
        relevantIds = [];
      }
    } catch (e) {
      relevantIds = [];
    }

    // Map IDs back to tasks, preserving order
    const relevantTasks = [];
    for (const id of relevantIds) {
      const task = tasks.find(t => t._id.toString() === id);
      if (task) {
        relevantTasks.push(task);
      }
    }

    res.status(200).json(relevantTasks);
  } catch (error) {
    console.error("Semantic Search Error:", error);
    res.status(500).json({ error: "Failed to perform semantic search" });
  }
};
