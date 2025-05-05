"use client"

import type React from "react"

import { useState } from "react"
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle search functionality
    console.log("Searching for:", searchQuery)
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
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
            Home
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

        {/* Right section - Creator Link, Theme, Login/Profile */}
        <div className="flex items-center space-x-4">
          <Link 
            href="/creator" 
            className="hidden lg:block hover:text-primary transition-colors"
            style={{ fontFamily: "'Bungee Spice', sans-serif" }}
          >
            MEET THE CREATOR
          </Link>
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          
          {status === "authenticated" && session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full overflow-hidden">
                  {profileImageUrl ? (
                    <Image 
                      src={profileImageUrl} 
                      alt={session.user?.name || "Profile"} 
                      width={32} 
                      height={32} 
                      className="rounded-full h-8 w-8 object-cover"
                      unoptimized={!profileImageUrl.startsWith('http')}
                    />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full overflow-hidden">
                    {profileImageUrl ? (
                      <Image 
                        src={profileImageUrl} 
                        alt={session.user?.name || "Profile"} 
                        width={32} 
                        height={32} 
                        className="h-8 w-8 object-cover"
                        unoptimized={!profileImageUrl.startsWith('http')}
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{session.user?.name}</p>
                    <p className="text-muted-foreground text-xs">{session.user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer flex w-full">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer flex w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

