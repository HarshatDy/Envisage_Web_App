"use client"

import { useState, useEffect } from "react"
import { Clock, Coffee } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export default function DailyDigestBanner() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [progress, setProgress] = useState(0)

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  // Calculate progress of the day (6am to 6pm)
  useEffect(() => {
    const now = currentTime
    const hours = now.getHours()
    const minutes = now.getMinutes()

    // Convert current time to minutes since 6am
    const currentMinutesSince6am = (hours < 6 ? hours + 24 : hours) * 60 + minutes - 6 * 60

    // Total minutes between 6am and 6pm
    const totalMinutes = 12 * 60

    // Calculate progress percentage
    let calculatedProgress = Math.min(100, Math.max(0, (currentMinutesSince6am / totalMinutes) * 100))

    // If it's after 6pm, show 100%
    if (hours >= 18 || hours < 6) {
      calculatedProgress = 100
    }

    setProgress(calculatedProgress)
  }, [currentTime])

  // Format the current time
  const formattedTime = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  // Calculate estimated reading time (20 minutes total)
  const estimatedReadingTime = 20

  return (
    <Card className="mt-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center">
              <Clock className="mr-2 h-6 w-6 text-primary" />
              Today's Digest: 6am - 6pm
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
            <span>6:00 AM</span>
            <span>6:00 PM</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-muted-foreground mt-1 text-center">
            {progress < 100 ? "News coverage in progress" : "Today's digest complete"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

