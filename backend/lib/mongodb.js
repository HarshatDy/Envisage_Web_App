import { MongoClient } from 'mongodb';

// Cache MongoDB client connection
let cachedClient = null;
let cachedDb = null;

// Connect to MongoDB database
export async function connectToDatabase(uri, dbName) {
  // Use provided URI and DB name or fall back to environment variables
  const connectionString = uri || process.env.MONGODB_URI;
  const database = dbName || process.env.MONGODB_DB;

  // If we don't have connection string or DB name, throw error
  if (!connectionString || !database) {
    throw new Error(
      'Please define the MONGODB_URI and MONGODB_DB environment variables'
    );
  }

  // If we already have a cached connection, return it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Create a new MongoDB client and connect
  const client = new MongoClient(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  const db = client.db(database);

  // Cache the client and db connections
  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

// Fetch documents from a collection with optional query and options
export async function fetchFromCollection(collectionName, query = {}, options = {}, uri, dbName) {
  const { db } = await connectToDatabase(uri, dbName);
  return db.collection(collectionName).find(query, options).toArray();
}

// Fetch a single document from a collection
export async function fetchSingleDocument(collectionName, query = {}, uri, dbName) {
  const { db } = await connectToDatabase(uri, dbName);
  return db.collection(collectionName).findOne(query);
}

// Fetch paginated data from a collection
export async function fetchPaginatedData(collectionName, query = {}, page = 1, limit = 10, uri, dbName) {
  const { db } = await connectToDatabase(uri, dbName);
  
  // Calculate skip for pagination
  const skip = (page - 1) * limit;
  
  // Get total count for pagination info
  const total = await db.collection(collectionName).countDocuments(query);
  
  // Get data with pagination
  const data = await db
    .collection(collectionName)
    .find(query)
    .skip(skip)
    .limit(limit)
    .toArray();
  
  // Return data with pagination info
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

// Execute an aggregation pipeline on a collection
export async function fetchWithAggregation(collectionName, pipeline = [], uri, dbName) {
  const { db } = await connectToDatabase(uri, dbName);
  return db.collection(collectionName).aggregate(pipeline).toArray();
}
