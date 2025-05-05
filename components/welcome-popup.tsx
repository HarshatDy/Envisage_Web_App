"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Clock, BookOpen, BarChart3, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export default function WelcomePopup() {
  const [isOpen, setIsOpen] = useState(false)

  // Show popup after a short delay when page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Check if user has seen the popup before
  useEffect(() => {
    const hasSeenPopup = localStorage.getItem("hasSeenWelcomePopup")
    if (hasSeenPopup) {
      setIsOpen(false)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    // Save to localStorage so it doesn't show again
    localStorage.setItem("hasSeenWelcomePopup", "true")
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto pt-8 pb-8"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-2xl my-auto"
          >
            <Card className="border-primary/20 shadow-lg max-h-[90vh] overflow-y-auto">
              <CardHeader className="pb-4 text-center relative" style={{ fontFamily: "'Unbounded', sans-serif" }}>
                <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={handleClose}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
                <div className="mb-2 text-sm text-primary font-medium">From the Creator of SummarizeMe</div>
                <CardTitle className="text-3xl">Welcome to SummariseMe</CardTitle>
                <p className="text-muted-foreground mt-2">
                  Your daily digest of what truly matters, curated and optimized for busy professionals.
                </p>
              </CardHeader>
              <Separator />
              <CardContent className="pt-6 pb-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Save Time, Stay Informed</h3>
                      <p className="text-sm text-muted-foreground">
                        Digest the day's most important news in just 20 minutes. Our 6am-6pm coverage ensures you never
                        miss what matters.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Smart Reading Experience</h3>
                      <p className="text-sm text-muted-foreground">
                        Articles are formatted for maximum readability with clear sections and focused content.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Track Your Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        See your reading stats, track completed articles, and build a consistent information habit.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="mt-0.5">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">Stay Ahead of the Curve</h3>
                      <p className="text-sm text-muted-foreground">
                        Be better informed than 87% of professionals with our curated, high-signal content.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <p className="text-sm text-center">
                  Create a free account to track your reading progress and customize your daily digest.
                </p>
                <div className="flex justify-center gap-4">
                  <Button onClick={handleClose}>Start Reading</Button>
                  <Button variant="outline" asChild>
                    <a href="/login">Create Account</a>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
