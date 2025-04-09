import { MongoClient } from 'mongodb';

// This code runs on the server only
export default async function handler(req, res) {
  console.log('🔄 API: Handling gemini-data request');
  
  // Get MongoDB connection details from environment variables
  const MONGODB_URI = process.env.MONGODB_URI;
  const MONGODB_DB = process.env.MONGODB_DB;
  
  if (!MONGODB_URI || !MONGODB_DB) {
    console.error('❌ API: MongoDB connection details missing from environment variables');
    return res.status(500).json({ error: 'Database configuration missing' });
  }
  
  let client = null;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    console.log('✅ API: MongoDB connection established');
    
    // Get the database and collection
    const db = client.db(MONGODB_DB);
    const collection = db.collection('gemini_api');
    
    // Query for documents with Summary field and the specific date
    const document = await collection.findOne({
      'Summary': { $exists: true },
      'Summary.2025-04-06_18:00': { $exists: true }
    });
    
    if (!document || !document.Summary || !document.Summary['2025-04-06_18:00']) {
      console.log('❌ API: No matching document found with required summary data');
      return res.status(404).json({ error: 'No matching document found' });
    }
    
    console.log('✅ API: Found document with Summary["2025-04-06_18:00"]');
    
    // Return only the summary data
    return res.status(200).json({ 
      summary: document.Summary['2025-04-06_18:00'],
      date: '2025-04-06_18:00'
    });
    
  } catch (error) {
    console.error('❌ API: Error querying MongoDB:', error);
    return res.status(500).json({ error: 'Failed to query database' });
  } finally {
    // Close the MongoDB connection
    if (client) {
      await client.close();
      console.log('👋 API: MongoDB connection closed');
    }
  }
}
