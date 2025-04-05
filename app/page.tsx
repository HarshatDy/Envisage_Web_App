import HeroSection from "@/components/hero-section"
import NewsGrid from "@/components/news-grid"
import BreakingNewsTicker from "@/components/breaking-news-ticker"
import Sidebar from "@/components/sidebar"
import DailyDigestBanner from "@/components/daily-digest-banner"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <BreakingNewsTicker />
      <div className="mt-6">
        <HeroSection />
      </div>
      <DailyDigestBanner />
      <div className="mt-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3">
          <NewsGrid />
        </div>
        <div className="w-full md:w-1/3 mt-8 md:mt-0">
          <Sidebar />
        </div>
      </div>
    </div>
  )
}

