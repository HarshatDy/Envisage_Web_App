/**
 * Utility functions for article interactions
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Record a user's interaction with an article
 * @param {string} userId - The user's ID
 * @param {string} articleId - The article's ID
 * @param {number} timeSpent - Time spent in seconds
 * @param {boolean} completed - Whether the article was completed
 * @param {number} lastPosition - Position for resuming
 * @returns {Promise<Object>} - The API response
 */
export async function recordArticleInteraction(userId, articleId, timeSpent, completed, lastPosition = 0) {
  if (!userId || !articleId) {
    throw new Error('User ID and Article ID are required');
  }
  
  const url = `${API_BASE_URL}/api/users/${userId}/interactions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      articleId,
      timeSpent,
      completed,
      lastPosition
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to record interaction: ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Increment view count for an envisage_web news item
 * @param {string} articleId - The combined document and item ID (docId_itemId)
 * @param {number} newsItemId - The specific newsItem ID within the document
 * @returns {Promise<Object>} - The API response
 */
export async function incrementEnvisageWebView(articleId, newsItemId) {
  if (!articleId || newsItemId === undefined) {
    throw new Error('Article ID and news item ID are required');
  }
  
  const url = `${API_BASE_URL}/api/envisage_web/view`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      articleId,
      newsItemId
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to increment view count: ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Get user's interaction history
 * @param {string} userId - The user's ID
 * @returns {Promise<Object>} - The API response
 */
export async function getUserArticleInteractions(userId) {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  const url = `${API_BASE_URL}/api/users/${userId}/interactions`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get user interactions: ${errorText}`);
  }
  
  return await response.json();
}

/**
 * Check if article is already read by the user
 * @param {string} userId - The user's ID
 * @param {string} articleId - The article's ID
 * @returns {Promise<boolean>} - True if the article has been read
 */
export async function isArticleReadByUser(userId, articleId) {
  if (!userId || !articleId) {
    return false;
  }
  
  try {
    const interactions = await getUserArticleInteractions(userId);
    return interactions.interactions.some(
      interaction => {
        const interactionArticleId = typeof interaction.articleId === 'object' 
          ? interaction.articleId._id 
          : interaction.articleId;
        return interactionArticleId === articleId && interaction.completed === true;
      }
    );
  } catch (error) {
    console.error('Error checking if article is read:', error);
    return false;
  }
}

/**
 * Fetch news items from envisage_web collection
 * @returns {Promise<Array>} - Array of news items
 */
export async function fetchEnvisageWebNews() {
  try {
    const url = `${API_BASE_URL}/api/envisage_web`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch envisage_web: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || !data.newsItems || !Array.isArray(data.newsItems)) {
      throw new Error('Invalid data structure in envisage_web');
    }
    
    // Process the news items to include the document ID in each article ID
    return data.newsItems.map(item => ({
      ...item,
      articleId: `${data._id}_${item.id}`
    }));
  } catch (error) {
    console.error('Error fetching envisage_web news:', error);
    throw error;
  }
}
