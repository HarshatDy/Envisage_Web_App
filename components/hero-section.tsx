"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// Sample featured news data
const featuredNews = [
  {
    id: 1,
    title: "Global Climate Summit Reaches Historic Agreement on Emissions",
    summary: "World leaders have agreed to unprecedented carbon reduction targets at the latest climate summit.",
    image: "/placeholder.svg?height=600&width=1200",
    category: "Politics",
    slug: "climate-summit-agreement",
  },
  {
    id: 2,
    title: "Tech Giant Unveils Revolutionary AI Assistant",
    summary: "The new AI system can understand and respond to complex human queries with remarkable accuracy.",
    image: "/placeholder.svg?height=600&width=1200",
    category: "Technology",
    slug: "tech-giant-ai-assistant",
  },
  {
    id: 3,
    title: "Major Breakthrough in Renewable Energy Storage",
    summary: "Scientists have developed a new battery technology that could make renewable energy more viable.",
    image: "/placeholder.svg?height=600&width=1200",
    category: "Science",
    slug: "renewable-energy-breakthrough",
  },
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === featuredNews.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? featuredNews.length - 1 : prev - 1))
  }

  // Auto-advance slides
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div className="relative h-[400px] md:h-[500px] w-full">
        {featuredNews.map((news, index) => (
          <div
            key={news.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            <div className="relative h-full w-full">
              <Image
                src={news.image || "/placeholder.svg"}
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
                <Button asChild variant="secondary">
                  <Link href={`/news/${news.slug}`}>Read Full Story</Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 hover:text-white"
        onClick={prevSlide}
      >
        <ChevronLeft className="h-6 w-6" />
        <span className="sr-only">Previous slide</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50 hover:text-white"
        onClick={nextSlide}
      >
        <ChevronRight className="h-6 w-6" />
        <span className="sr-only">Next slide</span>
      </Button>

      {/* Slide indicators */}
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
    </div>
  )
}

