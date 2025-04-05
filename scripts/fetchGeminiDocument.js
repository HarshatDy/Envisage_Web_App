import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import fetch from 'node-fetch';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const envPath = resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.warn(`Warning: ${envPath} not found`);
  dotenv.config(); // Try default .env as fallback
}

// Backend server URL
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Verify environment variables are loaded
console.log('API_URL:', API_URL);

/**
 * Fetch Gemini API document with Summary key and access the specific date value
 * Now using the backend server API instead of direct database connection
 */
async function fetchGeminiSummary() {
  try {
    console.log('Connecting to backend server at:', API_URL);
    console.log('Looking for document with Summary["2025-04-05_06:00"] value');
    
    // Query the backend API endpoint
    const response = await fetch(`${API_URL}/api/gemini-document`);
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('No matching documents found');
        const errorData = await response.json();
        
        if (errorData.availableDates && errorData.availableDates.length) {
          console.log('Available dates in documents:');
          console.log(errorData.availableDates);
        }
        return;
      }
      
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data && data.summary) {
      console.log(`Found the specific Summary entry for ${data.date}:`);
      console.log('-'.repeat(80));
      console.log(data.summary);
      console.log('-'.repeat(80));
    } else {
      console.log('Received a response but no summary data was found');
      console.log('Response data:', data);
    }
  } catch (error) {
    console.error('Error fetching document from backend API:', error);
  }
}

// Execute the function
fetchGeminiSummary()
  .then(() => console.log('Script completed'))
  .catch(error => console.error('Script failed:', error))
  .finally(() => process.exit()); // Exit the process when done

// The previous implementation which connected directly to MongoDB is commented out:
/*
import { fetchFromCollection } from '../lib/mongodb.js';

// Get connection details
const mongoUri = process.env.MONGODB_URI;
const mongoDb = process.env.MONGODB_DB;

// Verify environment variables are loaded
console.log('MONGODB_URI defined:', !!mongoUri);
console.log('MONGODB_DB defined:', !!mongoDb);

async function fetchGeminiSummary() {
  try {
    console.log('Connecting to database:', mongoUri?.substring(0, mongoUri.indexOf('@') + 1) + '[REDACTED]');
    console.log('Using database:', mongoDb);
    console.log('Looking for document with Summary["2025-04-05_06:00"] value');
    
    // Find documents that have the Summary field
    const documents = await fetchFromCollection('gemini_api', { 'Summary': { $exists: true } }, {}, mongoUri, mongoDb);
    
    if (documents && documents.length > 0) {
      console.log(`Found ${documents.length} document(s) with Summary field`);
      
      // Look for documents that have the specific date key inside Summary
      for (const doc of documents) {
        if (doc.Summary && doc.Summary['2025-04-05_06:00']) {
          console.log('Found the specific Summary entry for 2025-04-05_06:00:');
          console.log('-'.repeat(80));
          console.log(doc.Summary['2025-04-05_06:00']);
          console.log('-'.repeat(80));
          return; // Exit once we find the first matching document
        }
      }
      
      console.log('No document contains Summary["2025-04-05_06:00"]');
      
      // Show what date entries are available in the first document
      if (documents[0].Summary) {
        console.log('Available dates in the first document:');
        console.log(Object.keys(documents[0].Summary));
      }
    } else {
      console.log('No documents found with a Summary field');
    }
  } catch (error) {
    console.error('Error fetching document from gemini_api collection:', error);
  }
}
*/
