import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, Clock, Share2, Bookmark, ThumbsUp, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Sidebar from "@/components/sidebar"

// Sample article data - in a real app, this would come from a database or API
const articles = [
  {
    slug: "climate-summit-agreement",
    title: "Global Climate Summit Reaches Historic Agreement on Emissions",
    content: `
      <p>World leaders have agreed to unprecedented carbon reduction targets at the latest climate summit, marking a significant milestone in the global fight against climate change.</p>
      
      <p>The agreement, reached after intense negotiations that stretched into the early hours of the morning, commits all participating nations to reduce carbon emissions by at least 50% by 2030, with developed nations pledging even steeper cuts.</p>
      
      <p>"This is a historic day for our planet," said the UN Secretary-General. "For the first time, we have a truly global commitment to address the climate crisis with the urgency it demands."</p>
      
      <p>The deal includes provisions for financial assistance to developing nations, helping them transition to cleaner energy sources while continuing economic growth. A fund of $100 billion annually has been established to support this initiative.</p>
      
      <p>Environmental groups have cautiously welcomed the agreement, though many stress that implementation will be the true test. "The targets are ambitious, which is what we need," said the director of a leading environmental organization. "But now comes the hard part—turning these commitments into concrete actions."</p>
      
      <p>Market analysts predict the agreement will accelerate investment in renewable energy and sustainable technologies, potentially creating millions of new jobs worldwide. Several major corporations have already announced plans to align their operations with the new targets.</p>
      
      <p>The agreement also establishes a robust monitoring system to track progress, with countries required to report emissions data annually. Those failing to meet interim targets could face trade penalties, though these measures remain controversial.</p>
      
      <p>As delegates departed the summit, many expressed a sense of cautious optimism. "We've taken a crucial step forward," said one European diplomat. "The path ahead remains challenging, but for the first time in years, I believe we're moving in the right direction."</p>
    `,
    author: {
      name: "Sarah Johnson",
      image: "/placeholder.svg?height=40&width=40",
      role: "Environmental Correspondent",
    },
    category: "Politics",
    date: "March 15, 2023",
    readTime: "5 min read",
    image: "/placeholder.svg?height=600&width=1200",
  },
  {
    slug: "tech-giant-ai-assistant",
    title: "Tech Giant Unveils Revolutionary AI Assistant",
    content: `
      <p>In a highly anticipated product launch event, one of the world's leading technology companies has unveiled what it describes as a "revolutionary" artificial intelligence assistant that can understand and respond to complex human queries with remarkable accuracy.</p>
      
      <p>The new AI system, which has been in development for over five years, uses advanced neural network architecture to process and generate natural language. According to the company, it can understand context, remember previous interactions, and even detect emotional nuances in human speech.</p>
      
      <p>"This represents a quantum leap in human-computer interaction," said the company's CEO during the presentation. "We're moving beyond simple command-based interactions to truly conversational AI."</p>
      
      <p>Demonstrations at the event showed the AI assistant helping users plan complex travel itineraries, providing detailed answers to scientific questions, and even engaging in philosophical discussions. Perhaps most impressively, it was able to explain complex concepts in simple terms when asked to do so.</p>
      
      <p>The technology will be integrated into the company's existing product ecosystem, from smartphones to smart home devices, and will also be available as an API for developers to build upon.</p>
      
      <p>Privacy advocates have raised concerns about the data collection necessary to train such sophisticated AI systems. In response, the company emphasized that all processing happens on-device when possible, and that strict anonymization protocols are in place for cloud-based processing.</p>
      
      <p>Industry analysts predict this development could trigger a new arms race in AI capabilities among major tech companies. "This raises the bar significantly," said one analyst. "We expect to see competitors scrambling to match these capabilities in the coming months."</p>
      
      <p>The AI assistant will be rolled out gradually over the next six months, beginning with a limited beta program for selected users next month.</p>
    `,
    author: {
      name: "Michael Chen",
      image: "/placeholder.svg?height=40&width=40",
      role: "Technology Editor",
    },
    category: "Technology",
    date: "March 14, 2023",
    readTime: "4 min read",
    image: "/placeholder.svg?height=600&width=1200",
  },
]

export function generateStaticParams() {
  return articles.map((article) => ({
    slug: article.slug,
  }))
}

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const article = articles.find((article) => article.slug === slug)

  if (!article) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <article className="w-full md:w-2/3">
          <div className="mb-4">
            <Link href={`/category/${article.category.toLowerCase()}`}>
              <Badge variant="outline" className="mb-4">
                {article.category}
              </Badge>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{article.title}</h1>
            <div className="flex items-center gap-4 mb-6">
              <Avatar>
                <AvatarImage src={article.author.image} alt={article.author.name} />
                <AvatarFallback>{article.author.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{article.author.name}</div>
                <div className="text-sm text-muted-foreground">{article.author.role}</div>
              </div>
            </div>
            <div className="flex items-center text-sm text-muted-foreground mb-6">
              <div className="flex items-center mr-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{article.date}</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{article.readTime}</span>
              </div>
            </div>
          </div>

          <div className="relative h-[400px] w-full mb-8">
            <Image
              src={article.image || "/placeholder.svg"}
              alt={article.title}
              fill
              className="object-cover rounded-lg"
              priority
            />
          </div>

          <div
            className="prose prose-lg dark:prose-invert max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          <Separator className="my-8" />

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Like
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comment
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>

          <Separator className="my-8" />

          <div>
            <h3 className="text-xl font-bold mb-4">Comments</h3>
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <p className="text-muted-foreground mb-4">Join the conversation</p>
              <Button>Sign in to comment</Button>
            </div>
          </div>
        </article>

        <div className="w-full md:w-1/3">
          <Sidebar />
        </div>
      </div>
    </div>
  )
}

