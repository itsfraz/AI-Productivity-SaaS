import Task from '../models/Task.js';

// @desc    Get all tasks for logged in user (with filters)
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const { status, priority, category } = req.query;
    let query = { user: req.user._id };

    // Apply Filters if provided
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;

    // .lean() returns plain JS objects instead of Mongoose docs — much faster
    const tasks = await Task.find(query)
      .sort({ deadline: 1, createdAt: -1 })
      .lean();
    
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
export const createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, category, deadline } = req.body;

    const task = await Task.create({
      user: req.user._id,
      title,
      description,
      status,
      priority,
      category,
      deadline
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task (including drag & drop status updates)
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = async (req, res, next) => {
  try {
    // Single query: find by id + user ownership, and update atomically
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      res.status(404);
      throw new Error('Task not found or not authorized');
    }

    res.status(200).json(updatedTask);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = async (req, res, next) => {
  try {
    // Single query: find + delete atomically with ownership check
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!task) {
      res.status(404);
      throw new Error('Task not found or not authorized');
    }

    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};
