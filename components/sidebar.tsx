"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react"

// Initialize with empty arrays instead of dummy data
const initialTrendingTopics: string[] = []
const initialPopularNews: { id: number; title: string; slug: string }[] = []

// Add interface for NewsItem to properly type the items
interface NewsItem {
  id: number;
  title: string;
  summary?: string;
  image?: string;
  category: string;
  date?: string;
  slug: string;
  views: number;
  isRead?: boolean;
  articleCount?: number;
  sourceCount?: number;
}

// Sample stock recommendations
const stockRecommendations = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 182.63,
    change: 1.25,
    changePercent: 0.69,
    recommendation: "Buy",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 415.32,
    change: 3.78,
    changePercent: 0.92,
    recommendation: "Strong Buy",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.17,
    change: -0.83,
    changePercent: -0.58,
    recommendation: "Hold",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 178.12,
    change: 2.34,
    changePercent: 1.33,
    recommendation: "Buy",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 175.43,
    change: -3.21,
    changePercent: -1.8,
    recommendation: "Hold",
  },
]

export default function Sidebar() {
  const [trendingTopics, setTrendingTopics] = useState(initialTrendingTopics)
  const [popularNews, setPopularNews] = useState(initialPopularNews)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTopNewsAndTopics = async () => {
      try {
        setIsLoading(true)
        console.log("Sidebar: Starting to fetch news and topics")
        
        // Get current time period based on the rules:
        // - 6am to 6pm: Use current day YYYY-MM-DD_06:00
        // - 6pm to 6am next day: Use current day YYYY-MM-DD_18:00
        const now = new Date()
        const hours = now.getHours()
        
        // Create date object for the target period
        let targetDate = new Date(now)
        let hourKey = "06:00"
        
        if (hours >= 6 && hours < 18) {
          // Morning/afternoon period (6am-6pm): Use current day 06:00
          targetDate.setHours(6, 0, 0, 0)
          hourKey = "06:00"
        } else {
          // Evening/night period (6pm-6am): Use previous/current day 18:00
          if (hours < 6) {
            // After midnight but before 6am - use previous day's 18:00
            targetDate.setDate(targetDate.getDate() - 1)
          }
          targetDate.setHours(18, 0, 0, 0)
          hourKey = "18:00"
        }
        
        // Format the date key as YYYY-MM-DD_HH:00
        const year = targetDate.getFullYear()
        const month = String(targetDate.getMonth() + 1).padStart(2, '0')
        const day = String(targetDate.getDate()).padStart(2, '0')
        // const dateKey = `${year}-${month}-${day}_${hourKey}`
        const dateKey = "2025-04-06_18:00"

        
        // Use hardcoded date key for testing that matches the database structure
        const testDateKey = "2025-04-06_18:00"
        
        console.log("Sidebar: Using date key:", dateKey)
        
        // Using the same fetch pattern as in news-grid.tsx
        try {
          // Fetch news items from envisage_web collection
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/api/envisage_web`);
          if (response.ok) {
            const result = await response.json();
            console.log(`Sidebar: Loaded envisage_web data`);
            
            // Get the date key from the result or use the test key
            const actualDateKey = result.envisage_web ? Object.keys(result.envisage_web)[0] : testDateKey;
            console.log("Sidebar: Using actual date key from data:", actualDateKey);

            // Check if the data contains newsItems array
            if (actualDateKey && result.envisage_web && 
                result.envisage_web[actualDateKey] && 
                result.envisage_web[actualDateKey].newsItems && 
                Array.isArray(result.envisage_web[actualDateKey].newsItems)) {
              
              // Get the news items array from the nested structure and cast to NewsItem[] 
              const newsItems: NewsItem[] = result.envisage_web[actualDateKey].newsItems
              console.log("Sidebar: Found newsItems array with", newsItems.length, "items")
              
              // Process news items for popularity
              // Sort by views (descending) to get the most popular first
              const sortedItems = [...newsItems].sort((a, b) => (b.views || 0) - (a.views || 0))
              
              // Take the top 4 most viewed
              const topItems = sortedItems.slice(0, 4)
              
              // Format for the popular news section
              const formattedPopularNews = topItems.map((item: NewsItem) => ({
                id: item.id,
                title: item.title,
                slug: item.slug,
              }))
              console.log("Sidebar: Formatted popular news:", formattedPopularNews)
              
              // Extract categories from all news items
              const allCategories = newsItems
                .map((item: NewsItem) => item.category)
                .filter(Boolean)
              
              console.log("Sidebar: All categories extracted:", allCategories)
              
              // Count occurrences of each category
              const categoryCount: Record<string, number> = {}
              allCategories.forEach((category: string) => {
                categoryCount[category] = (categoryCount[category] || 0) + 1
              })
              
              console.log("Sidebar: Category counts:", categoryCount)
              
              // Sort by count and get the top 5 trending topics
              const topCategories = Object.keys(categoryCount)
                .sort((a, b) => categoryCount[b] - categoryCount[a])
                .slice(0, 5)
              
              console.log("Sidebar: Top categories:", topCategories)
              
              // Update state with the fetched data
              if (formattedPopularNews.length > 0) {
                setPopularNews(formattedPopularNews)
                console.log("Sidebar: Updated popular news state")
              } else {
                console.log("Sidebar: No popular news to update")
              }
              
              if (topCategories.length > 0) {
                setTrendingTopics(topCategories)
                console.log("Sidebar: Updated trending topics state")
              } else {
                console.log("Sidebar: No trending topics to update")
              }
            } else {
              console.log("Sidebar: Could not find news items in the expected structure")
              console.log("Sidebar: Data structure received:", {
                hasEnvisageWeb: !!result.envisageWeb,
                dateKey: actualDateKey,
                hasNewsItems: !!(result.envisage_web && actualDateKey && result.envisage_web[actualDateKey]?.newsItems)
              })
            }
          } else {
            console.error(`Sidebar: Error fetching envisage_web - Status: ${response.status}`)
            const errorText = await response.text()
            console.error('Sidebar: Error response text:', errorText)
          }
        } catch (error) {
          console.error('Sidebar: Error loading news from envisage_web:', error)
        }
      } catch (error) {
        console.error("Sidebar: Error fetching popular news and topics:", error)
        // Leave state with initial empty arrays
      } finally {
        setIsLoading(false)
        console.log("Sidebar: Finished loading data")
      }
    }
    
    fetchTopNewsAndTopics()
    
    // Refresh data every 15 minutes
    const intervalId = setInterval(fetchTopNewsAndTopics, 15 * 60 * 1000)
    console.log("Sidebar: Set up refresh interval")
    
    return () => {
      clearInterval(intervalId)
      console.log("Sidebar: Cleared refresh interval")
    }
  }, [])

  // Function to handle clicking on a trending topic
  const handleTrendingTopicClick = (topic: string, e: React.MouseEvent) => {
    e.preventDefault();
    console.log(`🔍 sidebar: Clicked on trending topic: ${topic}`);

    // Create and dispatch a custom event for the news-grid component to handle
    const event = new CustomEvent('openNewsCategory', {
      detail: { category: topic }
    });
    document.dispatchEvent(event);
  };

  // Function to handle clicking on a popular news item
  const handlePopularNewsClick = (news: { id: number; title: string; slug: string }, e: React.MouseEvent) => {
    e.preventDefault();
    console.log(`🔍 sidebar: Clicked on popular news: ${news.title} (${news.slug})`);

    // Create and dispatch a custom event for the news-grid component to handle
    const event = new CustomEvent('openNewsCard', {
      detail: { slug: news.slug, title: news.title }
    });
    document.dispatchEvent(event);
  };

  return (
    <div className="space-y-6">
      {/* Stock Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stockRecommendations.map((stock) => (
              <div key={stock.symbol} className="group">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{stock.symbol}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted">{stock.recommendation}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${stock.price.toFixed(2)}</div>
                    <div
                      className={`text-xs flex items-center ${
                        stock.change > 0
                          ? "text-green-600 dark:text-green-500"
                          : stock.change < 0
                            ? "text-red-600 dark:text-red-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {stock.change > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : stock.change < 0 ? (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      ) : (
                        <Minus className="h-3 w-3 mr-1" />
                      )}
                      {stock.change > 0 ? "+" : ""}
                      {stock.change.toFixed(2)} ({stock.change > 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
                {stock !== stockRecommendations[stockRecommendations.length - 1] && <Separator className="my-3" />}
              </div>
            ))}
            <div className="text-right">
              <Link href="/finance" className="inline-flex items-center text-sm text-primary hover:underline">
                View all market data <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Trending Topics</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-8 w-24 bg-muted animate-pulse rounded-md" />
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((topic) => (
                <Button 
                  key={topic} 
                  variant="outline" 
                  size="sm" 
                  onClick={(e) => handleTrendingTopicClick(topic, e)}
                >
                  {topic}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Popular News */}
      <Card>
        <CardHeader>
          <CardTitle>Most Read</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-lg text-muted-foreground">{i}</span>
                    <div className="h-5 bg-muted animate-pulse rounded w-full" />
                  </div>
                  {i < 4 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {popularNews.map((news, index) => (
                <div key={news.id}>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-lg text-muted-foreground">{index + 1}</span>
                    <a 
                      href={`#`}
                      className="hover:text-primary transition-colors cursor-pointer"
                      onClick={(e) => handlePopularNewsClick(news, e)}
                    >
                      <h4 className="font-medium">{news.title}</h4>
                    </a>
                  </div>
                  {index < popularNews.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Newsletter Signup */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Stay updated with our daily news digest delivered straight to your inbox.
          </p>
          <form className="space-y-2">
            <Input type="email" placeholder="Your email address" required />
            <Button type="submit" className="w-full">
              Subscribe
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

