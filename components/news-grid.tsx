"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, X } from "lucide-react"
import { getNewsFromGemini } from "@/scripts/news_item_creator"

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

export default function NewsGrid() {
  const [newsItems, setNewsItems] = useState(initialNewsItems)
  const [expandedCardId, setExpandedCardId] = useState<number | null>(null)
  const expandedCardRef = useRef<HTMLDivElement>(null)
  const readTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [hoveredCardId, setHoveredCardId] = useState<number | null>(null)

  useEffect(() => {
    // Load news from Gemini when component mounts
    async function loadGeminiNews() {
      console.log('🔄 news-grid: Starting to load Gemini news');
      try {
        console.log('📡 news-grid: Calling getNewsFromGemini()');
        const geminiNews = await getNewsFromGemini();
        console.log(`✅ news-grid: Received ${geminiNews.length} items from Gemini`);
        
        if (geminiNews.length > 0) {
          console.log('📥 news-grid: Updating state with new items');
          setNewsItems(prev => {
            const combined = [...geminiNews, ...prev];
            console.log(`📊 news-grid: Total items after merge: ${combined.length}`);
            return combined;
          });
        }
      } catch (error) {
        console.error('❌ news-grid: Failed to load Gemini news:', error);
      }
    }
    
    loadGeminiNews();
  }, []);

  // Handle card click to expand
  const handleCardClick = (id: number, e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation

    if (expandedCardId === id) {
      // If clicking the already expanded card, do nothing
      return
    }

    setExpandedCardId(id)

    // Start a timer to track reading time (10 seconds for demo purposes)
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current)
    }

    readTimerRef.current = setTimeout(() => {
      // Mark as read after the timer expires and if scrolled to bottom
      const card = expandedCardRef.current
      if (card) {
        const isScrolledToBottom = card.scrollHeight - card.scrollTop <= card.clientHeight + 50 // Within 50px of bottom

        if (isScrolledToBottom) {
          markAsRead(id)
        }
      }
    }, 5000) // 5 seconds for demo purposes
  }

  // Handle scroll within expanded card to detect if user reached the bottom
  const handleCardScroll = () => {
    if (!expandedCardId || !expandedCardRef.current) return

    const card = expandedCardRef.current
    const isScrolledToBottom = card.scrollHeight - card.scrollTop <= card.clientHeight + 50 // Within 50px of bottom

    if (isScrolledToBottom) {
      markAsRead(expandedCardId)
    }
  }

  // Mark a card as read and reorder the list
  const markAsRead = (id: number) => {
    setNewsItems((prevItems) => {
      // Create a new array with the target item marked as read
      const updatedItems = prevItems.map((item) => (item.id === id ? { ...item, isRead: true } : item))

      // Sort the array to push read items to the bottom
      return updatedItems.sort((a, b) => {
        if (a.isRead === b.isRead) return 0
        return a.isRead ? 1 : -1
      })
    })
  }

  // Close expanded card
  const closeExpandedCard = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCardId(null)
    if (readTimerRef.current) {
      clearTimeout(readTimerRef.current)
    }
  }

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (readTimerRef.current) {
        clearTimeout(readTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
      {newsItems.map((news) => (
        <div key={news.id} className="relative">
          {/* Regular card */}
          <div
            className={`${expandedCardId === news.id ? "hidden" : "block"}`}
            onMouseEnter={() => setHoveredCardId(news.id)}
            onMouseLeave={() => setHoveredCardId(null)}
          >
            <div onClick={(e) => handleCardClick(news.id, e)} className="cursor-pointer">
              <Card
                className={`overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative ${news.isRead ? "opacity-75 border-muted" : ""}`}
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={news.image || "/placeholder.svg"}
                    alt={news.title}
                    fill
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge variant="outline" className="bg-primary/90 text-primary-foreground border-none">
                      {news.category}
                    </Badge>
                  </div>

                  {/* Views indicator - visible only when not hovered */}
                  {hoveredCardId !== news.id && (
                    <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      {news.views.toLocaleString()}
                    </div>
                  )}

                  {/* Read indicator */}
                  {news.isRead && (
                    <div className="absolute top-3 right-3 bg-muted text-muted-foreground text-xs px-2 py-1 rounded">
                      Read
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2">{news.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{news.summary}</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Expanded card */}
          {expandedCardId === news.id && (
            <div
              ref={expandedCardRef}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-background/80 backdrop-blur-sm overflow-y-auto"
              onClick={closeExpandedCard}
            >
              <Card
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
                onScroll={handleCardScroll}
              >
                <div className="relative h-64 md:h-80 w-full">
                  <Image src={news.image || "/placeholder.svg"} alt={news.title} fill className="object-cover" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 bg-black/50 text-white hover:bg-black/70 hover:text-white"
                    onClick={closeExpandedCard}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                  <div className="absolute bottom-4 left-4">
                    <Badge variant="outline" className="bg-primary/90 text-primary-foreground border-none">
                      {news.category}
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-2">{news.title}</h2>
                  <div className="w-full h-0.5 bg-primary my-4"></div>
                  <div className="flex justify-between text-sm text-muted-foreground mb-4">
                    <span>{news.date}</span>
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      {news.views.toLocaleString()} views
                    </div>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p>{news.summary}</p>
                    <p>
                      Additional content would appear here in a real article. This expanded view allows users to read
                      the full article without navigating away from the current page.
                    </p>
                    <p>
                      When you scroll to the bottom of this article and spend at least 5 seconds reading, it will be
                      marked as "Read" and moved to the bottom of the news grid.
                    </p>
                    <p>
                      This interaction pattern helps users keep track of what they've already read and prioritizes fresh
                      content at the top of the list.
                    </p>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={closeExpandedCard}>
                      Close
                    </Button>
                    <Link href={`/news/${news.slug}`} passHref>
                      <Button>Read Full Article</Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

