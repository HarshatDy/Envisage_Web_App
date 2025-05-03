# Envisage Backend Server

This is the backend server for the Envisage application. It provides API endpoints for the frontend to interact with the MongoDB database.

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Create `.env.local` file:
   ```
   cp .env.local.example .env.local
   ```

3. Update the `.env.local` file with your MongoDB connection details and other configuration.

## Running the Server

For production:
```
npm start
```

For development with auto-restart:

On Unix/Mac:
```
npm run dev
```

On Windows:
```
npm run dev:windows
```

## Available API Endpoints

- `GET /api/test` - Test if server is running
- `GET /api/collections` - List all collections
- `GET /api/gemini-document` - Get Gemini document with Summary field
- `GET /api/news` - Get news with optional category, pagination
- `GET /api/:collection/:id` - Get document by ID from any collection
- `POST /api/:collection/query` - Query collection with filters
- `POST /api/:collection/aggregate` - Run aggregation pipeline on collection
- `POST /api/users` - Create a new user
- `GET /api/users` - Get all users (with pagination)
- `GET /api/users/:id` - Get a single user
- `PUT /api/users/:id` - Update a user
- `DELETE /api/users/:id` - Delete a user (or mark as inactive)
- `GET /api/users/:id/stats` - Get user stats
- `PUT /api/users/:id/stats` - Update user stats
- `POST /api/users/:id/daily-stats` - Add daily stats for a user
- `POST /api/users/:userId/interactions` - Record user interaction with an article
- `GET /api/users/:userId/interactions` - Get user interactions (with pagination)
- `POST /api/articles/:id/view` - Increment article view count
- `GET /api/envisage_web` - Fetch data from envisage_web collection
- `POST /api/envisage_web/view` - Increment view count for an item in envisage_web
- `GET /api/envisage_web/all` - Get all documents from envisage_web collection
