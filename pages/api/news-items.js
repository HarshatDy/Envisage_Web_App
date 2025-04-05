import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // Check if gemini_news_items.js exists
    const dataFilePath = path.join(process.cwd(), 'data', 'gemini_news_items.js');
    
    if (fs.existsSync(dataFilePath)) {
      // Read the file content
      const fileContent = fs.readFileSync(dataFilePath, 'utf8');
      
      // Extract the array from the JS export
      const match = fileContent.match(/export const geminiNewsItems = (\[[\s\S]*\]);/);
      
      if (match && match[1]) {
        // Parse the array
        const newsItems = JSON.parse(match[1]);
        res.status(200).json(newsItems);
      } else {
        res.status(404).json({ message: 'News items array not found in file' });
      }
    } else {
      res.status(404).json({ message: 'News items file not found' });
    }
  } catch (error) {
    console.error('Error loading news items:', error);
    res.status(500).json({ message: 'Error loading news items', error: error.message });
  }
}
