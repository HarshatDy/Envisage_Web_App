import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react"

// Sample trending topics
const trendingTopics = [
  "Climate Change",
  "Artificial Intelligence",
  "Global Economy",
  "Space Exploration",
  "Public Health",
]

// Sample popular news
const popularNews = [
  {
    id: 1,
    title: "Scientists Discover Potential New Treatment for Common Disease",
    slug: "new-disease-treatment",
  },
  {
    id: 2,
    title: "Historic Peace Agreement Signed After Decades of Conflict",
    slug: "peace-agreement-signed",
  },
  {
    id: 3,
    title: "Tech Innovation Could Revolutionize Renewable Energy Production",
    slug: "tech-renewable-energy",
  },
  {
    id: 4,
    title: "Major Cultural Festival Returns After Three-Year Hiatus",
    slug: "cultural-festival-returns",
  },
]

// Sample stock recommendations
const stockRecommendations = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 182.63,
    change: 1.25,
    changePercent: 0.69,
    recommendation: "Buy",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: 415.32,
    change: 3.78,
    changePercent: 0.92,
    recommendation: "Strong Buy",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 142.17,
    change: -0.83,
    changePercent: -0.58,
    recommendation: "Hold",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 178.12,
    change: 2.34,
    changePercent: 1.33,
    recommendation: "Buy",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 175.43,
    change: -3.21,
    changePercent: -1.8,
    recommendation: "Hold",
  },
]

export default function Sidebar() {
  return (
    <div className="space-y-6">
      {/* Stock Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stockRecommendations.map((stock) => (
              <div key={stock.symbol} className="group">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{stock.symbol}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-muted">{stock.recommendation}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${stock.price.toFixed(2)}</div>
                    <div
                      className={`text-xs flex items-center ${
                        stock.change > 0
                          ? "text-green-600 dark:text-green-500"
                          : stock.change < 0
                            ? "text-red-600 dark:text-red-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {stock.change > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : stock.change < 0 ? (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      ) : (
                        <Minus className="h-3 w-3 mr-1" />
                      )}
                      {stock.change > 0 ? "+" : ""}
                      {stock.change.toFixed(2)} ({stock.change > 0 ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                </div>
                {stock !== stockRecommendations[stockRecommendations.length - 1] && <Separator className="my-3" />}
              </div>
            ))}
            <div className="text-right">
              <Link href="/finance" className="inline-flex items-center text-sm text-primary hover:underline">
                View all market data <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trending Topics */}
      <Card>
        <CardHeader>
          <CardTitle>Trending Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {trendingTopics.map((topic) => (
              <Link key={topic} href={`/search?q=${encodeURIComponent(topic)}`}>
                <Button variant="outline" size="sm">
                  {topic}
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular News */}
      <Card>
        <CardHeader>
          <CardTitle>Most Read</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {popularNews.map((news, index) => (
              <div key={news.id}>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-lg text-muted-foreground">{index + 1}</span>
                  <Link href={`/news/${news.slug}`} className="hover:text-primary transition-colors">
                    <h4 className="font-medium">{news.title}</h4>
                  </Link>
                </div>
                {index < popularNews.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Newsletter Signup */}
      <Card>
        <CardHeader>
          <CardTitle>Newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Stay updated with our daily news digest delivered straight to your inbox.
          </p>
          <form className="space-y-2">
            <Input type="email" placeholder="Your email address" required />
            <Button type="submit" className="w-full">
              Subscribe
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

