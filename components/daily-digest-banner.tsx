"use client"

import { useState, useEffect } from "react"
import { Clock, Coffee, BookOpen, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"

// Define interface for user article interaction
interface UserArticleInteraction {
  _id: string
  userId: string
  articleId: string
  documentId?: string
  timeSpent: number
  completed: boolean
  interactionDate: string
  newsItems?: Array<{
    newsItemId: number
    timeSpent: number
    completed: boolean
    interactionDate: string
  }>
}

export default function DailyDigestBanner() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [progress, setProgress] = useState(0)
  const [digestPeriod, setDigestPeriod] = useState("")
  const [articlesRead, setArticlesRead] = useState(0)
  const [totalArticles, setTotalArticles] = useState(10) // Default value
  const [isLoadingArticles, setIsLoadingArticles] = useState(false)
  const { data: session } = useSession()

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Calculate progress based on current time period
  useEffect(() => {
    const now = currentTime
    const hours = now.getHours()
    const minutes = now.getMinutes()
    
    let calculatedProgress = 0
    let currentPeriod = ""

    // Check which time period we're in
    if (hours >= 6 && hours < 18) {
      // Day period: 6am to 6pm
      currentPeriod = "6am - 6pm"
      
      // Calculate minutes since 6am
      const currentMinutes = (hours - 6) * 60 + minutes
      // Total minutes in period (12 hours)
      const totalMinutes = 12 * 60
      
      calculatedProgress = Math.min(100, Math.max(0, (currentMinutes / totalMinutes) * 100))
    } else {
      // Night period: 6pm to 6am
      currentPeriod = "6pm - 6am"
      
      // Handle the night period which spans across midnight
      let currentMinutes = 0
      
      if (hours >= 18) {
        // After 6pm, before midnight
        currentMinutes = (hours - 18) * 60 + minutes
      } else {
        // After midnight, before 6am
        currentMinutes = (hours + 6) * 60 + minutes
      }
      
      // Total minutes in period (12 hours)
      const totalMinutes = 12 * 60
      
      calculatedProgress = Math.min(100, Math.max(0, (currentMinutes / totalMinutes) * 100))
    }

    setProgress(calculatedProgress)
    setDigestPeriod(currentPeriod)
  }, [currentTime])
  
  // Fetch user reading progress and available articles
  useEffect(() => {
    const fetchArticleData = async () => {
      try {
        setIsLoadingArticles(true)
        
        // Get total articles from current digest period (from envisage_web)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/envisage_web`)
        if (response.ok) {
          const data = await response.json()
          console.log(`✅ daily-digest: Loaded envisage_web data`)
          
          // Find the date key
          const dateKey = data.envisage_web ? Object.keys(data.envisage_web)[0] : null;

          // Check if the data contains newsItems array
          if (dateKey && data.envisage_web && data.envisage_web[dateKey] && 
              data.envisage_web[dateKey].newsItems && Array.isArray(data.envisage_web[dateKey].newsItems)) {
            setTotalArticles(data.envisage_web[dateKey].newsItems.length)
          } else {
            console.error('❌ daily-digest: Invalid data structure in envisage_web');
            console.log('❌ DEBUG - Invalid envisage_web structure received:', {
              hasResult: !!data,
              resultType: typeof data,
              hasEnvisageWeb: !!data.envisage_web,
              dateKey: dateKey,
              hasNewsItems: !!(data.envisage_web && dateKey && data.envisage_web[dateKey].newsItems),
              newsItemsType: data.envisage_web && dateKey && data.envisage_web[dateKey] ? 
                typeof data.envisage_web[dateKey].newsItems : 'undefined',
              isArray: !!(data.envisage_web && dateKey && data.envisage_web[dateKey].newsItems && 
                Array.isArray(data.envisage_web[dateKey].newsItems))
            });
          }
        } else {
          console.error(`❌ daily-digest: Error fetching envisage_web - Status: ${response.status}`);
          const errorText = await response.text();
          console.error('❌ DEBUG - Error response text:', errorText);
        }
        
        // If user is logged in, fetch their article interactions
        if (session?.user?.id) {
          const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/${session.user.id}/interactions?completed=true`)
          const userData = await userResponse.json()
          
          console.log('🔍 daily-digest: Fetched user interactions data:', userData);
          
          if (userData && userData.interactions) {
            // Debug: Log all interactions with completed newsItems
            console.log('📋 daily-digest: All interactions received:', userData.interactions.length);
            
            // Extract and log all completed newsItems across all interactions
            const allCompletedNewsItems = userData.interactions.flatMap((interaction: UserArticleInteraction) => {
              if (interaction.newsItems && Array.isArray(interaction.newsItems)) {
                const completedItems = interaction.newsItems
                  .filter(item => item.completed)
                  .map(item => ({
                    newsItemId: item.newsItemId,
                    documentId: interaction.documentId || 'missing-doc-id',
                    interactionDate: item.interactionDate || interaction.interactionDate
                  }));
                
                return completedItems;
              }
              return [];
            });
            
            console.log(`✅ daily-digest: Found ${allCompletedNewsItems.length} completed news items:`, allCompletedNewsItems);
            
            // Filter interactions for current digest period
            const now = new Date()
            const startHour = now.getHours() >= 6 && now.getHours() < 18 ? 6 : 18
            const startDate = new Date(now)
            startDate.setHours(startHour, 0, 0, 0)
            
            // Count interactions after the start of current period
            const currentInteractions = userData.interactions.filter(
              (interaction: UserArticleInteraction) => new Date(interaction.interactionDate) >= startDate && interaction.completed
            )
            
            // Debug: Log current period interactions
            console.log(`📆 daily-digest: Current period (since ${startDate.toISOString()}) has ${currentInteractions.length} interactions`);
            
            // Extract and log all completed newsItems for the current period
            const currentPeriodCompletedItems = currentInteractions.flatMap((interaction: UserArticleInteraction) => {
              if (interaction.newsItems && Array.isArray(interaction.newsItems)) {
                const completedItems = interaction.newsItems
                  .filter(item => {
                    const itemDate = item.interactionDate ? new Date(item.interactionDate) : new Date(interaction.interactionDate);
                    return item.completed && itemDate >= startDate;
                  })
                  .map(item => ({
                    newsItemId: item.newsItemId,
                    documentId: interaction.documentId || 'missing-doc-id',
                    interactionDate: item.interactionDate || interaction.interactionDate
                  }));
                
                return completedItems;
              }
              return [];
            });
            
            console.log(`🔢 daily-digest: Found ${currentPeriodCompletedItems.length} completed news items for current period:`, currentPeriodCompletedItems);
            
            // Set the articles read count - using the more precise newsItems count if available
            const articlesReadCount = currentPeriodCompletedItems.length || currentInteractions.length;
            setArticlesRead(articlesReadCount);
            console.log(`📚 daily-digest: Setting articlesRead to ${articlesReadCount}`);
          } else {
            console.log('⚠️ daily-digest: No interactions data available');
          }
        }
      } catch (error) {
        console.error("❌ daily-digest: Error fetching article data:", error)
        console.log('⚠️ daily-digest: Using default values due to fetch error')
      } finally {
        setIsLoadingArticles(false)
      }
    }
    
    fetchArticleData()
  }, [session])
  
  // Calculate article progress percentage
  const articleProgressPercentage = totalArticles > 0 
    ? Math.min(100, Math.round((articlesRead / totalArticles) * 100))
    : 0

  // Format the current time
  const formattedTime = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  // Calculate estimated reading time (20 minutes total)
  const estimatedReadingTime = 20

  return (
    <Card className="mt-8 bg-gradient-to-r from-[#3B82F6]/10 to-[#3B82F6]/5 border-[#3B82F6]/20">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Clock className="mr-2 h-6 w-6 text-[#3B82F6]" />
              Today's Digest: {digestPeriod}
            </h2>
            <p className="text-muted-foreground">
              Stay ahead of the world in just 20 minutes. Everything that matters, curated for you.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-background/80 p-3 rounded-lg shadow-sm">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Current Time</div>
              <div className="font-bold text-lg">{formattedTime}</div>
            </div>

            <div className="h-10 w-px bg-border"></div>

            <div className="text-center flex items-center gap-2">
              <Coffee className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm text-muted-foreground">Reading Time</div>
                <div className="font-bold text-lg">{estimatedReadingTime} mins</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>{digestPeriod.split(" - ")[0]}</span>
            <span>{digestPeriod.split(" - ")[1]}</span>
          </div>
          <Progress value={progress} className="h-2 bg-gray-200 [&>*]:bg-[#3B82F6]" />
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {progress < 100 ? "News coverage in progress" : "Today's digest complete"}
          </div>
        </div>
        
        {/* User Article Progress */}
        <div className="mt-4 relative">
          {!session && (
            <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center z-10 bg-background/30 rounded">
              <div className="text-center">
                <Lock className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <Button variant="outline" size="sm">Login to see your progress</Button>
              </div>
            </div>
          )}
          <div className="flex justify-between text-sm mb-1">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 mr-1 text-[#3B82F6]" />
              <span>Your Reading Progress</span>
            </div>
            <span>
              {isLoadingArticles ? "Loading..." : `${articlesRead}/${totalArticles} articles`}
            </span>
          </div>
          <Progress value={articleProgressPercentage} className="h-2 bg-gray-200 [&>*]:bg-[#3B82F6]" />
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {isLoadingArticles
              ? "Calculating your progress..."
              : articleProgressPercentage >= 100
                ? "You've read all articles for this period!"
                : `${totalArticles - articlesRead} articles remaining`
            }
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

