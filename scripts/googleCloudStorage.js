const { Storage } = require('@google-cloud/storage');
require('dotenv').config({ path: '.env.local' });

// Get configuration from .env.local
const PROJECT_ID = process.env.PROJECT_ID;
const BUCKET_NAME = process.env.BUCKET_NAME;
const KEYFILENAME = process.env.KEYFILENAME;

// Initialize Google Cloud Storage client
const storage = new Storage({
  projectId: PROJECT_ID,
  keyFilename: KEYFILENAME
});

const bucket = storage.bucket(BUCKET_NAME);

/**
 * Get images from a specific category folder
 * @param {string} date - Date in format 'YYYY-MM-DD_HH:MM'
 * @param {string} articleId - Article ID
 * @param {string} category - Category name
 * @returns {Promise<Array>} - Array of image URLs
 */
async function getImagesFromCategory(date = '2025-04-06_18:00', articleId = '17', category = 'Weather') {
  try {
    const folderPath = `${date}/${articleId}_${category}/`;
    console.log(`Fetching images from: ${folderPath}`);
    
    const [files] = await bucket.getFiles({ prefix: folderPath });
    
    // Generate URLs for each file
    const imageUrls = await Promise.all(files.map(async (file) => {
      // Skip folder objects
      if (file.name.endsWith('/')) return null;
      
      // Generate a signed URL that expires in 1 hour
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 60 * 60 * 1000, // 1 hour
      });
      
      return {
        name: file.name.split('/').pop(),
        path: file.name,
        url: url,
        contentType: file.metadata.contentType
      };
    }));
    
    // Filter out any null values (folder objects)
    return imageUrls.filter(url => url !== null);
  } catch (error) {
    console.error('Error fetching images:', error);
    throw error;
  }
}

/**
 * List all available categories for a specific article
 * @param {string} date - Date in format 'YYYY-MM-DD_HH:MM'
 * @param {string} articleId - Article ID
 * @returns {Promise<Array>} - Array of category names
 */
async function listCategories(date = '2025-04-06_18:00', articleId = '17') {
  try {
    const prefix = `${date}/${articleId}_`;
    const [files] = await bucket.getFiles({ prefix: prefix, delimiter: '/' });
    
    // Extract category names from folder paths
    const categories = files
      .filter(file => file.name.startsWith(prefix) && file.name.includes('/'))
      .map(file => {
        const parts = file.name.replace(prefix, '').split('/');
        return parts[0];
      });
    
    // Return unique categories
    return [...new Set(categories)];
  } catch (error) {
    console.error('Error listing categories:', error);
    throw error;
  }
}

module.exports = {
  getImagesFromCategory,
  listCategories
};
