import { Navbar } from "./landing/Navbar";
import { HeroSection } from "./landing/Hero";
import { DashboardPreviewSection } from "./landing/DashboardPreview";
import { MarqueeSection } from "./landing/Marquee";
import { MarketIntelligenceSection } from "./landing/MarketIntelligence";
import { FeaturesSection } from "./landing/Features";
import { TestimonialsSection } from "./landing/Testimonials";
import { PricingSection } from "./landing/Pricing";
import { FooterSection } from "./landing/Footer";

export function LandingPage() {
    return (
        <div className="antialiased selection:bg-primary selection:text-white text-slate-300 bg-[#000000] min-h-screen font-geist">
            <Navbar />
            <HeroSection />
            <DashboardPreviewSection />
            <MarqueeSection />
            <MarketIntelligenceSection />
            <FeaturesSection />
            <TestimonialsSection />
            <PricingSection />
            <FooterSection />
        </div>
    );
}
