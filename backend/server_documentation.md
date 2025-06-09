# Server.js Documentation

## Overview
The `server.js` file is the main entry point for the backend application. It sets up the Express server, configures middleware, establishes database connections, and defines all API routes.

## Table of Contents
1. [Dependencies and Imports](#dependencies-and-imports)
2. [Environment Configuration](#environment-configuration)
3. [Server Setup](#server-setup)
4. [Database Models](#database-models)
5. [API Routes](#api-routes)
6. [Error Handling](#error-handling)
7. [Server Initialization](#server-initialization)

## Dependencies and Imports

```javascript
// Core dependencies
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

// Custom utilities
import { 
    connectToDatabase, 
    fetchFromCollection, 
    fetchPaginatedData, 
    fetchSingleDocument, 
    fetchWithAggregation 
} from './lib/mongodb.js';
```

## Environment Configuration

The server uses environment variables for configuration, loaded from `.env.local` file:

```javascript
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = resolve(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}
```

## Server Setup

### Express Configuration
```javascript
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
```

## Database Models

### User Schema
```javascript
const userSchema = new Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String },
    name: { type: String, required: true, trim: true },
    profilePicture: { type: String, default: '/images/default-avatar.png' },
    authProvider: { type: String, enum: ['email', 'google','github'], required: true },
    authProviderId: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
}, { timestamps: true });
```

### UserStats Schema
```javascript
const userStatsSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    totalTimeSpent: { type: Number, default: 0 },
    cardReadingTime: { type: Number, default: 0 },
    articlesRead: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now },
    dailyStats: [{
        date: { type: Date, required: true },
        timeSpent: { type: Number, default: 0 },
        articlesRead: { type: Number, default: 0 }
    }],
    categoryEngagement: { type: Map, of: { timeSpent: Number, articlesRead: Number }, default: {} }
}, { timestamps: true });
```

### Article Schema
```javascript
const articleSchema = new Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    summary: { type: String, trim: true },
    category: { type: String, required: true },
    dayTimeCategory: { type: String, enum: ['morning', 'afternoon', 'evening', 'night'], required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    publishDate: { type: Date, default: Date.now },
    viewCount: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 },
    averageReadTime: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
```

### UserArticleInteraction Schema
```javascript
const userArticleInteractionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
    documentId: { type: String },
    newsItems: [{
        newsItemId: { type: Number },
        timeSpent: { type: Number, default: 0 },
        completed: { type: Boolean, default: false },
        interactionDate: { type: Date, default: Date.now }
    }],
    timeSpent: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    interactionDate: { type: Date, default: Date.now }
}, { timestamps: true });
```

## API Routes

### User Management Routes

#### Create User
```javascript
app.post('/api/users', async (req, res) => {
    // Implementation details
    // - Validates required fields
    // - Checks for existing user
    // - Hashes password
    // - Creates user and initial stats
});
```

#### Get Users
```javascript
app.get('/api/users', async (req, res) => {
    // Implementation details
    // - Supports pagination
    // - Filters by active status
    // - Excludes password from response
});
```

### User Stats Routes

#### Get User Stats
```javascript
app.get('/api/users/:id/stats', async (req, res) => {
    // Implementation details
    // - Fetches user stats by ID
    // - Returns 404 if not found
});
```

#### Update User Stats
```javascript
app.put('/api/users/:id/stats', async (req, res) => {
    // Implementation details
    // - Updates existing stats
    // - Creates new stats if not exists
    // - Updates category engagement
});
```

### Article Interaction Routes

#### Record Interaction
```javascript
app.post('/api/users/:userId/interactions', async (req, res) => {
    // Implementation details
    // - Records article interaction
    // - Updates user stats
    // - Tracks category engagement
});
```

### News Content Routes

#### Fetch News
```javascript
app.get('/api/envisage_web', async (req, res) => {
    // Implementation details
    // - Fetches news by date
    // - Processes content structure
    // - Handles fallback to gemini_api
});
```

#### Record View
```javascript
app.post('/api/envisage_web/view', async (req, res) => {
    // Implementation details
    // - Increments view count
    // - Updates article stats
    // - Handles compound IDs
});
```

## Helper Functions

### Password Hashing
```javascript
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};
```

### Date Key Determination
```javascript
function determineNewsDateKey() {
    // Implementation details
    // - Determines appropriate date key based on time
    // - Handles morning/evening editions
    // - Returns formatted date string
}
```

## Error Handling

The server implements comprehensive error handling:

1. **Database Errors**
   - Connection failures
   - Query errors
   - Validation errors

2. **API Errors**
   - Invalid requests
   - Authentication failures
   - Resource not found

3. **Business Logic Errors**
   - Invalid operations
   - State conflicts
   - Data inconsistencies

## Server Initialization

```javascript
const isDevelopment = process.env.NODE_ENV === 'development';
const hostname = isDevelopment ? '0.0.0.0' : '127.0.0.1';

app.listen(PORT, hostname, () => {
    // Server startup logging
    // - Environment information
    // - API endpoint listing
    // - Connection details
});
```

## Security Considerations

1. **Authentication**
   - Multiple auth providers
   - Password hashing
   - JWT token management

2. **Data Protection**
   - Input validation
   - Data sanitization
   - Error handling

3. **API Security**
   - CORS configuration
   - Rate limiting
   - Request validation

## Performance Optimizations

1. **Database**
   - Indexed fields
   - Efficient queries
   - Connection pooling

2. **API**
   - Pagination
   - Response caching
   - Request batching

3. **Resources**
   - Connection pooling
   - Memory management
   - Error recovery 