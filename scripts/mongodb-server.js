import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectToDatabase, fetchFromCollection, fetchPaginatedData, fetchSingleDocument, fetchWithAggregation } from '../lib/mongodb.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`Warning: ${envPath} not found`);
  dotenv.config();
}

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Define schema models for use in API routes
// These should match the schemas in apply-mongodb-schema.mjs
const initializeModels = () => {
  const { Schema } = mongoose;
  
  const userSchema = new Schema({
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String },
    name: { type: String, required: true, trim: true },
    profilePicture: { type: String, default: '/images/default-avatar.png' },
    authProvider: { type: String, enum: ['email', 'google'], required: true },
    googleId: { type: String },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
  }, { timestamps: true });

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

  const userArticleInteractionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
    timeSpent: { type: Number, default: 0 },
    completed: { type: Boolean, default: false },
    interactionDate: { type: Date, default: Date.now },
    lastPosition: { type: Number, default: 0 }
  }, { timestamps: true });

  // Define models
  const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');
  const UserStats = mongoose.models.UserStats || mongoose.model('UserStats', userStatsSchema, 'user_stats');
  const Article = mongoose.models.Article || mongoose.model('Article', articleSchema, 'articles');
  const UserArticleInteraction = mongoose.models.UserArticleInteraction || 
    mongoose.model('UserArticleInteraction', userArticleInteractionSchema, 'user_article_interactions');

  return { User, UserStats, Article, UserArticleInteraction };
};

// Connect to MongoDB and initialize models
let models = {};
const connectMongooseAndInitModels = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        dbName: process.env.MONGODB_DB,
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      console.log('Mongoose connected successfully');
    }
    models = initializeModels();
    return models;
  } catch (error) {
    console.error('Failed to connect to MongoDB using Mongoose:', error);
    throw error;
  }
};

// Helper function to hash passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

// API Routes
// Test route to check if server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'MongoDB server is running', status: 'ok' });
});

// Get all collections in the database
app.get('/api/collections', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    const collections = await db.listCollections().toArray();
    res.json({ 
      collections: collections.map(c => c.name),
      total: collections.length
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: 'Failed to fetch collections' });
  }
});

