import Link from "next/link"
import Image from "next/image"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Sample news data
const newsItems = [
  {
    id: 1,
    title: "Global Markets React to Economic Policy Shifts",
    summary:
      "Stock markets worldwide show mixed reactions to the latest economic policy announcements. Analysts predict continued volatility as investors adjust to the new landscape. Central banks are closely monitoring the situation and may intervene if necessary.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Business",
    date: "2023-03-15",
    slug: "global-markets-react",
  },
  {
    id: 2,
    title: "New Study Reveals Benefits of Mediterranean Diet",
    summary:
      "Research confirms significant health benefits for those following a traditional Mediterranean diet. The study tracked participants over a five-year period and found reduced risks of heart disease, stroke, and certain cancers. Olive oil, fish, and fresh vegetables were identified as key components.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Health",
    date: "2023-03-14",
    slug: "mediterranean-diet-benefits",
  },
  {
    id: 3,
    title: "Major Sports League Announces Expansion Teams",
    summary:
      "Two new cities will join the league in the upcoming season, bringing the total to 32 teams. The expansion represents a significant investment in growing markets and will create thousands of new jobs. Team names and logos will be revealed at a special event next month.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Sports",
    date: "2023-03-14",
    slug: "sports-league-expansion",
  },
  {
    id: 4,
    title: "Tech Company Unveils Next-Generation Smartphone",
    summary:
      "The latest flagship device features groundbreaking camera technology and extended battery life. Industry experts are calling it a significant leap forward in mobile technology. Pre-orders have already broken previous records, indicating strong consumer interest despite the premium price point.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Technology",
    date: "2023-03-13",
    slug: "next-gen-smartphone",
  },
  {
    id: 5,
    title: "Environmental Initiative Aims to Clean Ocean Plastic",
    summary:
      "A new global partnership launches ambitious project to remove plastic waste from the world's oceans. Using innovative collection methods and recycling technologies, the initiative aims to remove millions of tons of plastic over the next decade. Corporate sponsors have pledged significant funding to support the effort.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Science",
    date: "2023-03-12",
    slug: "ocean-plastic-initiative",
  },
  {
    id: 6,
    title: "Award-Winning Film Director Announces New Project",
    summary:
      "The acclaimed filmmaker returns with an ambitious new movie starring A-list actors. Set to begin production next month, the film explores themes of identity and belonging in a near-future setting. Studio executives are already generating Oscar buzz based on the screenplay and attached talent.",
    image: "/placeholder.svg?height=400&width=600",
    category: "Entertainment",
    date: "2023-03-11",
    slug: "film-director-new-project",
  },
]

export default function NewsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {newsItems.map((news) => (
        <Link key={news.id} href={`/news/${news.slug}`} className="block group">
          <Card className="overflow-hidden h-full transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-2 relative">
            <div className="relative h-48 w-full overflow-hidden">
              <Image
                src={news.image || "/placeholder.svg"}
                alt={news.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3">
                <Badge variant="outline" className="bg-primary/90 text-primary-foreground border-none">
                  {news.category}
                </Badge>
              </div>
            </div>

            <div className="p-4 relative">
              {/* Normal state */}
              <div className="transition-all duration-300 group-hover:opacity-0 group-hover:absolute">
                <h3 className="font-bold text-lg line-clamp-2">{news.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{news.summary}</p>
              </div>

              {/* Hover state - expanded content */}
              <div className="absolute inset-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col">
                <h3 className="font-bold text-lg">{news.title}</h3>
                <div className="w-full h-0.5 bg-primary my-2"></div>
                <p className="text-sm text-muted-foreground overflow-hidden flex-grow">
                  {news.summary.substring(0, 150)}
                  {news.summary.length > 150 && "..."}
                </p>
                <div className="mt-2 text-sm font-medium text-primary">Click to read full story</div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}

