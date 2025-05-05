const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '.env.local' });
const { getImagesFromCategory, listCategories } = require('./googleCloudStorage');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Get images for a specific date, article ID, and category
app.get('/api/images/:date/:articleId/:category', async (req, res) => {
  try {
    const { date, articleId, category } = req.params;
    const images = await getImagesFromCategory(date, articleId, category);
    res.json({ success: true, images });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all categories for a specific article
app.get('/api/categories/:date/:articleId', async (req, res) => {
  try {
    const { date, articleId } = req.params;
    const categories = await listCategories(date, articleId);
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Default weather images endpoint
app.get('/api/weather-images', async (req, res) => {
  try {
    const images = await getImagesFromCategory('2025-04-06_18:00', '17', 'Weather');
    res.json({ success: true, images });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Google Cloud Storage server running on port ${PORT}`);
  console.log(`- Get weather images: http://127.0.0.1:${PORT}/api/weather-images`);
  console.log(`- Get specific category: http://127.0.0.1:${PORT}/api/images/2025-04-06_18:00/17/Weather`);
});
