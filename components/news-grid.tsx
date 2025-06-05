"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Eye,
  X,
  Clock,
  Bookmark,
  Share2,
  BookMarked, // Changed from BookmarkCheck based on error suggestion
  ArrowRight,
  User,
} from "lucide-react"
import { useSession } from "next-auth/react" // For user authentication
import { Toast } from "@/components/ui/toast"

// Define interface for news item
interface NewsItem {
  id: number;
  title: string;
  summary: string;
  image: string;
  category: string;
  date: string;
  slug: string;
  views: number;
  isRead: boolean;
  articleId?: string; // MongoDB _id for the article
  articleCount?: number; 
  sourceCount?: number;
  isBookmarked?: boolean;
  size?: string; // small, medium, large for different card sizes
  type?: string; // article, stocks, trending, newsletter
  readTime?: string;
  images?: string[]; // Add the new images array property
}

// Add this interface near the top of the file with other interfaces
interface SearchResult {
  id: number;
  title: string;
  summary: string;
  category: string;
  slug: string;
  image: string;
}

// Sample news data
const initialNewsItems = [
  {
    id: 1,
    title: "FKKKKKKKKKKK Global Markets React to Economic Policy Shifts",
    summary:
      "Stock markets worldwide show mixed reactions to the latest economic policy announcements. Analysts predict continued volatility as investors adjust to the new landscape. Central banks are closely monitoring the situation and may intervene if necessary. The impact on emerging markets has been particularly pronounced, with several currencies experiencing significant fluctuations against the dollar. Investors are advised to maintain diversified portfolios during this period of uncertainty.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Business",
    date: "2023-03-15",
    slug: "global-markets-react",
    views: 1243,
    isRead: false,
    articleId: "sample_1", // Combined sample ID format
  },
  {
    id: 2,
    title: "New Study Reveals Benefits of Mediterranean Diet",
    summary:
      "Research confirms significant health benefits for those following a traditional Mediterranean diet. The study tracked participants over a five-year period and found reduced risks of heart disease, stroke, and certain cancers. Olive oil, fish, and fresh vegetables were identified as key components. The research team, led by renowned nutritionist Dr. Elena Papadakis, emphasized that consistency was more important than strict adherence. Participants who followed the diet moderately but regularly showed better outcomes than those who followed it perfectly but intermittently.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Health",
    date: "2023-03-14",
    slug: "mediterranean-diet-benefits",
    views: 876,
    isRead: false,
    articleId: "sample_2", // Combined sample ID format
  },
  {
    id: 3,
    title: "Major Sports League Announces Expansion Teams",
    summary:
      "Two new cities will join the league in the upcoming season, bringing the total to 32 teams. The expansion represents a significant investment in growing markets and will create thousands of new jobs. Team names and logos will be revealed at a special event next month. League commissioner Janet Wilson described the expansion as 'a historic moment for the sport' and promised fans in the new cities an 'unforgettable inaugural season.' The expansion draft is scheduled for July, with existing teams allowed to protect up to 15 players from selection.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Sports",
    date: "2023-03-14",
    slug: "sports-league-expansion",
    views: 654,
    isRead: false,
    articleId: "sample_3", // Combined sample ID format
  },
  {
    id: 4,
    title: "Tech Company Unveils Next-Generation Smartphone",
    summary:
      "The latest flagship device features groundbreaking camera technology and extended battery life. Industry experts are calling it a significant leap forward in mobile technology. Pre-orders have already broken previous records, indicating strong consumer interest despite the premium price point. The new device incorporates a revolutionary sensor that can capture clear images in near-darkness, potentially eliminating the need for flash photography in most situations. Battery improvements allow for up to 72 hours of normal use between charges, addressing a common pain point for smartphone users.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Technology",
    date: "2023-03-13",
    slug: "next-gen-smartphone",
    views: 2105,
    isRead: false,
  },
  {
    id: 5,
    title: "Environmental Initiative Aims to Clean Ocean Plastic",
    summary:
      "A new global partnership launches ambitious project to remove plastic waste from the world's oceans. Using innovative collection methods and recycling technologies, the initiative aims to remove millions of tons of plastic over the next decade. Corporate sponsors have pledged significant funding to support the effort. The project will deploy a fleet of specialized vessels equipped with advanced filtration systems that can collect microplastics without harming marine life. Collected plastic will be processed and transformed into construction materials for affordable housing projects in coastal communities.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Science",
    date: "2023-03-12",
    slug: "ocean-plastic-initiative",
    views: 932,
    isRead: false,
  },
  {
    id: 6,
    title: "Award-Winning Film Director Announces New Project",
    summary:
      "The acclaimed filmmaker returns with an ambitious new movie starring A-list actors. Set to begin production next month, the film explores themes of identity and belonging in a near-future setting. Studio executives are already generating Oscar buzz based on the screenplay and attached talent. The project reunites the director with cinematographer Lucia Chen, with whom she collaborated on her Academy Award-winning previous film. Filming will take place across three continents, with principal photography expected to last approximately four months.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Entertainment",
    date: "2023-03-11",
    slug: "film-director-new-project",
    views: 1567,
    isRead: false,
  },
]

// Encouraging messages for read completion
const encouragingMessages = [
  "Way to go! You're staying informed.",
  "Great job! You're ahead of 87% of readers today.",
  "Knowledge is power! Keep it up.",
  "You're crushing it! Another article completed.",
  "Impressive! You're becoming an expert.",
  "Amazing progress! You're on a roll.",
  "Fantastic! You're building your knowledge base.",
  "Brilliant! You're more informed than most.",
  "Excellent! You're making the most of your 20 minutes.",
  "Superb! You're mastering today's news.",
]

// Define interface for news item to be sent to HeroSection
interface HeroNewsItem {
  id: number;
  title: string;
  summary: string;
  image: string;
  category: string;
  slug: string;
}

// Add this type declaration at the top of the file, after the imports
declare global {
  interface Window {
    __newsItemsCache?: string;
  }
}

