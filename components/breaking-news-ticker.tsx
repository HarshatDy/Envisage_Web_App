"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle } from "lucide-react"

// Sample breaking news data
const breakingNews = [
  "Breaking: Major earthquake hits coastal region, tsunami warnings issued",
  "Just in: Central bank announces surprise interest rate cut",
  "Developing story: Negotiations underway for historic peace agreement",
  "Alert: Severe weather warning issued for eastern regions",
  "Breaking: Major tech company announces revolutionary new product line",
]

export default function BreakingNewsTicker() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const tickerRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused) {
        setCurrentIndex((prev) => (prev === breakingNews.length - 1 ? 0 : prev + 1))
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused])

  return (
    <div
      className="bg-red-600 text-white py-2 px-4 rounded-md flex items-center overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      ref={tickerRef}
    >
      <div className="flex-shrink-0 mr-3 flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span className="font-bold">Breaking News:</span>
      </div>
      <div className="relative overflow-hidden flex-1">
        <div className="whitespace-nowrap overflow-hidden text-ellipsis">{breakingNews[currentIndex]}</div>
      </div>
    </div>
  )
}

