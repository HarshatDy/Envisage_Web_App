"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Home, X, ChevronDown, User, LogOut, Settings } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SearchBar } from "@/components/SearchBar"
import { UserProfileDropdown } from './UserProfileDropdown'

// Add this interface near the top of the file
interface SearchResult {
  id: number;
  title: string;
  summary: string;
  category: string;
  slug: string;
  image: string;
}

// Add this interface near the top with other interfaces
interface NewsItem {
  id: number;
  title: string;
  summary: string;
  category: string;
  slug: string;
  image: string;
}

const categories = [
  { name: "Politics", href: "/category/politics" },
  { name: "Technology", href: "/category/technology" },
  { name: "Business", href: "/category/business" },
  { name: "Sports", href: "/category/sports" },
  { name: "Entertainment", href: "/category/entertainment" },
  { name: "Science", href: "/category/science" },
  { name: "Health", href: "/category/health" },
]

export default function Navbar() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState("")
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])

  // Add this effect to listen for news items
  useEffect(() => {
    const handleNewsItemsLoaded = (event: CustomEvent<NewsItem[]>) => {
      setNewsItems(event.detail)
    }

    document.addEventListener('newsItemsLoaded', handleNewsItemsLoaded as EventListener)
    return () => {
      document.removeEventListener('newsItemsLoaded', handleNewsItemsLoaded as EventListener)
    }
  }, [])

  const handleSearch = (results: SearchResult[]) => {
    // You can add additional search handling logic here if needed
    console.log('Search results:', results)
  }

  const handleSelect = (slug: string) => {
    // Navigate to the selected news item
    window.location.href = `/news/${slug}`
  }

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  // Helper function to get a safe image URL
  const getProfileImageUrl = () => {
    if (!session?.user?.image) return null
    
    // If the image is a relative path, make it absolute
    if (session.user.image.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}${session.user.image}`
    }
    
    return session.user.image
  }

  const profileImageUrl = getProfileImageUrl()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between" style={{ fontFamily: "'Unbounded', sans-serif" }}>
        {/* Left section - Home link (desktop only) */}
        <div className="hidden md:flex items-center space-x-8">
          <Link href="/" className="text-base font-medium transition-colors hover:text-primary">
            Home
          </Link>
          <Link 
            href="/creator" 
            className="text-base hover:text-primary transition-colors"
            style={{ fontFamily: "'Bungee Spice', sans-serif" }}
          >
            MEET THE CREATOR
          </Link>
        </div>

        {/* Logo - Centered on desktop, left on mobile */}
        <div className="absolute left-1/2 transform -translate-x-1/2 max-md:relative max-md:left-0 max-md:transform-none">
          <Link href="/" className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <span className="text-xl font-bold">SummariseMe</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="italic">"Too much info? We simplify the world's news for you."</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Link>
        </div>

        {/* Right section - Theme, Login/Profile */}
        <div className="flex items-center space-x-4">
          <SearchBar 
            onSearch={handleSearch}
            onSelect={handleSelect}
            newsItems={newsItems}
          />
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          
          {status === "authenticated" && session ? (
            <UserProfileDropdown />
          ) : (
            <Button variant="outline" size="sm" asChild className="h-9 px-4 text-sm">
              <Link href="/login">
                <span className="hidden lg:inline">Login</span>
                <span className="lg:hidden" style={{ fontFamily: "'Bungee Spice', sans-serif" }}>LOGIN</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}

