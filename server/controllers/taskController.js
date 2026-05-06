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

    // Optimized query: sort by deadline and priority
    const tasks = await Task.find(query).sort({ deadline: 1, createdAt: -1 });
    
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
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    // Ensure the user owns the task
    if (task.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this task');
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

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
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404);
      throw new Error('Task not found');
    }

    if (task.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this task');
    }

    await task.deleteOne();
    res.status(200).json({ id: req.params.id });
  } catch (error) {
    next(error);
  }
};
