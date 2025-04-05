import { fetchFromCollection } from '../lib/mongodb.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

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

// Get connection details
const mongoUri = process.env.MONGODB_URI;
const mongoDb = process.env.MONGODB_DB;

// Verify environment variables are loaded
console.log('MONGODB_URI defined:', !!mongoUri);
console.log('MONGODB_DB defined:', !!mongoDb);

/**
 * Fetch Gemini API document with Summary key and access the specific date value
 */
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

// Execute the function
fetchGeminiSummary()
  .then(() => console.log('Script completed'))
  .catch(error => console.error('Script failed:', error))
  .finally(() => process.exit()); // Exit the process when done