// Gemini document route - GET document with Summary field
app.get('/api/gemini-document', async (req, res) => {
  try {
    const documents = await fetchFromCollection(
      'gemini_api', 
      { 'Summary': { $exists: true } },
      {},
      process.env.MONGODB_URI,
      process.env.MONGODB_DB
    );
    
    if (!documents || documents.length === 0) {
      return res.status(404).json({ message: 'No documents with Summary field found' });
    }
    
    // Look for the specific date in the Summary field
    for (const doc of documents) {
      if (doc.Summary && doc.Summary['2025-04-05_06:00']) {
        const summaryValue = doc.Summary['2025-04-05_06:00'];
        return res.json({ summary: summaryValue, date: '2025-04-05_06:00' });
      }
    }
    
    return res.status(404).json({
      message: 'No document contains Summary["2025-04-05_06:00"]',
      availableDates: documents[0].Summary ? Object.keys(documents[0].Summary) : []
    });
  } catch (error) {
    console.error('Error fetching gemini document:', error);
    return res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// News route - GET news with optional category, pagination
app.get('/api/news', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const query = category ? { category } : {};
    
    const result = await fetchPaginatedData(
      'news',
      query,
      parseInt(page),
      parseInt(limit),
      process.env.MONGODB_URI,
      process.env.MONGODB_DB
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// Get document by ID from any collection
app.get('/api/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const document = await fetchSingleDocument(
      collection,
      { _id: id },
      process.env.MONGODB_URI,
      process.env.MONGODB_DB
    );
    
    if (!document) {
      return res.status(404).json({ message: `Document with ID ${id} not found in ${collection}` });
    }
    
    res.json(document);
  } catch (error) {
    console.error(`Error fetching document from ${req.params.collection}:`, error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Query collection with filters
app.post('/api/:collection/query', async (req, res) => {
  try {
    const { collection } = req.params;
    const { query = {}, options = {}, page, limit } = req.body;
    
    let result;
    
    if (page && limit) {
      // Paginated query
      result = await fetchPaginatedData(
        collection,
        query,
        parseInt(page),
        parseInt(limit),
        process.env.MONGODB_URI,
        process.env.MONGODB_DB
      );
    } else {
      // Standard query
      result = await fetchFromCollection(
        collection,
        query,
        options,
        process.env.MONGODB_URI,
        process.env.MONGODB_DB
      );
    }
    
    res.json(result);
  } catch (error) {
    console.error(`Error querying ${req.params.collection}:`, error);
    res.status(500).json({ error: 'Failed to query collection' });
  }
});

// Aggregation pipeline
app.post('/api/:collection/aggregate', async (req, res) => {
  try {
    const { collection } = req.params;
    const { pipeline = [] } = req.body;
    
    const result = await fetchWithAggregation(
      collection,
      pipeline,
      process.env.MONGODB_URI,
      process.env.MONGODB_DB
    );
    
    res.json(result);
  } catch (error) {
    console.error(`Error aggregating ${req.params.collection}:`, error);
    res.status(500).json({ error: 'Failed to run aggregation pipeline' });
  }
});

// User Management Routes

// Create a new user
app.post('/api/users', async (req, res) => {
  try {
    await connectMongooseAndInitModels();
    const { User, UserStats } = models;
    
    const { email, name, password, authProvider = 'email', googleId, profilePicture } = req.body;
    
    // Validate required fields
    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }
    
    if (authProvider === 'email' && !password) {
      return res.status(400).json({ error: 'Password is required for email authentication' });
    }
    
    if (authProvider === 'google' && !googleId) {
      return res.status(400).json({ error: 'Google ID is required for Google authentication' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Create user object
    const userData = {
      email,
      name,
      authProvider,
      profilePicture: profilePicture || '/images/default-avatar.png',
      isActive: true,
      createdAt: new Date(),
      lastLogin: new Date()
    };
    
    // Add auth provider specific fields
    if (authProvider === 'email') {
      userData.password = await hashPassword(password);
    } else if (authProvider === 'google') {
      userData.googleId = googleId;
    }
    
    // Create and save the user
    const newUser = new User(userData);
    await newUser.save();
    
    // Create initial user stats
    const userStats = new UserStats({
      userId: newUser._id,
      totalTimeSpent: 0,
      cardReadingTime: 0,
      articlesRead: 0,
      lastActivity: new Date(),
      dailyStats: [{
        date: new Date(),
        timeSpent: 0,
        articlesRead: 0
      }],
      categoryEngagement: {}
    });
    
    await userStats.save();
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    return res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
      stats: userStats
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// Get all users (with pagination)
app.get('/api/users', async (req, res) => {
  try {
    await connectMongooseAndInitModels();
    const { User } = models;
    
    const { page = 1, limit = 10, active } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Build query
    const query = {};
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    // Count total documents
    const total = await User.countDocuments(query);
    
    // Find users with pagination
    const users = await User.find(query)
      .select('-password') // Exclude password
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ createdAt: -1 });
    
    return res.json({
      users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get a single user
app.get('/api/users/:id', async (req, res) => {
  try {
    await connectMongooseAndInitModels();
    const { User } = models;
    
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json(user);
  } catch (error) {
    console.error(`Error fetching user ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update a user
app.put('/api/users/:id', async (req, res) => {
  try {
    await connectMongooseAndInitModels();
    const { User } = models;
    
    const { id } = req.params;
    const { name, profilePicture, password, isActive } = req.body;
    
    const updateData = {};
    
    if (name !== undefined) updateData.name = name;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    // If password is provided, hash it
    if (password) {
      updateData.password = await hashPassword(password);
    }
    
    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error(`Error updating user ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete a user (or mark as inactive)
app.delete('/api/users/:id', async (req, res) => {
  try {
    await connectMongooseAndInitModels();
    const { User } = models;
    
    const { id } = req.params;
    const { hardDelete = false } = req.body;
    
    if (hardDelete === true) {
      // Permanent deletion - be careful with this!
      const result = await User.findByIdAndDelete(id);
      if (!result) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({
        message: 'User permanently deleted'
      });
    } else {
      // Soft deletion - mark as inactive
      const user = await User.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({
        message: 'User marked as inactive',
        user
      });
    }
  } catch (error) {
    console.error(`Error deleting user ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// User Stats Routes

// Get user stats
app.get('/api/users/:id/stats', async (req, res) => {
  try {
    await connectMongooseAndInitModels();
    const { UserStats } = models;
    
    const { id } = req.params;
    
    const stats = await UserStats.findOne({ userId: id });
    if (!stats) {
      return res.status(404).json({ error: 'User stats not found' });
    }
    
    return res.json(stats);
  } catch (error) {
    console.error(`Error fetching stats for user ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Update user stats
app.put('/api/users/:id/stats', async (req, res) => {
  try {
    await connectMongooseAndInitModels();
    const { UserStats } = models;
    
    const { id } = req.params;
    const { totalTimeSpent, cardReadingTime, articlesRead, categoryEngagement } = req.body;
    
    const updateData = {
      lastActivity: new Date()
    };
    
    if (totalTimeSpent !== undefined) updateData.totalTimeSpent = totalTimeSpent;
    if (cardReadingTime !== undefined) updateData.cardReadingTime = cardReadingTime;
    if (articlesRead !== undefined) updateData.articlesRead = articlesRead;
    
    let stats = await UserStats.findOne({ userId: id });
    
    if (!stats) {
      // Create stats if they don't exist
      stats = new UserStats({
        userId: id,
        totalTimeSpent: totalTimeSpent || 0,
        cardReadingTime: cardReadingTime || 0,
        articlesRead: articlesRead || 0,
        lastActivity: new Date(),
        dailyStats: [{
          date: new Date(),
          timeSpent: 0,
          articlesRead: 0
        }],
        categoryEngagement: categoryEngagement || {}
      });
    } else {
      // Update existing stats
      Object.assign(stats, updateData);
      
      // Update category engagement if provided
      if (categoryEngagement) {
        for (const [category, data] of Object.entries(categoryEngagement)) {
          const existingData = stats.categoryEngagement.get(category) || { timeSpent: 0, articlesRead: 0 };
          
          stats.categoryEngagement.set(category, {
            timeSpent: (data.timeSpent !== undefined) ? data.timeSpent : existingData.timeSpent,
            articlesRead: (data.articlesRead !== undefined) ? data.articlesRead : existingData.articlesRead
          });
        }
      }
    }
    
    await stats.save();
    
    return res.json({
      message: 'User stats updated successfully',
      stats
    });
  } catch (error) {
    console.error(`Error updating stats for user ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to update user stats' });
  }
});

// Add daily stats for a user
app.post('/api/users/:id/daily-stats', async (req, res) => {
  try {
    await connectMongooseAndInitModels();
    const { UserStats } = models;
    
    const { id } = req.params;
    const { date, timeSpent, articlesRead } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }
    
    let stats = await UserStats.findOne({ userId: id });
    
    if (!stats) {
      // Create stats if they don't exist
      stats = new UserStats({
        userId: id,
        lastActivity: new Date(),
        dailyStats: [{
          date: new Date(date),
          timeSpent: timeSpent || 0,
          articlesRead: articlesRead || 0
        }]
      });
    } else {
      // Check if stats for this date already exist
      const dateIndex = stats.dailyStats.findIndex(
        ds => new Date(ds.date).toDateString() === new Date(date).toDateString()
      );
      
      if (dateIndex >= 0) {
        // Update existing date stats
        if (timeSpent !== undefined) stats.dailyStats[dateIndex].timeSpent = timeSpent;
        if (articlesRead !== undefined) stats.dailyStats[dateIndex].articlesRead = articlesRead;
      } else {
        // Add new date stats
        stats.dailyStats.push({
          date: new Date(date),
          timeSpent: timeSpent || 0,
          articlesRead: articlesRead || 0
        });
      }
      
      // Update last activity
      stats.lastActivity = new Date();
    }
    
    await stats.save();
    
    return res.status(201).json({
      message: 'Daily stats added/updated successfully',
      stats
    });
  } catch (error) {
    console.error(`Error adding daily stats for user ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to add daily stats' });
  }
});

// Article Interaction Routes

// Record user interaction with an article
app.post('/api/users/:userId/interactions', async (req, res) => {
  try {
    await connectMongooseAndInitModels();
    const { UserArticleInteraction, Article, UserStats } = models;
    
    const { userId } = req.params;
    const { articleId, timeSpent, completed, lastPosition } = req.body;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    // Find existing interaction or create new one
    let interaction = await UserArticleInteraction.findOne({ userId, articleId });
    
    if (!interaction) {
      // Create new interaction
      interaction = new UserArticleInteraction({
        userId,
        articleId,
        timeSpent: timeSpent || 0,
        completed: completed || false,
        interactionDate: new Date(),
        lastPosition: lastPosition || 0
      });
    } else {
      // Update existing interaction
      if (timeSpent !== undefined) interaction.timeSpent += timeSpent;  // Add to existing time
      if (completed !== undefined) interaction.completed = completed;
      if (lastPosition !== undefined) interaction.lastPosition = lastPosition;
      interaction.interactionDate = new Date();
    }
    
    await interaction.save();
    
    // Update article metrics
    if (timeSpent) {
      const article = await Article.findById(articleId);
      if (article) {
        article.viewCount += 1;
        article.totalTimeSpent += timeSpent;
        article.averageReadTime = article.viewCount > 0 
          ? article.totalTimeSpent / article.viewCount 
          : article.totalTimeSpent;
        await article.save();
      }
    }
    
    // Update user stats if the article was completed
    if (completed) {
      const userStats = await UserStats.findOne({ userId });
      if (userStats) {
        userStats.articlesRead += 1;
        if (timeSpent) userStats.totalTimeSpent += timeSpent;
        userStats.lastActivity = new Date();
        
        // Find the article to get its category
        const article = await Article.findById(articleId);
        if (article && article.category) {
          const category = article.category;
          const existingEngagement = userStats.categoryEngagement.get(category) || { timeSpent: 0, articlesRead: 0 };
          
          userStats.categoryEngagement.set(category, {
            timeSpent: existingEngagement.timeSpent + (timeSpent || 0),
            articlesRead: existingEngagement.articlesRead + 1
          });
        }
        
        // Update daily stats
        const today = new Date().toDateString();
        const dailyStatIndex = userStats.dailyStats.findIndex(
          ds => new Date(ds.date).toDateString() === today
        );
        
        if (dailyStatIndex >= 0) {
          userStats.dailyStats[dailyStatIndex].articlesRead += 1;
          if (timeSpent) userStats.dailyStats[dailyStatIndex].timeSpent += timeSpent;
        } else {
          userStats.dailyStats.push({
            date: new Date(),
            timeSpent: timeSpent || 0,
            articlesRead: 1
          });
        }
        
        await userStats.save();
      }
    }
    
    return res.status(201).json({
      message: 'User article interaction recorded successfully',
      interaction
    });
  } catch (error) {
    console.error(`Error recording interaction for user ${req.params.userId}:`, error);
    return res.status(500).json({ error: 'Failed to record user article interaction' });
  }
});

// Get user interactions (with pagination)
app.get('/api/users/:userId/interactions', async (req, res) => {
  try {
    await connectMongooseAndInitModels();
    const { UserArticleInteraction } = models;
    
    const { userId } = req.params;
    const { page = 1, limit = 10, completed } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Build query
    const query = { userId };
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }
    
    // Count total documents
    const total = await UserArticleInteraction.countDocuments(query);
    
    // Find interactions with pagination
    const interactions = await UserArticleInteraction.find(query)
      .populate('articleId', 'title category dayTimeCategory summary') // Get article details
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .sort({ interactionDate: -1 });
    
    return res.json({
      interactions,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error(`Error fetching interactions for user ${req.params.userId}:`, error);
    return res.status(500).json({ error: 'Failed to fetch user interactions' });
  }
});

// Start server - binding to localhost for security in production, or all interfaces in development
const isDevelopment = process.env.NODE_ENV === 'development';
const hostname = isDevelopment ? '0.0.0.0' : 'localhost';

app.listen(PORT, hostname, () => {
  console.log('\n🚀 MongoDB server running on:');
  console.log(`🔗 Local:            http://localhost:${PORT}`);
  if (isDevelopment) {
    console.log(`🌐 Network:          http://<your-ip-address>:${PORT}`);
    console.log(`ℹ️  Running in development mode - accepting remote connections`);
  } else {
    console.log(`ℹ️  Running in production mode - only accepting local connections`);
  }
  
  console.log('\n📡 API endpoints:');
  console.log(`   GET  /api/test                  - Test if server is running`);
  console.log(`   GET  /api/collections           - List all collections`);
  console.log(`   GET  /api/gemini-document       - Get Gemini document with Summary field`);
  console.log(`   GET  /api/news                  - Get news with optional filtering`);
  console.log(`   GET  /api/:collection/:id       - Get document by ID from any collection`);
  console.log(`   POST /api/:collection/query     - Query collection with filters`);
  console.log(`   POST /api/:collection/aggregate - Run aggregation pipeline on collection`);
  console.log(`   POST /api/users                 - Create a new user`);
  console.log(`   GET  /api/users                 - Get all users (with pagination)`);
  console.log(`   GET  /api/users/:id             - Get a single user`);
  console.log(`   PUT  /api/users/:id             - Update a user`);
  console.log(`   DELETE /api/users/:id           - Delete a user (or mark as inactive)`);
  console.log(`   GET  /api/users/:id/stats       - Get user stats`);
  console.log(`   PUT  /api/users/:id/stats       - Update user stats`);
  console.log(`   POST /api/users/:id/daily-stats - Add daily stats for a user`);
  console.log(`   POST /api/users/:userId/interactions - Record user interaction with an article`);
  console.log(`   GET  /api/users/:userId/interactions - Get user interactions (with pagination)`);
  
  console.log('\n💡 For frontend, configure .env.local with:');
  console.log(`   NEXT_PUBLIC_API_URL=http://localhost:${PORT}`);
  console.log('\n📋 Press Ctrl+C to stop the server');
});

// Comment out the previous implementation as it's now replaced by Express server
/*
async function runMongoDBServer() {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    console.log('Connected to MongoDB successfully');
    
    // Test querying collections
    console.log('Available collections:');
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => console.log(`- ${collection.name}`));
    
    // Fetch a sample from gemini_api collection
    const geminiDocs = await fetchFromCollection('gemini_api', {}, { limit: 1 });
    console.log(`\nFound ${geminiDocs.length} document(s) in gemini_api collection`);
    
    // Keep the script running to simulate a server
    console.log('\nMongoDB server is running. Press Ctrl+C to stop.');
  } catch (error) {
    console.error('Error running MongoDB server:', error);
  }
}

runMongoDBServer();
*/