import { MongoClient } from 'mongodb';

// Connection options
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let cachedClient = null;
let cachedDb = null;

/**
 * Connect to MongoDB database
 * @param {string} uri - Optional URI to override environment variable
 * @param {string} dbName - Optional database name to override environment variable
 */
export async function connectToDatabase(uri, dbName) {
  // If we have a cached connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Use parameters or fall back to environment variables
  const connectionUri = uri || process.env.MONGODB_URI;
  const database = dbName || process.env.MONGODB_DB;

  // Check if MongoDB URI is defined
  if (!connectionUri) {
    console.error('Environment variables available:', Object.keys(process.env).filter(key => !key.startsWith('_')));
    throw new Error('MongoDB URI is not defined - please provide it as a parameter or set MONGODB_URI environment variable');
  }

  if (!database) {
    throw new Error('Database name is not defined - please provide it as a parameter or set MONGODB_DB environment variable');
  }

  console.log(`Connecting to MongoDB database: ${database}`);
  console.log(`Using connection string: ${connectionUri.substring(0, connectionUri.indexOf('@') + 1)}[REDACTED]`);
  
  // Connect to MongoDB
  const client = await MongoClient.connect(connectionUri, options);
  const db = client.db(database);
  
  console.log('Successfully connected to MongoDB');

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

/**
 * Fetch data from a collection
 * @param {string} collection - Collection name
 * @param {object} query - Query parameters
 * @param {object} options - Find options
 * @param {string} uri - Optional MongoDB URI
 * @param {string} dbName - Optional database name
 */
export async function fetchFromCollection(collection, query = {}, options = {}, uri = null, dbName = null) {
  const { db } = await connectToDatabase(uri, dbName);
  
  return db
    .collection(collection)
    .find(query, options)
    .toArray();
}

/**
 * Fetch single document from a collection
 * @param {string} collection - Collection name
 * @param {object} query - Query parameters
 * @param {string} uri - Optional MongoDB URI
 * @param {string} dbName - Optional database name
 */
export async function fetchSingleDocument(collection, query = {}, uri = null, dbName = null) {
  const { db } = await connectToDatabase(uri, dbName);
  
  return db
    .collection(collection)
    .findOne(query);
}

/**
 * Fetch data with pagination
 * @param {string} collection - Collection name
 * @param {object} query - Query parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @param {string} uri - Optional MongoDB URI
 * @param {string} dbName - Optional database name
 */
export async function fetchPaginatedData(collection, query = {}, page = 1, limit = 10, uri = null, dbName = null) {
  const { db } = await connectToDatabase(uri, dbName);
  
  const skip = (page - 1) * limit;
  
  const results = await db
    .collection(collection)
    .find(query)
    .skip(skip)
    .limit(limit)
    .toArray();
    
  const totalCount = await db
    .collection(collection)
    .countDocuments(query);
    
  return {
    data: results,
    pagination: {
      total: totalCount,
      page,
      limit,
      pages: Math.ceil(totalCount / limit)
    }
  };
}

/**
 * Fetch data with aggregation pipeline
 * @param {string} collection - Collection name
 * @param {Array} pipeline - Aggregation pipeline
 * @param {string} uri - Optional MongoDB URI
 * @param {string} dbName - Optional database name
 */
export async function fetchWithAggregation(collection, pipeline = [], uri = null, dbName = null) {
  const { db } = await connectToDatabase(uri, dbName);
  
  return db
    .collection(collection)
    .aggregate(pipeline)
    .toArray();
}
