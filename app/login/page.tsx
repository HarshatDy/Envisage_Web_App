"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, Plus } from "lucide-react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/" })
    } catch (error) {
      console.error("Google sign-in error:", error)
      setIsLoading(false)
    }
  }

  const handleGitHubSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("github", { callbackUrl: "/" });
    } catch (error) {
      console.error("GitHub sign-in error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome to SummariseMe</CardTitle>
          <CardDescription>Get in to access your personalized news feed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center mb-4">
            <h3 className="text-lg font-medium" style={{ fontFamily: "'Bungee Spice', sans-serif" }}>GET IN</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20 p-2"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <Mail className="h-6 w-6 mb-2" />
              <span className="text-xs">Google</span>
            </Button>

            <Button 
              variant="outline" 
              className="flex flex-col items-center justify-center h-20 p-2" 
              onClick={handleGitHubSignIn}
              disabled={isLoading}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" className="mb-2">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              <span className="text-xs">GitHub</span>
            </Button>

            <div className="flex flex-col items-center justify-center h-20 p-2 border rounded-md border-dashed">
              <Plus className="h-6 w-6 mb-2 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">More</span>
            </div>
          </div>

          <p className="text-sm text-center text-muted-foreground mt-6">
            More login options will be available in future
          </p>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-xs text-muted-foreground italic">
            By continuing, you agree to our <Link href="/terms" className="underline underline-offset-2 hover:text-primary">Terms</Link> and <Link href="/privacy" className="underline underline-offset-2 hover:text-primary">Privacy Policy</Link>.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