export default function NewsGrid() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>(initialNewsItems)
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null)
  const expandedCardRef = useRef<HTMLDivElement>(null)
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null)
  const { data: session } = useSession() // Get current user session
  
  // Keep these references for compatibility but we're no longer using them actively
  const timeSpentRef = useRef<{ [key: number]: number }>({}) // Track time spent on each article
  const startTimeRef = useRef<number | null>(null) // Track when user started reading
  
  const userId = session?.user?.id // Current user ID
  const processingMarkAsReadRef = useRef<Set<number>>(new Set()); // Track articles being processed
  const scrollDebounceTimerRef = useRef<NodeJS.Timeout | null>(null); // Debounce scroll events
  
  // Add a new timer reference for marking as read after 5 seconds
  const articleReadTimerRef = useRef<NodeJS.Timeout | null>(null);

  // New states for updated UI
  const [animatingCardId, setAnimatingCardId] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [totalReadingTime, setTotalReadingTime] = useState(0);

  // Add these new functions after the existing state declarations
  const [filteredNewsItems, setFilteredNewsItems] = useState<NewsItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Calculate total reading time of unread articles
  useEffect(() => {
    // Assign a default read time to articles that don't have one
    const articlesWithReadTime = newsItems.map(item => ({
      ...item,
      readTime: item.readTime || `${Math.floor(item.summary.length / 300) + 2} min`
    }));
    
    const unreadItems = articlesWithReadTime.filter((item) => !item.isRead);
    const total = unreadItems.reduce((acc, item) => {
      return acc + Number.parseInt(item.readTime?.split(" ")[0] || "3");
    }, 0);
    
    setTotalReadingTime(total);
    
    // Update items with read times if they don't have them
    if (articlesWithReadTime.some(item => !item.readTime)) {
      setNewsItems(articlesWithReadTime);
    }
  }, [newsItems]);

  // Load news items from envisage_web collection and check user interaction history
  useEffect(() => {
    async function loadNewsAndCheckReadStatus() {
      console.log('🔄 news-grid: Loading news items from envisage_web and checking read status');
      
      try {
        // Step 1: Load all news items from envisage_web collection
        let allNewsItems: NewsItem[] = [];
        let readArticleIds = new Map<string, Set<number>>(); // Changed to Map<documentId, Set<newsItemIds>>
        
        try {
          // Fetch news items from envisage_web collection
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/api/envisage_web`);
          if (response.ok) {
            const result = await response.json();
            console.log(`✅ news-grid: Loaded envisage_web data`);
            
            // DEBUG: Print the full envisage_web document
            console.log('📋 DEBUG - Full envisage_web document:', result);
            
            // Find the date key
            const dateKey = result.envisage_web ? Object.keys(result.envisage_web)[0] : null;

            // Check if the data contains newsItems array
            if (dateKey && result.envisage_web && result.envisage_web[dateKey] && result.envisage_web[dateKey].newsItems && Array.isArray(result.envisage_web[dateKey].newsItems)) {
              // DEBUG: Print the newsItems array
              console.log('📊 DEBUG - News items array:', result.envisage_web[dateKey].newsItems);
              
              // Fixed issue with articleId assignment - get the correct document ID from the top level
              // The document ID is directly in the result object, not in the dateKey object
              const documentId = result._id;
              console.log('🔑 DEBUG - Document ID from top level that should be used as articleId base:', documentId);
              
              if (!documentId) {
                console.error('❌ DEBUG - Missing document _id in API response. Cannot assign articleId to news items');
                console.log('📋 DEBUG - Full result structure for troubleshooting:', 
                  JSON.stringify({
                    hasId: !!result._id,
                    topLevelKeys: Object.keys(result),
                    resultStructure: Object.keys(result).reduce((acc, key) => ({
                      ...acc,
                      [key]: typeof result[key]
                    }), {})
                  }                  )
                );
              }
              
              // Map the newsItems data to our NewsItem format with combined articleId
              allNewsItems = result.envisage_web[dateKey].newsItems.map((item: any, index: number) => {
                // Create a combined articleId using document ID and news item ID
                const combinedArticleId = documentId ? `${documentId}_${item.id}` : `fallback-id_${item.id}`;
                
                // Assign size based on index for visual variety
                const sizeOptions = ["tiny", "small", "medium", "large", "wide", "tall"];
                const size = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
                
                // Select image: Use random image from 'images' array if available, else fallback
                let selectedImage = item.image || "/placeholder.svg?height=400&width=600"; // Default fallback
                if (item.images && Array.isArray(item.images) && item.images.length > 0) {
                  const randomIndex = Math.floor(Math.random() * item.images.length);
                  selectedImage = item.images[randomIndex];
                  console.log(`🖼️ DEBUG - Using random image from 'images' array for item ${item.id}: ${selectedImage}`);
                } else {
                  console.log(`⚠️ DEBUG - No 'images' array found or empty for item ${item.id}, using fallback: ${selectedImage}`);
                }

                const newsItem = {
                  id: item.id,
                  title: item.title,
                  summary: item.summary || "",
                  image: selectedImage, // Use the selected image URL
                  category: item.category,
                  date: item.date,
                  slug: item.slug,
                  views: item.views || 0,
                  isRead: false,
                  articleId: combinedArticleId, // Use combined ID format
                  articleCount: item.articleCount,
                  sourceCount: item.sourceCount,
                  isBookmarked: false,
                  size: size,
                  type: "article",
                  readTime: `${Math.floor((item.summary || "").length / 1000) + 1} min`,
                  images: item.images // Store the original images array if needed later
                };
                
                console.log(`📋 DEBUG - Created news item ${item.id} with combined articleId: ${newsItem.articleId}`);
                return newsItem;
              });
              
              console.log(`📊 news-grid: Processed ${allNewsItems.length} news items from envisage_web`);
              
              // DEBUG: Print the unique articleIds created
              console.log('🔑 DEBUG - Generated articleIds:', allNewsItems.map(item => ({
                id: item.id,
                articleId: item.articleId
              })));
            } else {
              console.error('❌ news-grid: Invalid data structure in envisage_web');
              
              // DEBUG: Print what we received to help diagnose the problem
              console.log('❌ DEBUG - Invalid envisage_web structure received:', {
                hasResult: !!result,
                resultType: typeof result,
                hasEnvisageWeb: !!result.envisage_web,
                dateKey: dateKey,
                hasNewsItems: !!(result.envisage_web && dateKey && result.envisage_web[dateKey].newsItems),
                newsItemsType: result.envisage_web && dateKey && result.envisage_web[dateKey] ? typeof result.envisage_web[dateKey].newsItems : 'undefined',
                isArray: !!(result.envisage_web && dateKey && result.envisage_web[dateKey].newsItems && Array.isArray(result.envisage_web[dateKey].newsItems))
              });
              
              // Fix the syntax error by properly closing the parentheses
              console.log('📋 DEBUG - Full result structure for troubleshooting:', 
                JSON.stringify({
                  hasId: !!result._id,
                  topLevelKeys: Object.keys(result),
                  resultStructure: Object.keys(result).reduce((acc, key) => ({
                    ...acc,
                    [key]: typeof result[key]
                  }), {})
                }                )
              );
            }
          } else {
            console.error(`❌ news-grid: Error fetching envisage_web - Status: ${response.status}`);
            const errorText = await response.text();
            console.error('❌ DEBUG - Error response text:', errorText);
          }
        } catch (error) {
          console.error('❌ news-grid: Error loading news from envisage_web:', error);
          
          // Fallback to sample data BUT ensure they all have articleIds
          allNewsItems = initialNewsItems.map((item: NewsItem, index: number) => { // Explicitly type 'item' as NewsItem
            // Assign size based on index for visual variety
            const sizeOptions = ["tiny", "small", "medium", "large", "wide", "tall"];
            const size = sizeOptions[Math.floor(Math.random() * sizeOptions.length)];
            
            // Select image for fallback data (use existing logic)
            let selectedImage = item.image || "/placeholder.svg?height=400&width=600";
            // This check should now be type-safe
            if (item.images && Array.isArray(item.images) && item.images.length > 0) {
              const randomIndex = Math.floor(Math.random() * item.images.length);
              selectedImage = item.images[randomIndex];
            }

            return {
              ...item,
              image: selectedImage, // Use selected image for fallback too
              articleId: item.articleId || `sample-article-id-${item.id}`, // Ensure every sample item has an articleId
              isBookmarked: false,
              size: item.size || size,
              type: item.type || "article",
              readTime: item.readTime || `${Math.floor((item.summary || "").length / 300) + 2} min`
            };
          });
          
          console.log('⚠️ news-grid: Using sample news items as fallback with articleIds:', 
            allNewsItems.map(item => ({ id: item.id, articleId: item.articleId }))
          );
        }
        
        // Step 2: If user is logged in, check interaction history using updated schema
        if (userId) {
          try {
            console.log('👤 news-grid: Checking user interaction history');
            const interactionsUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/api/users/${userId}/interactions`;
            const interactionsResponse = await fetch(interactionsUrl);
            
            if (interactionsResponse.ok) {
              const interactionsData = await interactionsResponse.json();
              console.log('👤 DEBUG - Received user interactions:', interactionsData);
              
              // Process each interaction
              if (interactionsData.interactions && Array.isArray(interactionsData.interactions)) {
                interactionsData.interactions.forEach((interaction: any) => {
                  // Extract the document ID
                  const documentId = interaction.documentId || String(interaction.articleId);
                  
                  if (!documentId) {
                    console.log('⚠️ DEBUG - Interaction missing document ID:', interaction);
                    return;
                  }
                  
                  // Initialize the Set for this document if needed
                  if (!readArticleIds.has(documentId)) {
                    readArticleIds.set(documentId, new Set<number>());
                  }
                  
                  // Check the newsItems array for completed items
                  if (interaction.newsItems && Array.isArray(interaction.newsItems)) {
                    interaction.newsItems.forEach((newsItem: any) => {
                      if (newsItem.completed && newsItem.newsItemId !== undefined) {
                        // Add the newsItemId to the set for this document
                        const newsItemSet = readArticleIds.get(documentId)!;
                        newsItemSet.add(Number(newsItem.newsItemId));
                        
                        console.log(`🔍 DEBUG - Marked newsItem ${newsItem.newsItemId} in document ${documentId} as read`);
                      }
                    });
                  } else {
                    console.log(`⚠️ DEBUG - Interaction for document ${documentId} has no newsItems array`);
                  }
                });
              }
              
              // Log all read items for debugging
              readArticleIds.forEach((itemIds, docId) => {
                console.log(`✅ Document ${docId} has ${itemIds.size} read news items:`, Array.from(itemIds));
              });
            }
          } catch (error) {
            console.error('❌ news-grid: Error fetching user interactions:', error);
          }
        }
        
        // Step 3: Mark articles as read based on user history with new structure
        const processedNewsItems = allNewsItems.map(item => {
          // For each news item, check if it's been read
          let isItemRead = false;
          
          if (item.articleId) {
            // Parse articleId for document ID and news item ID
            const [docId, newsItemIdStr] = item.articleId.split('_');
            const newsItemId = parseInt(newsItemIdStr);
            
            // Check if this document+newsItem combination exists in our read map
            if (docId && !isNaN(newsItemId) && readArticleIds.has(docId)) {
              const readItemsForDoc = readArticleIds.get(docId)!;
              if (readItemsForDoc.has(newsItemId)) {
                isItemRead = true;
                console.log(`📚 DEBUG - News item ${newsItemId} in document ${docId} is marked as read`);
              }
            }
          }
          
          return {
            ...item,
            isRead: isItemRead
          };
        });
        
        // Sort items - unread first, read at the bottom
        processedNewsItems.sort((a, b) => {
          if (a.isRead === b.isRead) return 0;
          return a.isRead ? 1 : -1;
        });
        
        // Before setting state, verify no items have undefined articleIds
        const itemsWithoutArticleId = processedNewsItems.filter(item => !item.articleId);
        if (itemsWithoutArticleId.length > 0) {
          console.error('❌ DEBUG - Some news items are missing articleId:', itemsWithoutArticleId);
          
          // Fix any items without articleId
          processedNewsItems.forEach(item => {
            if (!item.articleId) {
              item.articleId = `emergency-fallback-id-${item.id}`;
              console.log(`🔧 DEBUG - Applied emergency fallback articleId to item ${item.id}: ${item.articleId}`);
            }
          });
        }
        
        console.log(`📊 news-grid: Final news list has ${processedNewsItems.length} items (${processedNewsItems.filter(i => i.isRead).length} read)`);
        console.log('📋 DEBUG - Final news items with articleIds:', 
          processedNewsItems.map(item => ({ id: item.id, title: item.title.substring(0, 20), articleId: item.articleId, isRead: item.isRead }))
        );
        
        setNewsItems(processedNewsItems);
        
        // **** ADDED: Dispatch event with hero news ****
        try {
          // Filter items that have a valid image URL (not placeholder or empty)
          const itemsWithImages = processedNewsItems.filter(item => item.image && !item.image.includes('placeholder.svg'));

          if (itemsWithImages.length > 0) {
            // Shuffle the array and take the first 5 (or fewer if less than 5 available)
            const shuffled = itemsWithImages.sort(() => 0.5 - Math.random());
            const heroNewsData = shuffled.slice(0, 5).map(item => ({
              id: item.id, // Use the original news item ID
              title: item.title,
              summary: item.summary.split('\n\n')[0], // Take first paragraph for summary
              image: item.image,
              category: item.category,
              slug: item.slug,
            }));

            console.log(`🦸 news-grid: Selected ${heroNewsData.length} items for Hero section:`, heroNewsData.map(n => n.slug));

            // Dispatch the custom event with the selected news data
            const heroEvent = new CustomEvent<HeroNewsItem[]>('heroNewsLoaded', { detail: heroNewsData });
            document.dispatchEvent(heroEvent);
            console.log('🔔 news-grid: Dispatched heroNewsLoaded event.');
          } else {
            console.warn('⚠️ news-grid: No suitable news items with images found for Hero section.');
            // Optionally dispatch an empty array or default data
             const heroEvent = new CustomEvent<HeroNewsItem[]>('heroNewsLoaded', { detail: [] });
             document.dispatchEvent(heroEvent);
          }
        } catch (dispatchError) {
           console.error('❌ news-grid: Error preparing or dispatching hero news event:', dispatchError);
        }
        // **** END ADDED ****

      } catch (error) {
        console.error('❌ news-grid: Error in loadNewsAndCheckReadStatus:', error);
      }
    }
    
    loadNewsAndCheckReadStatus();
  }, [userId]); // Re-run when userId changes (login/logout)

