import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
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

// Start server - binding only to localhost for security
app.listen(PORT, 'localhost', () => {
  console.log('\n🚀 MongoDB server running on:');
  console.log(`🔗 Local:            http://localhost:${PORT}`);
  
  console.log('\n📡 API endpoints:');
  console.log(`   GET  /api/test                  - Test if server is running`);
  console.log(`   GET  /api/collections           - List all collections`);
  console.log(`   GET  /api/gemini-document       - Get Gemini document with Summary field`);
  console.log(`   GET  /api/news                  - Get news with optional filtering`);
  console.log(`   GET  /api/:collection/:id       - Get document by ID from any collection`);
  console.log(`   POST /api/:collection/query     - Query collection with filters`);
  console.log(`   POST /api/:collection/aggregate - Run aggregation pipeline on collection`);
  
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