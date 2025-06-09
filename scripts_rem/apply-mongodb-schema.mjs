import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

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

const { Schema } = mongoose;

/**
 * User Collection Schema
 * Stores all users regardless of login method (email or Google)
 */
const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    // Only required for email login users
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profilePicture: {
    type: String,
    default: '/images/default-avatar.png'
  },
  authProvider: {
    type: String,
    enum: ['email', 'google', 'github'],
    required: true
  },
  googleId: {
    type: String,
    // Only for Google sign-in users
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound index for efficient querying
userSchema.index({ email: 1, authProvider: 1 }, {unique : true});

/**
 * User Statistics Collection Schema
 * Tracks usage statistics for each user
 */
const userStatsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  cardReadingTime: {
    type: Number, // in seconds
    default: 0
  },
  articlesRead: {
    type: Number,
    default: 0
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  dailyStats: [{
    date: {
      type: Date,
      required: true
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    articlesRead: {
      type: Number,
      default: 0
    }
  }],
  categoryEngagement: {
    type: Map,
    of: {
      timeSpent: Number, // in seconds
      articlesRead: Number
    },
    default: {}
  }
}, { timestamps: true });

/**
 * Article Collection Schema
 * Stores articles with their categories and tracking metrics
 */
const articleSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  dayTimeCategory: {
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night'],
    required: true,
    index: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  publishDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Stats tracking
  viewCount: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  averageReadTime: {
    type: Number, // in seconds
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Compound indexes for efficient querying
articleSchema.index({ category: 1, dayTimeCategory: 1 });
articleSchema.index({ dayTimeCategory: 1, viewCount: -1 });

/**
 * User Article Interaction Collection Schema
 * Tracks individual user interactions with articles
 */
const userArticleInteractionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  articleId: {
    type: Schema.Types.ObjectId,
    ref: 'Article',
    required: true
  },
  timeSpent: {
    type: Number, // in seconds
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  interactionDate: {
    type: Date,
    default: Date.now
  },
  lastPosition: {
    type: Number, // to resume reading
    default: 0
  }
}, { timestamps: true });

// Compound index for efficient querying
userArticleInteractionSchema.index({ userId: 1, articleId: 1 }, { unique: true });
userArticleInteractionSchema.index({ userId: 1, interactionDate: -1 });

/**
 * Connect to MongoDB and apply schemas
 */
async function applyMongoDBSchemas() {
  try {
    // Validate environment variables
    const mongoURI = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;
    
    if (!mongoURI || !dbName) {
      throw new Error('MongoDB URI or database name not found in environment variables');
    }
    
    console.log(`\n🔄 Connecting to MongoDB database: ${dbName}`);
    
    // Connect to MongoDB
    await mongoose.connect(mongoURI, {
      dbName,
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Register models with specific collection names
    const User = mongoose.model('User', userSchema, 'users');
    const UserStats = mongoose.model('UserStats', userStatsSchema, 'user_stats');
    const Article = mongoose.model('Article', articleSchema, 'articles');
    const UserArticleInteraction = mongoose.model('UserArticleInteraction', userArticleInteractionSchema, 'user_article_interactions');
    
    console.log('\n📊 Registered Schema Models:');
    console.log('- Users (Collection: users)');
    console.log('- UserStats (Collection: user_stats)');
    console.log('- Article (Collection: articles)');
    console.log('- UserArticleInteraction (Collection: user_article_interactions)');
    
    console.log('\n🔍 Checking for existing collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log(`Found ${collectionNames.length} existing collections: ${collectionNames.join(', ')}`);
    
    console.log('\n✅ Schema application complete!');
    console.log('  - If collections didn\'t exist, they will be created when first documents are inserted');
    console.log('  - Indexes have been defined and will be created on first use');
    
    // Keep connection open for a moment to ensure indexes are properly applied
    setTimeout(async () => {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB');
      console.log('  Schema application process finished successfully');
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error applying MongoDB schemas:', error);
    process.exit(1);
  }
}

// Run the schema application function
applyMongoDBSchemas();