// Record article interaction in the database - modified to use new newsItems array structure
const recordArticleInteraction = async (articleId: string, completed: boolean) => {
  if (!userId || !articleId) {
    console.log(`⚠️ news-grid: Cannot record interaction - userId: ${!!userId}, articleId: ${!!articleId}`);
    return;
  }
  
  // Only record if completed=true (article was read)
  if (!completed) {
    console.log(`ℹ️ news-grid: Skipping interaction recording for article ${articleId} - not completed`);
    return;
  }

  // Parse articleId if it contains documentId_newsItemId format
  let documentId, newsItemId;
  
  if (articleId.includes('_')) {
    [documentId, newsItemId] = articleId.split('_');
    console.log(`📊 news-grid: Parsed compound articleId "${articleId}" into documentId: "${documentId}" and newsItemId: "${newsItemId}"`);
  }
  
  const requestData = {
    articleId, // Always send the full articleId
    timeSpent: 5, // Fixed time spent at 5 seconds
    completed: true, // Always true when we record
    // Include these fields for the new structure
    documentId: documentId || undefined,
    newsItemId: newsItemId ? parseInt(newsItemId) || newsItemId : undefined
  };
  
  console.log(`📊 news-grid: Recording completed interaction for article ${articleId}:`, requestData);

  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/api/users/${userId}/interactions`;
    console.log(`🔄 news-grid: Sending POST request to ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ news-grid: Recorded completed interaction for article ${articleId}:`, result);
      
      // Immediately update the UI to show this article as read
      setNewsItems(prevItems => {
        // Find the item with this articleId
        return prevItems.map(item => 
          item.articleId === articleId ? { ...item, isRead: true } : item
        ).sort((a, b) => {
          if (a.isRead === b.isRead) return 0;
          return a.isRead ? 1 : -1; // Sort read items to bottom
        });
      });
      
      return result;
    } else {
      const errorText = await response.text();
      console.error(`❌ news-grid: Failed to record interaction - Status: ${response.status}`, errorText);
    }
  } catch (error) {
    console.error('❌ news-grid: Error recording interaction:', error);
  }
};

  // Comment out old time tracking functions but keep them for reference
  /*
  const startTimeTracking = (id: number) => {
    startTimeRef.current = Date.now();
    console.log(`⏱️ news-grid: Started time tracking for article ID ${id} at ${new Date().toISOString()}`);
    
    // Initialize time spent for this article if needed
    if (!timeSpentRef.current[id]) {
      timeSpentRef.current[id] = 0;
    }
  };
  
  const stopTimeTracking = async (id: number, completed: boolean = false) => {
    if (startTimeRef.current) {
      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000); // Convert to seconds
      timeSpentRef.current[id] = (timeSpentRef.current[id] || 0) + timeSpent;
      
      console.log(`⏱️ news-grid: Stopped time tracking for article ID ${id}. Time spent: ${timeSpent}s, Total: ${timeSpentRef.current[id]}s, Completed: ${completed}`);
      
      // Only record interaction if the article was completed (read)
      if (completed) {
        const newsItem = newsItems.find(item => item.id === id);
        if (newsItem?.articleId && userId) {
          console.log(`📤 news-grid: Article ID ${id} was completed, sending interaction data`);
          // Record the completed interaction with the time spent
          await recordArticleInteraction(
            newsItem.articleId,
            timeSpentRef.current[id], // Use total time spent on this article
            true, // Always true for completed
            100 // 100% read
          );
        } else {
          console.log(`⚠️ news-grid: Cannot send completion data - articleId: ${newsItem?.articleId}, userId: ${userId}`);
        }
      } else {
        console.log(`ℹ️ news-grid: Not recording interaction for article ${id} - not completed`);
      }
      
      startTimeRef.current = null;
    } else {
      console.log(`⚠️ news-grid: Cannot stop time tracking for article ID ${id} - no start time recorded`);
    }
  };
  */

  // Listen for custom events from hero section
  useEffect(() => {
    const handleOpenNewsCard = (event: CustomEvent<{slug: string, title: string, id: number}>) => {
      const { slug, title, id } = event.detail;
      console.log('🔔 news-grid: Received openNewsCard event:', {
        slug,
        title,
        id,
        totalNewsItems: newsItems.length
      });
      
      // Find the news item by ID first, then fallback to slug
      const newsItem = newsItems.find(item => item.id === id) || newsItems.find(item => item.slug === slug);
      
      if (newsItem) {
        console.log('✅ news-grid: Found matching news item:', {
          id: newsItem.id,
          title: newsItem.title,
          slug: newsItem.slug
        });
        setExpandedCardId(newsItem.id);
        
        // Scroll the news item into view if it's not visible
        const newsElement = document.getElementById(`news-item-${newsItem.id}`);
        if (newsElement) {
          console.log('✅ news-grid: Scrolling to news item element');
          newsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          console.warn('⚠️ news-grid: Could not find news item element in DOM');
        }
      } else {
        console.warn('⚠️ news-grid: No matching news item found:', {
          requestedId: id,
          requestedSlug: slug,
          availableIds: newsItems.map(item => item.id),
          availableSlugs: newsItems.map(item => item.slug)
        });
      }
    };

    // New handler for category events from sidebar
    const handleOpenNewsCategory = (event: CustomEvent<{category: string}>) => {
      const { category } = event.detail;
      console.log('🔍 news-grid: Received openNewsCategory event for:', category);
      
      // Find the first news item with the matching category
      const newsItem = newsItems.find(item => item.category === category);
      
      if (newsItem) {
        console.log('✅ news-grid: Found matching news item with ID:', newsItem.id);
        setExpandedCardId(newsItem.id);
        
        // Scroll the news item into view
        const newsElement = document.getElementById(`news-item-${newsItem.id}`);
        if (newsElement) {
          newsElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        console.log('⚠️ news-grid: No matching news item found for category:', category);
      }
    };

    // Cast the CustomEvents to any to work around TypeScript event typing issues
    document.addEventListener('openNewsCard', handleOpenNewsCard as any);
    document.addEventListener('openNewsCategory', handleOpenNewsCategory as any);
    
    return () => {
      document.removeEventListener('openNewsCard', handleOpenNewsCard as any);
      document.removeEventListener('openNewsCategory', handleOpenNewsCategory as any);
    };
  }, [newsItems]);

  // Format summary text to convert **text** into headers
  const formatSummaryText = (text: string) => {
    if (!text) return "";
    
    // Split the text by ** markers
    const parts = text.split(/\*\*/);
    
    // If there's an odd number of ** markers (which is valid markdown)
    if (parts.length > 1) {
      return parts.map((part, index) => {
        // Every odd index (0-based) will be a header if it follows markdown pattern
        if (index % 2 === 1) {
          return <h4 className="text-base font-semibold mt-3 mb-2" key={index}>{part}</h4>;
        }
        
        // Format paragraphs with proper spacing
        return part.split('\n\n').map((paragraph, pIndex) => (
          <p key={`${index}-${pIndex}`} className="mb-2">{paragraph}</p>
        ));
      });
    }
    
    // If no ** markers, just split by paragraphs
    return text.split('\n\n').map((paragraph, index) => (
      <p key={index} className="mb-2">{paragraph}</p>
    ));
  };

  // Get size classes for the grid - these will only apply on md+ screens now
  const getCardSizeClasses = (size: string = "medium") => {
    switch (size) {
      case "tiny":
        return "md:col-span-1 md:row-span-1" // Add md: prefix
      case "small":
        return "md:col-span-1 md:row-span-1" // Add md: prefix
      case "medium":
        return "md:col-span-1 md:row-span-2" // Add md: prefix
      case "large":
        return "md:col-span-2 md:row-span-2" // Add md: prefix
      case "wide":
        return "md:col-span-2 md:row-span-1" // Add md: prefix
      case "tall":
        return "md:col-span-1 md:row-span-3" // Add md: prefix
      case "featured":
        return "md:col-span-3 md:row-span-2" // Add md: prefix
      default:
        return "md:col-span-1 md:row-span-1" // Add md: prefix
    }
  }

  // Handle card click to expand - modified to increment view regardless of user login status
  const handleCardClick = async (id: number, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation
    
    // Debug newsItem to diagnose articleId issue
    const newsItem = newsItems.find(item => item.id === id);
    console.log(`🔍 DEBUG - Article being opened:`, {
      id: id,
      title: newsItem?.title,
      articleId: newsItem?.articleId,
      userId: userId
    });

    // If the articleId is undefined, try to fix it immediately
    if (newsItem && !newsItem.articleId) {
      console.warn(`⚠️ DEBUG - Article ${id} is missing articleId, applying emergency fix`);
      
      // Create a fixed copy of the news items with a fallback articleId
      const updatedNewsItems = newsItems.map(item => 
        item.id === id 
          ? { ...item, articleId: `emergency-fix-id-${id}` } 
          : item
      );
      
      // Update the state with the fixed items
      setNewsItems(updatedNewsItems);
      
      // Get the updated item with the emergency articleId
      const fixedItem = updatedNewsItems.find(item => item.id === id);
      console.log(`🔧 DEBUG - Applied emergency articleId fix:`, {
        id: id,
        articleId: fixedItem?.articleId
      });
      
      // Use the fixed item for the rest of this function
      newsItem.articleId = fixedItem?.articleId;
    }

    if (expandedCardId === id) {
      // If clicking the already expanded card, do nothing
      return
    }
    
    // Cancel any existing read timer when opening a new card
    if (articleReadTimerRef.current) {
      clearTimeout(articleReadTimerRef.current);
      articleReadTimerRef.current = null;
    }
    
    // If there was a previously expanded card, close it without tracking time
    if (expandedCardId !== null) {
      console.log(`📌 news-grid: Closing previous article ID ${expandedCardId} before opening new one`);
    }

    setExpandedCardId(id)
    console.log(`📌 news-grid: Opening article ID ${id}`);
    
    // Record the view - modified to work without requiring user login status
    if (newsItem?.articleId) {
      try {
        // Increment view count for the envisage_web item (regardless of user login status)
        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/api/envisage_web/view`;
        console.log(`👁️ news-grid: Sending view increment request to ${url} for article ID ${id} (${newsItem.articleId})`);
        
        // The articleId format is already 'documentId_newsItemId'
        const viewData = {
          articleId: newsItem.articleId,
          newsItemId: id // Send the numerical ID as backup
        };
        
        console.log(`👁️ news-grid: View request data:`, viewData);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(viewData),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log(`✅ news-grid: Successfully incremented view count:`, result);
          // Update local view count
          setNewsItems(prevItems => 
            prevItems.map(item => 
              item.id === id ? { ...item, views: item.views + 1 } : item
            )
          );
        } else {
          const errorText = await response.text();
          console.error(`❌ news-grid: Error incrementing view count - Status: ${response.status}`, errorText);
          
          // Still increment local view count for better UX even if API call fails
          console.log(`⚠️ news-grid: Incrementing local view count despite API error`);
          setNewsItems(prevItems => 
            prevItems.map(item => 
              item.id === id ? { ...item, views: item.views + 1 } : item
            )
          );
          
          // If it's a 404 error, we should log this specially for debugging
          if (response.status === 404) {
            console.log(`⚠️ news-grid: API endpoint not found or news item doesn't exist in database. This may be expected for sample data.`);
          }
        }
      } catch (error) {
        console.error('❌ news-grid: Error incrementing view count:', error);
        
        // Still increment local view count for better UX even if network error occurs
        console.log(`⚠️ news-grid: Incrementing local view count despite network error`);
        setNewsItems(prevItems => 
          prevItems.map(item => 
            item.id === id ? { ...item, views: item.views + 1 } : item
          )
        );
      }
    } else {
      console.log(`⚠️ news-grid: Cannot record view - articleId: ${newsItem?.articleId}`);
      
      // Increment local view count anyway for consistency
      setNewsItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? { ...item, views: item.views + 1 } : item
        )
      );
    }

    // Only start the read timer if user is logged in
    if (userId && newsItem && !newsItem.isRead) {
      console.log(`⏱️ news-grid: Starting 5-second read timer for article ID ${id}`);
      articleReadTimerRef.current = setTimeout(() => {
        console.log(`⏱️ news-grid: 5-second timer completed for article ID ${id}, marking as read`);
        markAsRead(id, true); // true indicates completion
      }, 5000); // 5 seconds
    }
  }

  // Toggle bookmark status
  const toggleBookmark = (id: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card from opening
    setNewsItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item)),
    )
  }

  // Share article
  const shareArticle = (id: number, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card from opening
    const article = newsItems.find((item) => item.id === id)
    if (article) {
      // In a real app, this would use the Web Share API or a custom share dialog
      alert(`Sharing article: ${article.title}`)
    }
  }

  // Handle scroll within expanded card to detect if user reached the bottom
  const handleCardScroll = () => {
    if (!expandedCardId || !expandedCardRef.current) return;

    // Debounce scroll events
    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }

    scrollDebounceTimerRef.current = setTimeout(() => {
      const card = expandedCardRef.current;
      if (!card) return;
      
      // Calculate how close to the bottom we are (in pixels)
      const scrollPosition = card.scrollTop + card.clientHeight;
      const scrollMax = card.scrollHeight;
      const scrollRemaining = scrollMax - scrollPosition;
      
      // Define what "reaching the bottom" means: within 30px of the bottom
      const reachedBottom = scrollRemaining <= 30;
      
      // Log the scroll position to help debug
      console.log(`📜 news-grid: Scroll position for article ${expandedCardId}: ` +
        `${Math.round(scrollPosition)}/${Math.round(scrollMax)} (${Math.round(scrollRemaining)}px remaining), ` +
        `reached bottom: ${reachedBottom}`);
      
      // Only mark as read if the user has scrolled to the bottom
      if (reachedBottom && expandedCardId) {
        console.log(`📚 news-grid: User scrolled to bottom of article ${expandedCardId}`);
        markAsRead(expandedCardId, true); // true indicates completion
      }
    }, 200); // 200ms debounce
  };

