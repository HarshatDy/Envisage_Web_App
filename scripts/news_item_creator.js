// Backend server URL - use environment variable if available, otherwise default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getNewsFromGemini() {
  console.log('🔄 news_item_creator: Initiating fetch from Gemini API');
  try {
    console.log(`📡 news_item_creator: Fetching from ${API_URL}/api/gemini-document`);
    const response = await fetch(`${API_URL}/api/gemini-document`);
    const data = await response.json();
    
    console.log('📊 news_item_creator: Received data structure:', JSON.stringify(data, null, 2));
    
    if (!data || !data.summary) {
      console.log('❌ news_item_creator: No summary data found in response');
      return [];
    }
    
    console.log('✅ news_item_creator: Successfully received Gemini data');
    
    // Process data based on the specific structure we know we're receiving
    return processGeminiData(data.summary);
  } catch (error) {
    console.error('❌ news_item_creator: Error fetching news:', error);
    return [];
  }
}

function processGeminiData(summaryData) {
  console.log('🔄 news_item_creator: Processing Gemini data structure');
  const newsItems = [];
  let id = Date.now();
  
  // Check if we have the date-based structure with categories
  const dateKeys = Object.keys(summaryData).filter(key => key.includes('-'));
  
  if (dateKeys.length > 0) {
    console.log(`🔍 news_item_creator: Found date-based entries: ${dateKeys.join(', ')}`);
    
    // Process each date entry
    for (const dateKey of dateKeys) {
      const dateData = summaryData[dateKey];
      
      // Check if there's an overall introduction to use as a general news item
      if (dateData.overall_introduction && dateData.overall_introduction.length > 100) {
        console.log('✨ news_item_creator: Creating news item from overall introduction');
        
        newsItems.push({
          id: id++,
          title: `News Overview for ${formatDate(dateKey)}`,
          summary: dateData.overall_introduction.substring(0, 500) + 
                  (dateData.overall_introduction.length > 500 ? '...' : ''),
          image: `/placeholder.svg?height=400&width=600&text=News+Overview`,
          category: 'Overview',
          date: new Date().toISOString().split('T')[0],
          slug: `news-overview-${dateKey.replace(/:/g, '-')}`,
          views: Math.floor(Math.random() * 2000) + 500,
          isRead: false,
        });
      }
      
      // Process categories if they exist
      if (dateData.categories && typeof dateData.categories === 'object') {
        console.log(`📂 news_item_creator: Processing ${Object.keys(dateData.categories).length} categories`);
        
        Object.entries(dateData.categories).forEach(([categoryName, categoryData]) => {
          if (!categoryData || !categoryData.summary || categoryData.summary.length < 100) {
            console.log(`⚠️ news_item_creator: Skipping category ${categoryName} - insufficient content`);
            return;
          }
          
          const title = categoryData.title || `Latest in ${categoryName}`;
          // Clean the title - remove markdown formatting
          const cleanTitle = title.replace(/\*\*/g, '').replace(/\[|\]/g, '');
          
          // Extract the first paragraph for a shorter summary
          let shortSummary = categoryData.summary;
          const paragraphMatch = categoryData.summary.match(/^(.*?)(?:\n\n|\n\*\*|$)/s);
          if (paragraphMatch && paragraphMatch[1]) {
            shortSummary = paragraphMatch[1].replace(/^#+\s+/, ''); // Remove markdown headings
          }
          
          console.log(`✨ news_item_creator: Created news item for category: ${categoryName}`);
          
          newsItems.push({
            id: id++,
            title: cleanTitle,
            summary: shortSummary.substring(0, 500) + (shortSummary.length > 500 ? '...' : ''),
            image: `/placeholder.svg?height=400&width=600&category=${encodeURIComponent(categoryName)}`,
            category: categoryName,
            date: new Date().toISOString().split('T')[0],
            slug: cleanTitle.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-').substring(0, 50),
            views: Math.floor(Math.random() * 2000) + 500,
            isRead: false,
            articleCount: categoryData.article_count || 0,
            sourceCount: categoryData.source_count || 0,
          });
        });
      }
    }
  } else {
    // Fallback for other structures
    console.log('🔍 news_item_creator: No date-based structure found, attempting to process as categories');
    
    Object.entries(summaryData).forEach(([key, value]) => {
      if (typeof value === 'object' && value.summary) {
        console.log(`✨ news_item_creator: Processing category: ${key}`);
        
        const title = value.title || `Latest in ${key}`;
        const cleanTitle = title.replace(/\*\*/g, '').replace(/\[|\]/g, '');
        
        newsItems.push({
          id: id++,
          title: cleanTitle,
          summary: value.summary.substring(0, 500) + (value.summary.length > 500 ? '...' : ''),
          image: `/placeholder.svg?height=400&width=600&category=${encodeURIComponent(key)}`,
          category: key,
          date: new Date().toISOString().split('T')[0],
          slug: cleanTitle.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '-').substring(0, 50),
          views: Math.floor(Math.random() * 2000) + 500,
          isRead: false,
          articleCount: value.article_count || 0,
          sourceCount: value.source_count || 0,
        });
      }
    });
  }
  
  console.log(`📦 news_item_creator: Generated ${newsItems.length} news items`);
  return newsItems;
}

// Helper function to format date strings like "2025-04-05_06:00" to "April 5, 2025"
function formatDate(dateString) {
  try {
    // Extract date parts from the string format (e.g., "2025-04-05_06:00")
    const [datePart, timePart] = dateString.split('_');
    const [year, month, day] = datePart.split('-').map(Number);
    
    // Format the date 
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if parsing fails
  }
}
