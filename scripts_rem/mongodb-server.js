import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb'; // Add this import
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
    authProvider: { type: String, enum: ['email', 'google','github'], required: true },
    authProviderId: { type: String },
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
    documentId: { type: String }, // Field for document ID
    newsItems: [{  // Replace newsItemId with newsItems array
      newsItemId: { type: Number },  // ID for each news item
      timeSpent: { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      interactionDate: { type: Date, default: Date.now }
    }],
    timeSpent: { type: Number, default: 0 },  // Keep total time spent at top level
    completed: { type: Boolean, default: false },  // Overall completion status
    interactionDate: { type: Date, default: Date.now }
    // lastPosition field removed
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
      if (doc.Summary && doc.Summary['2025-04-06_18:00']) {
        const summaryValue = doc.Summary['2025-04-06_18:00'];
        return res.json({ summary: summaryValue, date: '2025-04-06_18:00' });
      }
    }
    
    return res.status(404).json({
      message: 'No document contains Summary["2025-04-06_18:00"]',
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
    console.log('POST /api/users - User creation request received');
    await connectMongooseAndInitModels();
    const { User, UserStats } = models;
    
    const { email, name, password, authProvider = 'email', AuthProviderId, profilePicture } = req.body;
    console.log(`Processing user creation for: ${email}, Auth Provider: ${authProvider}`);
    
    // Validate required fields
    if (!email || !name) {
      console.log('User creation failed: Missing email or name');
      return res.status(400).json({ error: 'Email and name are required' });
    }
    
    if (authProvider === 'email' && !password) {
      console.log('User creation failed: Missing password for email auth');
      return res.status(400).json({ error: 'Password is required for email authentication' });
    }
    
    if (authProvider === 'google' && !AuthProviderId) {
      console.log('User creation failed: Missing googleId for Google auth');
      return res.status(400).json({ error: 'Google ID is required for Google authentication' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email :email, authProvider: authProvider });
    if (existingUser) {
      console.log(`User creation failed: Email ${email} already exists`);
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
      userData.googleid = AuthProviderId;
    } else if (authProvider === 'github') {
      userData.githubid = AuthProviderId; // Assuming googleId is used for GitHub as well
    }
    
    // Create and save the user
    const newUser = new User(userData);
    await newUser.save();
    console.log(`User created successfully with ID: ${newUser._id}`);
    
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
    console.log(`Initial user stats created for user ${newUser._id}`);
    
    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;
    
    console.log(`User registration complete: ${name} (${email}) - Auth: ${authProvider}`);
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
    const { UserArticleInteraction, UserStats } = models;
    
    const { userId } = req.params;
    const { articleId, timeSpent, completed, newsItemId } = req.body;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    // Find existing interaction or create new one
    console.log("Finding existing interaction for user:", userId, "and article:", articleId);
    
    // Parse articleId if it contains documentId_newsItemId format
    let parsedArticleId = articleId;
    let documentId;
    let isCompoundId = false;
    
    if (articleId.includes('_')) {
      isCompoundId = true;
      [documentId, ] = articleId.split('_');
      console.log(`Parsed articleId "${articleId}" into documentId: "${documentId}"`);
      
      // Try to convert documentId to ObjectId if it's in valid format
      if (ObjectId.isValid(documentId)) {
        try {
          parsedArticleId = new ObjectId(documentId);
          console.log(`Converted documentId to ObjectId format: ${parsedArticleId}`);
        } catch (error) {
          console.error(`Error converting documentId to ObjectId: ${error.message}`);
          // Continue with the original string format if conversion fails
          parsedArticleId = documentId;
        }
      } else {
        parsedArticleId = documentId;
      }
    }
    
    // Find interaction with the correct criteria based on ID format
    let interaction;
    if (isCompoundId) {
      // For compound IDs, search by userId and documentId
      interaction = await UserArticleInteraction.findOne({ 
        userId,
        documentId
      });
    } else {
      // For regular article IDs
      interaction = await UserArticleInteraction.findOne({ 
        userId, 
        articleId
      });
    }
    console.log("Found existing interaction:", interaction);
    
    if (!interaction) {
      // Create new interaction with appropriate fields and newsItems array
      const interactionData = {
        userId,
        timeSpent: timeSpent || 0,
        completed: completed || false,
        interactionDate: new Date(),
        newsItems: [] // Initialize empty newsItems array
      };
      
      // Add the appropriate ID fields based on the format
      if (isCompoundId) {
        interactionData.articleId = parsedArticleId;
        interactionData.documentId = documentId;
        
        // Add the first newsItem entry if newsItemId is provided
        if (newsItemId !== undefined) {
          interactionData.newsItems.push({
            newsItemId: parseInt(newsItemId) || newsItemId,
            timeSpent: timeSpent || 0,
            completed: completed || false,
            interactionDate: new Date()
          });
        }
      } else {
        interactionData.articleId = articleId;
      }
      
      interaction = new UserArticleInteraction(interactionData);
    } else {
      // Update existing interaction's top-level fields
      if (timeSpent !== undefined) interaction.timeSpent += timeSpent;
      if (completed !== undefined) interaction.completed = completed;
      interaction.interactionDate = new Date();
      
      // Handle newsItemId if provided - check if it exists in the array
      if (newsItemId !== undefined) {
        const parsedNewsItemId = parseInt(newsItemId) || newsItemId;
        const existingItemIndex = interaction.newsItems.findIndex(
          item => item.newsItemId === parsedNewsItemId
        );
        
        if (existingItemIndex >= 0) {
          // Update existing news item entry
          const existingItem = interaction.newsItems[existingItemIndex];
          if (timeSpent !== undefined) existingItem.timeSpent += timeSpent;
          if (completed !== undefined) existingItem.completed = completed;
          existingItem.interactionDate = new Date();
        } else {
          // Add new news item entry
          interaction.newsItems.push({
            newsItemId: parsedNewsItemId,
            timeSpent: timeSpent || 0,
            completed: completed || false,
            interactionDate: new Date()
          });
        }
      }
    }
    
    await interaction.save();
    
    // Update user stats if the article was completed
    if (completed) {
      console.log('Article completed, updating user stats...');
      const userStats = await UserStats.findOne({ userId });
      if (userStats) {
        console.log('User stats found, updating...');
        userStats.articlesRead += 1;
        if (timeSpent) userStats.totalTimeSpent += timeSpent;
        userStats.lastActivity = new Date();
        
        // For envisage_web items, extract the category directly
        // If articleId is in format docId_itemId, parse the newsItemId and get category from envisage_web
        if (articleId.includes('_')) {
          try {
            const [docId, itemId] = articleId.split('_');
            
            const { db } = await connectToDatabase(
              process.env.MONGODB_URI,
              process.env.MONGODB_DB
            );
            
            const doc = await db.collection('envisage_web').findOne(
              { _id: docId, "newsItems.id": parseInt(itemId) },
              { projection: { "newsItems.$": 1 } }
            );
            
            if (doc && doc.newsItems && doc.newsItems[0]) {
              const category = doc.newsItems[0].category;
              if (category) {
                const existingEngagement = userStats.categoryEngagement.get(category) || { timeSpent: 0, articlesRead: 0 };
                
                userStats.categoryEngagement.set(category, {
                  timeSpent: existingEngagement.timeSpent + (timeSpent || 0),
                  articlesRead: existingEngagement.articlesRead + 1
                });
              }
            }
          } catch (error) {
            console.error('Error processing envisage_web category:', error);
          }
        }
        
        // Update daily stats
        const today = new Date().toDateString();
        const dailyStatIndex = userStats.dailyStats.findIndex(
          ds => new Date(ds.date).toDateString() === today
        );
        
        if (dailyStatIndex >= 0) {
          console.log('Daily stats found, updating...');
          userStats.dailyStats[dailyStatIndex].articlesRead += 1;
          if (timeSpent) userStats.dailyStats[dailyStatIndex].timeSpent += timeSpent;
        } else {
          console.log('No daily stats found, creating new entry...');
          userStats.dailyStats.push({
            date: new Date(),
            timeSpent: timeSpent || 0,
            articlesRead: 1
          });
        }
        
        await userStats.save();
        console.log('User stats updated and saved.');
      } else {
        console.log('User stats not found.');
      }
    } else {
      console.log('Article not completed.');
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

// Add a new route to increment article view count
app.post('/api/articles/:id/view', async (req, res) => {
  try {
    await connectMongooseAndInitModels();
    const { Article } = models;
    
    const { id } = req.params;
    
    // Find and update the article, incrementing viewCount by 1
    const article = await Article.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    return res.json({
      message: 'Article view count incremented',
      article: {
        id: article._id,
        viewCount: article.viewCount
      }
    });
  } catch (error) {
    console.error(`Error updating view count for article ${req.params.id}:`, error);
    return res.status(500).json({ error: 'Failed to update article view count' });
  }
});

// Helper function to determine the appropriate date key based on current time
function determineNewsDateKey() {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Format a date as YYYY-MM-DD
  const formatDateKey = (date, hour) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}_${hour}:00`;
  };
  
  // Clone the current date
  const currentDate = new Date(now);
  
  // Calculate yesterday
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  
  // Time logic:
  // 1. Between 6pm (18:00) current day and 6am (06:00) next day: use current day's evening edition
  // 2. Between 6am (06:00) and 6pm (18:00) current day: use current day's morning edition
  // 3. Between 6pm (18:00) previous day and 6am (06:00) current day: use previous day's evening edition
  
  if (currentHour >= 18) {
    // Evening to midnight: use current day's 18:00 edition
    return formatDateKey(currentDate, "18");
  } else if (currentHour >= 6) {
    // Morning to evening: use current day's 06:00 edition
    return formatDateKey(currentDate, "06");
  } else {
    // Midnight to morning: use previous day's 18:00 edition
    return formatDateKey(yesterdayDate, "18");
  }
}

// Fetch envisage_web document with newsItems
app.get('/api/envisage_web', async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};
    
    console.log('Fetching document from envisage_web collection...');
    console.log('Available collections check:');
    
    try {
      const { db } = await connectToDatabase();
      const collections = await db.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      console.log('Available collections:', collectionNames);
      console.log('envisage_web exists:', collectionNames.includes('envisage_web'));
    } catch (e) {
      console.error('Error checking collections:', e);
    }
    
    // If specific date is provided in query param, use it
    // Otherwise use the dynamic date based on current time
    const dateKey = date || determineNewsDateKey();
    console.log(`Using date key for envisage_web query: ${dateKey}`);
    
    // Build the query with the determined date key
    query = { [`envisage_web.${dateKey}`]: { $exists: true } };
    
    const document = await fetchSingleDocument(
      'envisage_web',
      query,
      process.env.MONGODB_URI,
      process.env.MONGODB_DB
    );
    
    if (!document) {
      console.log('No document found in envisage_web collection!');
      
      // Try to fetch from gemini_api as a fallback and process it
      console.log('Attempting to fetch from gemini_api collection as fallback...');
      const geminiDoc = await fetchSingleDocument(
        'gemini_api',
        { 'Summary': { $exists: true } },
        process.env.MONGODB_URI,
        process.env.MONGODB_DB
      );
      
      if (geminiDoc) {
        console.log('Found a document in gemini_api collection!');
        console.log('Document structure:', Object.keys(geminiDoc));
        
        // ...existing code for processing the gemini document...
      }
      
      return res.status(404).json({ message: 'No document found in envisage_web collection' });
    }
    
    console.log('Found document in envisage_web collection!');
    console.log('Document keys:', Object.keys(document));
    console.log('Document _id:', document._id);
    
    // If there's a specific date query, filter and restructure the response
    if (date && document["2025-04-06_18:00"]) {
      const dateData = document["2025-04-06_18:00"];
      
      // Process data for the specific date to create newsItems
      const newsItems = [];
      let id = 1;
      
      // Add overall introduction as a news item if it exists
      if (dateData.overall_introduction && dateData.overall_introduction.length > 100) {
        newsItems.push({
          id: id++,
          title: `News Overview for ${formatDate("2025-04-06_18:00")}`,
          summary: dateData.overall_introduction,
          image: `/placeholder.svg?height=400&width=600&text=News+Overview`,
          category: 'Overview',
          date: new Date().toISOString().split('T')[0],
          slug: `news-overview-2025-04-06-18-00`,
          views: Math.floor(Math.random() * 2000) + 500,
          isRead: false,
        });
      }
      
      // Process categories if they exist
      if (dateData.categories && typeof dateData.categories === 'object') {
        Object.entries(dateData.categories).forEach(([categoryName, categoryData]) => {
          if (!categoryData || !categoryData.summary || categoryData.summary.length < 100) {
            return;
          }
          
          const title = categoryData.title || `Latest in ${categoryName}`;
          // Clean the title - remove markdown formatting
          const cleanTitle = title.replace(/\*\*/g, '').replace(/\[|\]/g, '');
          
          newsItems.push({
            id: id++,
            title: cleanTitle,
            summary: categoryData.summary,
            image: `/placeholder.svg?height=400&width=600&category=${encodeURIComponent(categoryName)}`,
            category: categoryName,
            date: new Date().toISOString().split('T')[0],
            slug: cleanTitle.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-').substring(0, 50),
            views: Math.floor(Math.random() * 2000) + 500,
            isRead: false,
            articleCount: categoryData.article_count || 0,
            sourceCount: categoryData.source_count || 0,
          });
        });
      }
      
      // Return the restructured document with newsItems
      return res.json({
        _id: document._id,
        date: "2025-04-06_18:00",
        newsItems: newsItems
      });
    }
    
    return res.json(document);
  } catch (error) {
    console.error('Error fetching envisage_web document:', error);
    return res.status(500).json({ error: 'Failed to fetch envisage_web document' });
  }
});

// Helper function to format date strings
function formatDate(dateString) {
  try {
    // Extract date parts from the string format (e.g., "2025-04-06_18:00")
    const [datePart, timePart] = dateString.split('_');
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Format the date 
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if parsing fails
  }
}

// Increment view count for an item in envisage_web - modified to work without user authentication
app.post('/api/envisage_web/view', async (req, res) => {
  try {
    const { articleId, newsItemId } = req.body;
    
    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }
    
    console.log(`Received view request with articleId: "${articleId}", newsItemId: ${newsItemId}`);
    
    // Split the articleId into document ID and news item ID if it contains '_'
    let documentId, itemId;
    
    if (articleId.includes('_')) {
      [documentId, itemId] = articleId.split('_');
      console.log(`Parsed articleId "${articleId}" into documentId: "${documentId}" and itemId: "${itemId}"`);
    } else {
      documentId = articleId;
      itemId = newsItemId;
      console.log(`Using provided documentId: "${documentId}" and newsItemId: "${itemId}"`);
    }
    
    // Ensure we have a numeric newsItemId for the query
    const numericItemId = parseInt(itemId || newsItemId);
    
    if (isNaN(numericItemId)) {
      return res.status(400).json({ 
        error: 'Invalid news item ID - must be a number',
        details: { articleId, newsItemId, parsedItemId: itemId }
      });
    }
    
    console.log(`Incrementing view count for newsItem ${numericItemId} in document ${documentId}`);
    
    const { db } = await connectToDatabase(
      process.env.MONGODB_URI,
      process.env.MONGODB_DB
    );
    
    // Try to convert documentId to ObjectId
    let documentObjectId;
    try {
      // Always check if the documentId is a valid ObjectId format before converting
      if (ObjectId.isValid(documentId)) {
        documentObjectId = new ObjectId(documentId);
        console.log(`Successfully converted documentId to ObjectId: ${documentObjectId}`);
      } else {
        console.log(`Document ID "${documentId}" is not a valid ObjectId format, will use as string`);
        documentObjectId = documentId;
      }
    } catch (error) {
      console.error(`Error converting "${documentId}" to ObjectId:`, error);
      documentObjectId = documentId; // Fallback to using as string
    }
    
    // First try to find the document with the ObjectId (if valid)
    console.log(`Looking for document with _id:`, documentObjectId);
    let document = null;
    
    try {
      // First attempt with potentially converted ObjectId
      document = await db.collection('envisage_web').findOne({ _id: documentObjectId });
      
      // If not found with ObjectId, try with string (only if they're different)
      if (!document && documentObjectId.toString() !== documentId) {
        console.log(`Document not found with ObjectId, trying with string ID: ${documentId}`);
        document = await db.collection('envisage_web').findOne({ _id: documentId });
      }
    } catch (error) {
      console.error(`Error finding document:`, error);
      return res.status(500).json({ 
        error: 'Database error when finding document',
        message: error.message
      });
    }
    
    if (!document) {
      console.log('Document not found. Checking all documents in collection:');
      
      try {
        // Get a sample of document IDs to help debug the issue
        const allDocs = await db.collection('envisage_web').find({}, { projection: { _id: 1 }}).limit(10).toArray();
        console.log('Sample document IDs:', allDocs.map(doc => String(doc._id)));
        
        return res.status(404).json({ 
          error: 'Document not found',
          details: { 
            documentId,
            searchedIds: [String(documentObjectId), documentId],
            sampleIds: allDocs.map(doc => String(doc._id))
          }
        });
      } catch (error) {
        console.error(`Error retrieving sample document IDs:`, error);
        return res.status(404).json({ 
          error: 'Document not found and failed to retrieve sample IDs',
          details: { documentId }
        });
      }
    }
    
    console.log(`Found document with ID: ${document._id}`);
    
    // Find the date key (e.g., "2025-04-06_18:00")
    const availableKeys = Object.keys(document).filter(key => key !== '_id');
    console.log(`Document keys: ${availableKeys.join(', ')}`);
    
    // Check if document has envisage_web property, which contains our date keys
    if (document.envisage_web && typeof document.envisage_web === 'object') {
      console.log('Found envisage_web property, looking for date keys inside it');
      
      // Look for date keys inside envisage_web object
      const envisageKeys = Object.keys(document.envisage_web);
      const dateKeys = envisageKeys.filter(key => key.match(/\d{4}-\d{2}-\d{2}/));
      
      if (dateKeys.length === 0) {
        return res.status(400).json({ 
          error: 'No date keys found inside envisage_web property',
          details: { documentId, availableKeys: envisageKeys }
        });
      }
      
      // Use the most recent date key (sort descending)
      const targetDateKey = dateKeys.sort().reverse()[0];
      console.log(`Using date key: "${targetDateKey}"`);
      
      // Check if this date key contains a newsItems array, inside envisage_web
      if (!document.envisage_web[targetDateKey] || 
          !document.envisage_web[targetDateKey].newsItems || 
          !Array.isArray(document.envisage_web[targetDateKey].newsItems)) {
        return res.status(400).json({ 
          error: `No newsItems array found under date key "${targetDateKey}" in envisage_web`,
          details: { 
            documentId,
            dateKey: targetDateKey,
            hasDateObject: !!document.envisage_web[targetDateKey],
            hasNewsItemsProperty: document.envisage_web[targetDateKey] ? 
                                  !!document.envisage_web[targetDateKey].newsItems : false
          }
        });
      }
      
      // Find the specific news item to verify it exists
      const newsItem = document.envisage_web[targetDateKey].newsItems.find(item => item.id === numericItemId);
      if (!newsItem) {
        return res.status(404).json({ 
          error: `News item with ID ${numericItemId} not found in document`,
          availableIds: document.envisage_web[targetDateKey].newsItems.map(item => item.id)
        });
      }
      
      console.log(`Found news item "${newsItem.title}" with ID ${numericItemId}`);
      
      // Create the MongoDB update query to increment the views in the newsItems array
      const updatePath = {};
      updatePath[`envisage_web.${targetDateKey}.newsItems.$[elem].views`] = 1;
      
      // Use the same id type (ObjectId or string) that was successfully used to find the document
      const updateResult = await db.collection('envisage_web').updateOne(
        { _id: document._id }, // Use the _id from the found document to ensure correct type
        { $inc: updatePath },
        { 
          arrayFilters: [{ "elem.id": numericItemId }] 
        }
      );
      
      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ 
          error: 'Failed to match document for update', 
          details: { documentId, dateKey: targetDateKey, newsItemId: numericItemId }
        });
      }
      
      if (updateResult.modifiedCount === 0) {
        return res.status(400).json({ 
          error: 'View count not incremented - no matching news item found',
          details: { documentId, dateKey: targetDateKey, newsItemId: numericItemId }
        });
      }
      
      console.log(`Successfully incremented view count for news item ${numericItemId}`);
      
      return res.json({
        message: 'View count incremented successfully',
        updated: true,
        details: {
          documentId: String(document._id),
          dateKey: targetDateKey,
          newsItemId: numericItemId,
          title: newsItem.title,
          previousViews: newsItem.views || 0
        }
      });

      // Rest of your code continues, but with document.envisage_web[targetDateKey] instead of document[targetDateKey]
      // ...
    } else {
      // Continue with original approach (looking for date keys at top level)
      // Look for a key that matches a date format
      const dateKeys = availableKeys.filter(key => key.match(/\d{4}-\d{2}-\d{2}/));
      
      if (dateKeys.length === 0) {
        return res.status(400).json({ 
          error: 'No date keys found in document',
          details: { documentId, availableKeys }
        });
      }
      
      // Use the most recent date key (sort descending)
      const targetDateKey = dateKeys.sort().reverse()[0];
      console.log(`Using date key: "${targetDateKey}"`);
      
      // Check if this date key contains a newsItems array
      if (!document[targetDateKey] || !document[targetDateKey].newsItems || !Array.isArray(document[targetDateKey].newsItems)) {
        return res.status(400).json({ 
          error: `No newsItems array found under date key "${targetDateKey}"`,
          details: { 
            documentId,
            dateKey: targetDateKey,
            hasDateObject: !!document[targetDateKey],
            hasNewsItemsProperty: document[targetDateKey] ? !!document[targetDateKey].newsItems : false
          }
        });
      }
      
      // Find the specific news item to verify it exists
      const newsItem = document[targetDateKey].newsItems.find(item => item.id === numericItemId);
      if (!newsItem) {
        return res.status(404).json({ 
          error: `News item with ID ${numericItemId} not found in document`,
          availableIds: document[targetDateKey].newsItems.map(item => item.id)
        });
      }
      
      console.log(`Found news item "${newsItem.title}" with ID ${numericItemId}`);
      
      // Create the MongoDB update query to increment the views in the newsItems array
      const updatePath = {};
      updatePath[`${targetDateKey}.newsItems.$[elem].views`] = 1;
      
      // Use the same id type (ObjectId or string) that was successfully used to find the document
      const updateResult = await db.collection('envisage_web').updateOne(
        { _id: document._id }, // Use the _id from the found document to ensure correct type
        { $inc: updatePath },
        { 
          arrayFilters: [{ "elem.id": numericItemId }] 
        }
      );
      
      if (updateResult.matchedCount === 0) {
        return res.status(404).json({ 
          error: 'Failed to match document for update', 
          details: { documentId, dateKey: targetDateKey, newsItemId: numericItemId }
        });
      }
      
      if (updateResult.modifiedCount === 0) {
        return res.status(400).json({ 
          error: 'View count not incremented - no matching news item found',
          details: { documentId, dateKey: targetDateKey, newsItemId: numericItemId }
        });
      }
      
      console.log(`Successfully incremented view count for news item ${numericItemId}`);
      
      return res.json({
        message: 'View count incremented successfully',
        updated: true,
        details: {
          documentId: String(document._id),
          dateKey: targetDateKey,
          newsItemId: numericItemId,
          title: newsItem.title,
          previousViews: newsItem.views || 0
        }
      });
    }
  } catch (error) {
    console.error('Error incrementing view count in envisage_web:', error);
    return res.status(500).json({ error: 'Failed to increment view count', message: error.message });
  }
});

// New route to get all documents from envisage_web collection
app.get('/api/envisage_web/all', async (req, res) => {
  try {
    console.log('Fetching all documents from envisage_web collection...');
    
    const documents = await fetchFromCollection(
      'envisage_web',
      {},  // Empty query to fetch all documents
      {},
      process.env.MONGODB_URI,
      process.env.MONGODB_DB
    );
    
    console.log(`Found ${documents.length} documents in envisage_web collection`);
    
    // Print each document to console
    documents.forEach((doc, index) => {
      console.log(`Document ${index + 1}:`, {
        _id: doc._id,
        keys: Object.keys(doc),
        hasNewsItems: Array.isArray(doc.newsItems),
        newsItemsCount: Array.isArray(doc.newsItems) ? doc.newsItems.length : 0
      });
      
      // Print the full document structure (might be large)
      console.log(`Document ${index + 1} full structure:`, JSON.stringify(doc, null, 2));
    });
    
    return res.json({
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Error fetching all envisage_web documents:', error);
    return res.status(500).json({ error: 'Failed to fetch documents from envisage_web collection' });
  }
});

// Start server - binding to 127.0.0.1 for security in production, or all interfaces in development
const isDevelopment = process.env.NODE_ENV === 'development';
const hostname = isDevelopment ? '0.0.0.0' : '127.0.0.1';

app.listen(PORT, hostname, () => {
  console.log('\n🚀 MongoDB server running on:');
  console.log(`🔗 Local:            http://127.0.0.1:${PORT}`);
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
  console.log(`   GET  /api/news                  - Get news with optional category, pagination`);
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
  console.log(`   POST /api/articles/:id/view      - Increment article view count`);
  console.log(`   GET  /api/envisage_web           - Fetch data from envisage_web collection`);
  console.log(`   POST /api/envisage_web/view      - Increment view count for an item in envisage_web`);
  console.log(`   GET  /api/envisage_web/all       - Get all documents from envisage_web collection`);
  
  console.log('\n💡 For frontend, configure .env.local with:');
  console.log(`   NEXT_PUBLIC_API_URL=http://127.0.0.1:${PORT}`);
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