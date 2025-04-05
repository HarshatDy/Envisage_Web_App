import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectToDatabase, fetchFromCollection, fetchPaginatedData } from './lib/mongodb.js';

// Load environment variables
dotenv.config({ path: './.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'MongoDB backend is running' });
});

// Gemini document route
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

// News route
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

// Start the server
app.listen(PORT, () => {
  console.log(`MongoDB backend server running on port ${PORT}`);
});