// Mark a card as read and reorder the list
const markAsRead = async (id: number, completed: boolean = false) => {
  // Skip if already marked as read or already being processed
  const newsItem = newsItems.find(item => item.id === id);
  if (!newsItem || newsItem.isRead || processingMarkAsReadRef.current.has(id)) {
    console.log(`⚠️ news-grid: Skipping markAsRead - Article ID ${id}, already read: ${newsItem?.isRead}, already processing: ${processingMarkAsReadRef.current.has(id)}`);
    return;
  }
  
  // Add to processing set to prevent duplicate calls
  processingMarkAsReadRef.current.add(id);
  
  console.log(`📚 news-grid: Marking article ID ${id} as read, completed: ${completed}`);
  
  try {
    // Only record completion if the user actually completed reading the article
    if (completed && newsItem.articleId && userId) {
      console.log(`📚 news-grid: Article ID ${id} completed, recording interaction`);
      
      // Show encouraging toast message
      const randomMessage = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];
      setToastMessage(randomMessage);
      setShowToast(true);
      
      // Hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
      
      // Set animating card ID for visual feedback
      setAnimatingCardId(id);
      
      // Direct call to recordArticleInteraction with modified arguments
      await recordArticleInteraction(
        newsItem.articleId,
        true // completed
      );
      
      // Update UI to mark as read - this is now done in recordArticleInteraction
      // for better synchronization with the database
    } else {
      console.log(`📌 news-grid: Not marking article ${id} as read because completed=${completed}`);
    }
  } catch (error) {
    console.error(`❌ news-grid: Error in markAsRead for article ${id}:`, error);
    
    // Update UI even if there was an error with the API
    if (completed) {
      setNewsItems(prevItems => {
        // Create a new array with the target item marked as read
        const updatedItems = prevItems.map(item => 
          item.id === id ? { ...item, isRead: true } : item
        );

        // Sort to move read items to the bottom
        return updatedItems.sort((a, b) => {
          if (a.isRead === b.isRead) return 0;
          return a.isRead ? 1 : -1;
        });
      });
    }
  } finally {
    // Remove from processing set now that we're done
    processingMarkAsReadRef.current.delete(id);
  }
};

  // Close expanded card
  const closeExpandedCard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Cancel any existing read timer
    if (articleReadTimerRef.current) {
      clearTimeout(articleReadTimerRef.current);
      articleReadTimerRef.current = null;
    }
    
    if (expandedCardId !== null) {
      console.log(`📌 news-grid: Closing article ID ${expandedCardId}`);
      
      // Get the current scroll position
      const card = expandedCardRef.current;
      if (card) {
        const scrollPosition = card.scrollTop + card.clientHeight;
        const scrollMax = card.scrollHeight;
        const scrollRemaining = scrollMax - scrollPosition;
        const scrollPercentage = Math.min(100, Math.round((scrollPosition / scrollMax) * 100));
        const reachedBottom = scrollRemaining <= 30;
        
        console.log(`📜 news-grid: Article ${expandedCardId} read percentage: ${scrollPercentage}%`);
        
        // Consider as completed if scrolled at least 80% through the article
        const consideredCompleted = scrollPercentage >= 80;
        
        // If the article is considered completed (reached bottom or read most of it)
        if (consideredCompleted) {
          const newsItem = newsItems.find(item => item.id === expandedCardId);
          if (newsItem && !newsItem.isRead) {
            console.log(`📚 news-grid: User read most/all of article ${expandedCardId}, marking as read`);
            await markAsRead(expandedCardId, true);
          }
        } else {
          console.log(`📌 news-grid: User only read ${scrollPercentage}% of article ${expandedCardId}, not marking as completed`);
        }
      }
      
      // Set animating card ID for animation on close
      const currentItem = newsItems.find(item => item.id === expandedCardId);
      if (currentItem && currentItem.isRead) {
        setAnimatingCardId(expandedCardId);
      }
    }
    
    setExpandedCardId(null);
    
    if (scrollDebounceTimerRef.current) {
      clearTimeout(scrollDebounceTimerRef.current);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (scrollDebounceTimerRef.current) {
        clearTimeout(scrollDebounceTimerRef.current);
      }
      
      if (articleReadTimerRef.current) {
        clearTimeout(articleReadTimerRef.current);
      }
    };
  }, []);

  // Add effect to handle the timer when expanded card ID changes
  useEffect(() => {
    // Cancel any previous timer
    if (articleReadTimerRef.current) {
      clearTimeout(articleReadTimerRef.current);
      articleReadTimerRef.current = null;
    }
    
    // Start new timer for the current article if not already read
    if (expandedCardId !== null) {
      const newsItem = newsItems.find(item => item.id === expandedCardId);
      if (newsItem && !newsItem.isRead) {
        console.log(`⏱️ news-grid: Starting 5-second read timer for article ID ${expandedCardId}`);
        
        articleReadTimerRef.current = setTimeout(() => {
          console.log(`⏱️ news-grid: 5-second timer completed for article ID ${expandedCardId}, marking as read`);
          markAsRead(expandedCardId, true);
        }, 5000); // 5 seconds
      }
    }
    
    return () => {
      if (articleReadTimerRef.current) {
        clearTimeout(articleReadTimerRef.current);
        articleReadTimerRef.current = null;
      }
    };
  }, [expandedCardId, newsItems]);

  // After animation completes, reorder the list
  useEffect(() => {
    if (animatingCardId !== null) {
      const timeoutId = setTimeout(() => {
        setNewsItems((prevItems) => {
          // Sort the array to push read items to the bottom
          return [...prevItems].sort((a, b) => {
            if (a.isRead === b.isRead) return 0;
            return a.isRead ? 1 : -1;
          });
        });
        setAnimatingCardId(null);
      }, 500); // Wait for animation to complete

      return () => clearTimeout(timeoutId);
    }
  }, [animatingCardId]);

  // Count unread articles
  const unreadCount = newsItems.filter((item) => !item.isRead).length;

  // Get reading time
  const getReadingTime = (item: NewsItem) => {
    return item.readTime || `${Math.floor(item.summary.length / 300) + 2} min`;
  };

  // Add the search function
  const searchNewsItems = (query: string) => {
    if (!query.trim()) {
      setFilteredNewsItems([]);
      setIsSearching(false);
      return;
    }

    const searchTerms = query.toLowerCase().split(' ');
    
    const results = newsItems.filter(item => {
      const searchableText = `${item.title} ${item.summary} ${item.category}`.toLowerCase();
      return searchTerms.every(term => searchableText.includes(term));
    });

    setFilteredNewsItems(results);
    setIsSearching(true);
  };

  // Update the handleSearchResults function to convert SearchResult to NewsItem
  const handleSearchResults = (results: SearchResult[]) => {
    // Convert SearchResult to NewsItem by finding matching items in newsItems
    const matchingItems = results.map(result => 
      newsItems.find(item => item.id === result.id)
    ).filter((item): item is NewsItem => item !== undefined);
    
    setFilteredNewsItems(matchingItems);
    setIsSearching(true);
  };

  // Add the navigate to news item function
  const navigateToNewsItem = (slug: string) => {
    const newsItem = newsItems.find(item => item.slug === slug);
    if (newsItem) {
      setExpandedCardId(newsItem.id);
      // Scroll to the news item
      const element = document.getElementById(`news-item-${newsItem.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Update the return statement to use filteredNewsItems when searching
  const displayItems = isSearching ? filteredNewsItems : newsItems;

  // Add this useEffect for search event listeners
  useEffect(() => {
    const handleNewsSearch = (event: CustomEvent<SearchResult[]>) => {
      handleSearchResults(event.detail);
    };

    const handleNewsSelect = (event: CustomEvent<{slug: string}>) => {
      navigateToNewsItem(event.detail.slug);
    };

    document.addEventListener('newsSearch', handleNewsSearch as EventListener);
    document.addEventListener('newsSelect', handleNewsSelect as EventListener);

    return () => {
      document.removeEventListener('newsSearch', handleNewsSearch as EventListener);
      document.removeEventListener('newsSelect', handleNewsSelect as EventListener);
    };
  }, []);

  // Add this effect after the existing useEffect hooks
  useEffect(() => {
    // Only dispatch if we have items
    if (newsItems.length > 0) {
      console.log('📡 NewsGrid: Preparing to dispatch newsItemsLoaded event')
      console.log('📊 NewsGrid: Number of items to dispatch:', newsItems.length)
      
      // Create a cache key based on the items
      const cacheKey = newsItems.map(item => `${item.id}-${item.category}`).join('|')
      
      // Check if we've already dispatched these items
      if (window.__newsItemsCache !== cacheKey) {
        console.log('📡 NewsGrid: Dispatching newsItemsLoaded event')
        
        // Create the event with all necessary data
        const newsItemsEvent = new CustomEvent('newsItemsLoaded', { 
          detail: newsItems.map(item => {
            console.log(`📝 NewsGrid: Preparing item ${item.id} for dispatch - Category: ${item.category}, Image: ${item.image}`)
            return {
              id: item.id,
              title: item.title,
              summary: item.summary,
              category: item.category,
              slug: item.slug,
              image: item.image || "/placeholder.svg",
              date: item.date,
              views: item.views,
              readTime: item.readTime,
              articleCount: item.articleCount,
              sourceCount: item.sourceCount,
              images: item.images // Include the images array if available
            }
          })
        });
        
        // Dispatch the event
        document.dispatchEvent(newsItemsEvent);
        console.log('✅ NewsGrid: Dispatched newsItemsLoaded event')
        
        // Store the cache key
        window.__newsItemsCache = cacheKey
      } else {
        console.log('⏭️ NewsGrid: Skipping dispatch - items already cached')
      }
    } else {
      console.log('⚠️ NewsGrid: No items to dispatch')
    }
  }, [newsItems]);

  // Add a new effect to handle the "Read Full Story" button click
  useEffect(() => {
    const handleReadFullStory = (event: CustomEvent<{id: number, category: string}>) => {
      console.log('📖 NewsGrid: Received readFullStory event:', event.detail)
      const { id, category } = event.detail
      
      // Find the news item
      const newsItem = newsItems.find(item => item.id === id)
      if (newsItem) {
        console.log('✅ NewsGrid: Found news item:', newsItem)
        // Dispatch the newsItemsLoaded event with just this item
        const event = new CustomEvent('newsItemsLoaded', {
          detail: [newsItem]
        })
        document.dispatchEvent(event)
        console.log('✅ NewsGrid: Dispatched single item event')
      } else {
        console.error('❌ NewsGrid: News item not found:', id)
      }
    }

    document.addEventListener('readFullStory', handleReadFullStory as EventListener)
    return () => {
      document.removeEventListener('readFullStory', handleReadFullStory as EventListener)
    }
  }, [newsItems])

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Today's Top Stories</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {unreadCount} unread stories • {totalReadingTime} min total
          </span>
        </div>
      </div>

      {/* Grid layout with responsive columns/flow */}
      {/* Below md: single vertical column */}
      {/* md and up: multi-column, multi-row grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:auto-rows-[minmax(150px,auto)] lg:grid-cols-3"> {/* Changed base to grid-cols-1, removed flow/overflow/pb */}
        {displayItems.map((news) => (
          <motion.div
            key={news.id}
            // Base styles for small screens (single column, full width)
            // Apply size classes conditionally for md+ screens
            className={`relative w-full ${getCardSizeClasses(news.size)}`} // Removed fixed h/w, flex-shrink
            layout // Be mindful layout animations might be complex with grid changes
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              // Adjust animation for read state if needed, might conflict with layout changes
              y: animatingCardId === news.id && news.isRead ? 20 : 0,
              zIndex: animatingCardId === news.id ? 10 : 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            id={`news-item-${news.id}`}
          >
            {/* Ensure inner div takes full height */}
            <div
              className={`h-full ${expandedCardId === news.id ? "hidden" : "block"}`}
              onMouseEnter={() => setHoveredCardId(news.id)}
              onMouseLeave={() => setHoveredCardId(null)}
            >
              <motion.div
                whileHover={{ scale: 1.03, zIndex: 5 }} // This will apply on all screen sizes
                onClick={(e) => handleCardClick(news.id, e)}
                className="cursor-pointer h-full"
              >
                <Card
                  // Ensure card takes full height of its container
                  className={`overflow-hidden h-full border-2 transition-all duration-300 relative ${
                    news.isRead ? "border-muted bg-muted/20" : "border-primary/20 hover:border-primary/50"
                  }`}
                >
                  {/* Fading background image */}
                  <div className="absolute inset-0 z-0 opacity-15">
                    <Image
                      src={news.image || "/placeholder.svg"}
                      alt=""
                      fill
                      className="object-cover"
                      priority={news.id < 5}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
                  </div>

                  <div className="p-4 h-full flex flex-col relative z-10">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-primary/10 text-primary border-none mb-2">
                        {news.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${hoveredCardId === news.id ? "opacity-100" : "opacity-0"} transition-opacity`}
                          onClick={(e) => toggleBookmark(news.id, e)}
                        >
                          {news.isBookmarked ? (
                            <BookMarked className="h-4 w-4 text-primary" /> // Changed from BookmarkCheck
                          ) : (
                            <Bookmark className="h-4 w-4" />
                          )}
                          <span className="sr-only">Bookmark</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${hoveredCardId === news.id ? "opacity-100" : "opacity-0"} transition-opacity`}
                          onClick={(e) => shareArticle(news.id, e)}
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="sr-only">Share</span>
                        </Button>
                      </div>
                    </div>

                    <h3 className="font-bold text-base md:text-lg mb-auto line-clamp-3">{news.title}</h3>

                    <p className="text-sm text-muted-foreground line-clamp-2 md:line-clamp-3 mt-2">
                      {news.summary.split("\n\n")[0]}
                    </p>

                    {/* Article and source count badge - if available */}
                    {news.articleCount && news.sourceCount && (
                      <div className="hidden md:block mt-2 mb-1 text-xs text-muted-foreground">
                        {news.articleCount} Articles • {news.sourceCount} Sources
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-transparent"> {/* Added pt-2 and border */}
                      <span className="text-xs text-muted-foreground">{news.date}</span>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Eye className="h-3 w-3 mr-1" />
                        {news.views.toLocaleString()}
                      </div>
                    </div>

                    {/* Read indicator */}
                    {news.isRead && (
                      <div className="absolute top-2 right-2 bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                        Read
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Expanded card modal */}
      <AnimatePresence>
        {expandedCardId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-sm"
            onClick={closeExpandedCard}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              ref={expandedCardRef}
              onScroll={handleCardScroll}
            >
              <Card className="overflow-hidden">
                <div className="relative h-64 md:h-80 w-full">
                  <Image
                    src={newsItems.find((item) => item.id === expandedCardId)?.image || "/placeholder.svg"}
                    alt={newsItems.find((item) => item.id === expandedCardId)?.title || ""}
                    fill
                    className="object-cover"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                    onClick={closeExpandedCard}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <Badge variant="outline" className="bg-primary/90 text-primary-foreground border-none">
                      {newsItems.find((item) => item.id === expandedCardId)?.category}
                    </Badge>
                    <Badge variant="outline" className="bg-black/70 text-white border-none">
                      {newsItems.find((item) => item.id === expandedCardId)?.date}
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">
                      {newsItems.find((item) => item.id === expandedCardId)?.title}
                    </h2>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {newsItems.find((item) => item.id === expandedCardId)?.readTime || "5 min"} read
                    </div>
                  </div>
                  <div className="w-full h-0.5 bg-primary my-4"></div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-4">
                    <span>Published {newsItems.find((item) => item.id === expandedCardId)?.date}</span>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {newsItems.find((item) => item.id === expandedCardId)?.views.toLocaleString()} views
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {formatSummaryText(newsItems.find((item) => item.id === expandedCardId)?.summary || "")}
                  </div>
                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={closeExpandedCard}>
                      Close
                    </Button>
                    <Link href={`/blog/${newsItems.find((item) => item.id === expandedCardId)?.category.toLowerCase()}?id=${expandedCardId}`}>
                      <Button>Read Full Article</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast notification for read completion */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-4 left-1/2 z-50 transform -translate-x-1/2"
          >
            <Toast className="bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="font-medium">{toastMessage}</span>
              </div>
            </Toast>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

