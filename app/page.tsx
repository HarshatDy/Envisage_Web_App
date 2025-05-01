import HeroSection from "@/components/hero-section"
import NewsGrid from "@/components/news-grid"
import BreakingNewsTicker from "@/components/breaking-news-ticker"
import DailyDigestBanner from "@/components/daily-digest-banner"
import WelcomePopup from "@/components/welcome-popup"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <WelcomePopup />
      <BreakingNewsTicker />
      <div className="mt-6">
        <HeroSection />
      </div>
      <DailyDigestBanner />
      <div className="mt-8">
        <NewsGrid />
      </div>
    </div>
  )
}

