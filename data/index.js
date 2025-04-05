// This file serves as an entry point for data integration
// It will attempt to load and re-export the Gemini news items

let geminiNewsItems = [];

try {
  geminiNewsItems = require('./gemini_news_items').geminiNewsItems;
  console.log(`Loaded ${geminiNewsItems.length} news items from Gemini data`);
} catch (error) {
  console.warn('Gemini news items not found or failed to load');
}

export { geminiNewsItems };

// Export a function to combine with initial news items
export function combineNewsItems(initialItems) {
  return [...geminiNewsItems, ...initialItems];
}
