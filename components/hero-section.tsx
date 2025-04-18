"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// Default featured news as fallback (can be kept or simplified)
const defaultFeaturedNews = [
  {
    id: 1,
    title: "Loading Featured News...",
    summary: "Please wait while we fetch the latest headlines.",
    image: "/placeholder.svg?height=600&width=1200",
    category: "General",
    slug: "loading-news",
  },
]

// Define interface for news item received from NewsGrid
interface HeroNewsItem {
  id: number;
  title: string;
  summary: string;
  image: string;
  category: string;
  slug: string;
}

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [featuredNews, setFeaturedNews] = useState<HeroNewsItem[]>(defaultFeaturedNews)

  // Listen for news data from NewsGrid
  useEffect(() => {
    const handleHeroNewsLoaded = (event: CustomEvent<HeroNewsItem[]>) => {
      console.log('🔔 hero-section: Received heroNewsLoaded event with data:', event.detail);
      if (event.detail && event.detail.length > 0) {
        setFeaturedNews(event.detail);
        setCurrentSlide(0); // Reset slide to the first one when new data arrives
      } else {
        console.warn('⚠️ hero-section: Received empty or invalid news data from NewsGrid.');
      }
    };

    document.addEventListener('heroNewsLoaded', handleHeroNewsLoaded as any);

    return () => {
      document.removeEventListener('heroNewsLoaded', handleHeroNewsLoaded as any);
    };
  }, []);

  const nextSlide = () => {
    if (featuredNews.length === 0) return;
    setCurrentSlide((prev) => (prev === featuredNews.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    if (featuredNews.length === 0) return;
    setCurrentSlide((prev) => (prev === 0 ? featuredNews.length - 1 : prev - 1))
  }

  // Auto-advance slides
  useEffect(() => {
    if (featuredNews.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide()
    }, 5000)
    return () => clearInterval(interval)
  }, [featuredNews.length]);

  // Handle click on "Read Full Story"
  const handleReadFullStory = (e: React.MouseEvent, news: HeroNewsItem) => {
    e.preventDefault();

    const openCardEvent = new CustomEvent('openNewsCard', {
      detail: {
        slug: news.slug,
        title: news.title
      }
    });

    document.dispatchEvent(openCardEvent);
    console.log('🔔 hero-section: Dispatched openNewsCard event for:', news.slug);
  };

  // Handle click on the carousel item
  const handleCarouselItemClick = (e: React.MouseEvent, news: HeroNewsItem) => {
    if ((e.target as Element).closest('button')) {
      return;
    }

    e.preventDefault();
    handleReadFullStory(e, news);
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="relative h-[400px] md:h-[500px] w-full">
        {featuredNews.length === 0 || featuredNews[0].slug === 'loading-news' ? (
           <div className="absolute inset-0 flex items-center justify-center bg-muted">
             <div className="text-center">
               <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
               <p className="text-muted-foreground">Loading featured news...</p>
             </div>
           </div>
        ) : (
          featuredNews.map((news, index) => (
            <div
              key={news.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
              onClick={(e) => handleCarouselItemClick(e, news)}
              style={{ cursor: 'pointer' }}
            >
              <div className="relative h-full w-full">
                <Image
                  src={news.image || "/placeholder.svg?height=600&width=1200"}
                  alt={news.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="mb-2">
                    <span className="inline-block bg-primary text-primary-foreground px-2 py-1 text-xs font-semibold rounded">
                      {news.category}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">{news.title}</h2>
                  <p className="text-sm md:text-base mb-4 max-w-3xl">{news.summary}</p>
                  <Button
                    variant="secondary"
                    onClick={(e) => handleReadFullStory(e, news)}
                  >
                    Read Full Story
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {featuredNews.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 hover:text-white"
            onClick={prevSlide}
            disabled={featuredNews.length <= 1}
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="sr-only">Previous slide</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 hover:text-white"
            onClick={nextSlide}
            disabled={featuredNews.length <= 1}
          >
            <ChevronRight className="h-6 w-6" />
            <span className="sr-only">Next slide</span>
          </Button>
        </>
      )}

      {featuredNews.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {featuredNews.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full ${index === currentSlide ? "bg-white" : "bg-white/50"}`}
              onClick={() => setCurrentSlide(index)}
            >
              <span className="sr-only">Go to slide {index + 1}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

