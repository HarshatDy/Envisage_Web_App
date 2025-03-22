import { notFound } from "next/navigation"
import NewsGrid from "@/components/news-grid"
import Sidebar from "@/components/sidebar"
import { Button } from "@/components/ui/button"

// Sample categories data
const validCategories = ["politics", "technology", "business", "sports", "entertainment", "science", "health"]

// Map for display names
const categoryDisplayNames: Record<string, string> = {
  politics: "Politics",
  technology: "Technology",
  business: "Business",
  sports: "Sports",
  entertainment: "Entertainment",
  science: "Science",
  health: "Health",
}

export function generateStaticParams() {
  return validCategories.map((slug) => ({ slug }))
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const { slug } = params

  // Check if the category exists
  if (!validCategories.includes(slug)) {
    notFound()
  }

  const categoryName = categoryDisplayNames[slug] || slug

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{categoryName} News</h1>
        <p className="text-muted-foreground">
          The latest news and updates from the world of {categoryName.toLowerCase()}.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="bg-primary text-primary-foreground">
          Latest
        </Button>
        <Button variant="outline" size="sm">
          Most Read
        </Button>
        <Button variant="outline" size="sm">
          Trending
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <NewsGrid />
          <div className="mt-8 flex justify-center">
            <Button variant="outline">Load More</Button>
          </div>
        </div>
        <div className="w-full md:w-1/3 mt-8 md:mt-0">
          <Sidebar />
        </div>
      </div>
    </div>
  )
}

