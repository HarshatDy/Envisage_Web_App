"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Clock, Eye, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface BlogPost {
  id: number
  title: string
  summary: string
  image: string
  images?: string[]
  category: string
  date: string
  slug: string
  views: number
  readTime: string
  articleCount?: number
  sourceCount?: number
}

// Add this helper function at the top level
const formatContent = (content: string) => {
  if (!content) return null;

  // First, replace single asterisks with newlines
  const contentWithNewlines = content.replace(/\n\*\n/g, '\n\n');
  
  // Split content into paragraphs
  const paragraphs = contentWithNewlines.split('\n\n');
  
  return paragraphs.map((paragraph, index) => {
    // Skip empty paragraphs
    if (!paragraph.trim()) return null;
    
    // Check if paragraph is a header (starts with ##)
    if (paragraph.startsWith('##')) {
      return (
        <h2 key={index} className="text-2xl font-bold mt-8 mb-4">
          {paragraph.replace('##', '').trim()}
        </h2>
      );
    }
    
    // Check if paragraph is a subheader (starts with **)
    if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
      return (
        <h3 key={index} className="text-xl font-semibold mt-6 mb-3">
          {paragraph.replace(/\*\*/g, '').trim()}
        </h3>
      );
    }
    
    // Handle bullet points
    if (paragraph.includes('* **')) {
      const bulletPoints = paragraph.split('* ').filter(Boolean);
      return (
        <div key={index} className="mb-4">
          {bulletPoints.map((point, pointIndex) => {
            // Extract the title and content
            const [title, ...contentParts] = point.split(':');
            const content = contentParts.join(':').trim();
            
            return (
              <div key={pointIndex} className="mb-3">
                <h4 className="text-lg font-semibold mb-2">
                  {title.replace(/\*\*/g, '').trim()}
                </h4>
                <p className="text-muted-foreground ml-4">
                  {content}
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    
    // Regular paragraph
    return (
      <p key={index} className="mb-4 leading-relaxed">
        {paragraph}
      </p>
    );
  }).filter(Boolean); // Remove null entries
};

export default function CategoryBlogPage() {
  const params = useParams() as { category: string }
  const searchParams = useSearchParams()!
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('🔄 Blog: Component mounted')
    console.log('📝 Blog: Category from params:', params.category)
    console.log('🔍 Blog: Search params:', Object.fromEntries(searchParams.entries()))
    
    const fetchBlogPosts = async () => {
      console.log('🔄 Blog: Starting to fetch blog posts')
      
      try {
        // First try to get the posts from the newsItemsLoaded event data
        const handleNewsItemsLoaded = (event: CustomEvent<BlogPost[]>) => {
          console.log('📡 Blog: Received newsItemsLoaded event')
          console.log('📊 Blog: Event data length:', event.detail.length)
          console.log('📋 Blog: Event data sample:', event.detail.slice(0, 2))
          
          const posts = event.detail.filter(item => {
            const matches = item.category.toLowerCase() === params.category.toLowerCase()
            console.log(`🔍 Blog: Checking item ${item.id} - Category: ${item.category}, Matches: ${matches}`)
            return matches
          })
          
          console.log(`✅ Blog: Found ${posts.length} posts in category ${params.category}`)
          
          if (posts.length > 0) {
            setBlogPosts(posts)
            // If there's a selected post ID in the URL, find and set it
            const postId = searchParams.get('id')
            console.log('🔍 Blog: Looking for post with ID:', postId)
            
            if (postId) {
              const post = posts.find((p: BlogPost) => p.id === parseInt(postId))
              console.log('🔍 Blog: Found post:', post ? `ID: ${post.id}, Title: ${post.title}` : 'Not found')
              if (post) {
                setSelectedPost(post)
              } else {
                setError(`Article with ID ${postId} not found in category ${params.category}`)
              }
            }
            setLoading(false)
          } else {
            setError(`No articles found in category ${params.category}`)
            setLoading(false)
          }
        }

        // Listen for the newsItemsLoaded event
        console.log('👂 Blog: Setting up newsItemsLoaded event listener')
        document.addEventListener('newsItemsLoaded', handleNewsItemsLoaded as EventListener)

        // If we don't get the data from the event within 2 seconds, fetch from API
        const timeoutId = setTimeout(async () => {
          console.log('⏰ Blog: Event timeout - falling back to API')
          console.log('🌐 Blog: Fetching from API')
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001'}/api/envisage_web`)
          
          if (response.ok) {
            const data = await response.json()
            console.log('📦 Blog: Received API response')
            
            // Find the posts in the API response
            const dateKey = data.envisage_web ? Object.keys(data.envisage_web)[0] : null
            console.log('📅 Blog: Date key:', dateKey)
            
            if (dateKey && data.envisage_web[dateKey].newsItems) {
              const posts = data.envisage_web[dateKey].newsItems
                .filter((item: any) => {
                  const matches = item.category.toLowerCase() === params.category.toLowerCase()
                  console.log(`🔍 Blog: API item ${item.id} - Category: ${item.category}, Matches: ${matches}`)
                  return matches
                })
                .map((post: any) => ({
                  ...post,
                  readTime: post.readTime || `${Math.floor(post.summary.length / 300) + 2} min`
                }))
              
              console.log(`✅ Blog: Found ${posts.length} posts in API response for category ${params.category}`)
              setBlogPosts(posts)
              
              // If there's a selected post ID in the URL, find and set it
              const postId = searchParams.get('id')
              console.log('🔍 Blog: Looking for post with ID:', postId)
              
              if (postId) {
                const post = posts.find((p: BlogPost) => p.id === parseInt(postId))
                console.log('🔍 Blog: Found post:', post ? `ID: ${post.id}, Title: ${post.title}` : 'Not found')
                if (post) {
                  setSelectedPost(post)
                } else {
                  setError(`Article with ID ${postId} not found in category ${params.category}`)
                }
              }
            } else {
              console.warn('⚠️ Blog: No newsItems found in API response')
              setError('No articles found in the API response')
            }
          } else {
            console.error('❌ Blog: API request failed:', response.status)
            setError('Failed to fetch articles from the API')
          }
          setLoading(false)
        }, 2000) // Wait 2 seconds for the event

        return () => {
          clearTimeout(timeoutId)
          document.removeEventListener('newsItemsLoaded', handleNewsItemsLoaded as EventListener)
        }
      } catch (error) {
        console.error('❌ Blog: Error fetching blog posts:', error)
        setError('An error occurred while fetching the articles')
        setLoading(false)
      }
    }

    fetchBlogPosts()
  }, [params.category, searchParams])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  // If a post is selected, show its full content
  if (selectedPost) {
    // Use the exact same image from the news item
    console.log("selectedPost.image", selectedPost.image)
    const imageUrl = selectedPost.image || "/placeholder.svg";

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="inline-block">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <article className="max-w-4xl mx-auto">
          <div className="relative h-[400px] w-full mb-8 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt={selectedPost.title}
              fill
              className="object-cover"
              priority
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-primary/10 text-primary border-none">
                {selectedPost.category}
              </Badge>
              <Badge variant="outline" className="bg-black/70 text-white border-none">
                {selectedPost.date}
              </Badge>
            </div>

            <h1 className="text-4xl font-bold">{selectedPost.title}</h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {selectedPost.readTime} read
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {selectedPost.views.toLocaleString()} views
              </div>
            </div>

            <Separator />

            <div className="prose prose-lg dark:prose-invert max-w-none">
              {formatContent(selectedPost.summary)}
            </div>

            {selectedPost.articleCount && selectedPost.sourceCount && (
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  This article is based on {selectedPost.articleCount} articles from {selectedPost.sourceCount} sources.
                </p>
              </div>
            )}
          </div>
        </article>
      </div>
    )
  }

  // Show the category grid if no post is selected
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Link href="/" className="inline-block">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <h1 className="text-3xl font-bold capitalize">{params.category}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {blogPosts.map((post) => (
          <Card 
            key={post.id} 
            className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedPost(post)}
          >
            <div className="relative h-48 w-full">
              <Image
                src={post.image || "/placeholder.svg"}
                alt={post.title}
                fill
                className="object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-none">
                  {post.category}
                </Badge>
                <Badge variant="outline" className="bg-black/70 text-white border-none">
                  {post.date}
                </Badge>
              </div>
              <h2 className="text-xl font-bold mb-2 line-clamp-2">{post.title}</h2>
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                {post.summary.split('\n\n')[0]}
              </p>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime} read
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  {post.views.toLocaleString()} views
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 