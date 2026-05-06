# FocusAI - SaaS Architecture & System Design
**Version:** 1.0.0
**Status:** COMPLETE / PRODUCTION-READY
**Tech Stack:** MERN (MongoDB, Express, React, Node.js), Vite, Tailwind CSS, Framer Motion, Google Gemini API

## 1. Complete Architecture Overview
The application follows a modern decoupled Client-Server architecture utilizing the MERN stack (MongoDB, Express.js, React.js, Node.js) with an additional AI micro-service integration layer.

- **Frontend (Client Layer)**: React.js SPA, built with Vite for optimized bundling. Uses Tailwind CSS + Framer Motion for modern, performant, and glassmorphic UI. Recharts handles complex data visualization (streaks, focus graphs).
- **Backend (API Layer)**: Express.js RESTful API running on Node.js. Handles business logic, AI orchestration, validation, and database operations.
- **Database (Data Layer)**: MongoDB Atlas (NoSQL) for highly flexible, document-based storage that scales easily as user data grows. Mongoose ODM ensures schema validation.
- **AI Integration Layer**: Interacts with the OpenAI/Gemini API to provide the Productivity Coach, intelligent scheduling, and burnout predictions.

## 2. Database Schema (MongoDB / Mongoose)

### `User` Collection
- `_id`: ObjectId
- `name`: String (Required)
- `email`: String (Required, Unique, Indexed)
- `passwordHash`: String
- `preferences`: Object (Theme, Notification settings, Focus duration)
- `productivityScore`: Number (Default: 0)
- `currentStreak`: Number (Default: 0)
- `createdAt`, `updatedAt`: Timestamps

### `Task` Collection
- `_id`: ObjectId
- `userId`: ObjectId (Ref: User, Indexed)
- `title`: String
- `description`: String
- `status`: Enum ['todo', 'in_progress', 'completed']
- `priority`: Enum ['low', 'medium', 'high', 'urgent']
- `category`: String (e.g., 'Work', 'Personal')
- `deadline`: Date
- `aiOptimized`: Boolean (Flag if AI suggested/optimized the task)
- `createdAt`, `updatedAt`: Timestamps

### `Habit` Collection
- `_id`: ObjectId
- `userId`: ObjectId (Ref: User, Indexed)
- `title`: String
- `frequency`: Enum ['daily', 'weekly']
- `streak`: Number
- `lastCompleted`: Date
- `recoveryAvailable`: Boolean
- `createdAt`, `updatedAt`: Timestamps

### `FocusSession` Collection
- `_id`: ObjectId
- `userId`: ObjectId (Ref: User, Indexed)
- `startTime`: Date
- `endTime`: Date
- `durationInMinutes`: Number
- `distractionsLogged`: Number
- `sessionType`: Enum ['pomodoro', 'deep_work']

## 3. API Flow & Routing Structure

### Authentication API (`/api/v1/auth`)
- `POST /register`: Create user -> Hash password -> Issue JWT.
- `POST /login`: Verify credentials -> Issue JWT.
- `GET /me`: Return current user context based on JWT.

### Dashboard & Analytics API (`/api/v1/analytics`)
- `GET /dashboard`: Aggregates today's tasks, habits, productivity score, and streak data.
- `GET /insights`: Returns weekly charts, focus graphs, and burnout detection logic.

### Task API (`/api/v1/tasks`)
- `GET /`: Fetch user tasks (supports filters, pagination).
- `POST /`: Create new task.
- `PUT /:id`: Update task (including drag-and-drop status/priority updates).
- `DELETE /:id`: Delete task.

### Habit Tracker API (`/api/v1/habits`)
- `GET /`: List habits.
- `POST /`: Create habit.
- `POST /:id/log`: Log completion (triggers streak engine).
- `POST /:id/recover`: Trigger streak recovery logic.

### AI Integration API (`/api/v1/ai`)
- `POST /recommend`: Sends user's context (tasks, habits, focus data) to LLM -> Returns productivity suggestions.
- `POST /schedule`: Sends pending tasks to LLM -> Returns optimal daily plan based on user's peak focus hours.

## 4. Frontend/Backend Workflow

1. **Authentication & Session:**
   - User signs in via React App.
   - Express backend verifies and returns a JWT (stored in an HttpOnly cookie or secure local storage).
   - React Router mounts protected routes and populates global context/Zustand store with user data.
2. **Data Hydration (Dashboard Load):**
   - Frontend calls `GET /dashboard`.
   - Backend aggregates Data (Tasks due today + Habits + Productivity Score).
   - Frontend displays data using Recharts and Framer Motion for entry animations.
3. **Interactive Actions (e.g., Drag & Drop Task):**
   - User drags a task from "To Do" to "In Progress".
   - Frontend updates UI optimistically.
   - Frontend fires async `PUT /tasks/:id` with new status.
   - On failure, frontend reverts UI and shows toast notification.
4. **AI Generation (Smart Scheduling):**
   - User clicks "Auto-Schedule Day".
   - Frontend fires `POST /ai/schedule`.
   - Backend queries pending tasks, formats prompt, calls OpenAI/Gemini API.
   - Backend parses LLM response into structured JSON, updates database, and returns new schedule.
   - Frontend visualizes the new schedule.

## 5. Feature Interaction System
- **Focus Mode <-> Analytics**: Completing a Pomodoro session automatically writes to `FocusSession` collection, which immediately updates the daily productivity score and burnout risk metric.
- **Habits <-> Streaks**: Completing daily habits increments the streak. Failing to complete them reduces the streak unless a 'Recovery' item is used (Duolingo-style mechanic).
- **Tasks <-> AI Coach**: If a user is repeatedly missing task deadlines, the AI Coach identifies the pattern (burnout detection) and suggests splitting the task or taking a break.

## 6. Scalable SaaS Architecture Considerations
- **Separation of Concerns**: Controllers only handle HTTP flow, Services handle business logic, Models handle DB interactions.
- **Rate Limiting**: Prevent abuse on Authentication and costly AI API routes using `express-rate-limit`.
- **Security**: Helmet.js for headers, CORS configured for the specific frontend domain, bcrypt for passwords, environment variables for secrets.
- **Pagination & Indexing**: Database queries on `userId` will be indexed. List endpoints will utilize cursor or skip/limit pagination to ensure fast load times.
- **Modular Frontend**: Components will be highly isolated (e.g., `<Button />`, `<Card />`) to maintain a clean and consistent UI system across the app.
