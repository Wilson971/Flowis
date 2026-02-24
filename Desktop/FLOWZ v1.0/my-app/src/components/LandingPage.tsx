"use client";

import dynamic from "next/dynamic";
import { Navbar } from "./landing/Navbar";
import { HeroSection } from "./landing/Hero";

const DashboardPreviewSection = dynamic(() => import("./landing/DashboardPreview").then(mod => ({ default: mod.DashboardPreviewSection })), { ssr: false });
const MarqueeSection = dynamic(() => import("./landing/Marquee").then(mod => ({ default: mod.MarqueeSection })), { ssr: false });
const MarketIntelligenceSection = dynamic(() => import("./landing/MarketIntelligence").then(mod => ({ default: mod.MarketIntelligenceSection })), { ssr: false });
const FeaturesSection = dynamic(() => import("./landing/Features").then(mod => ({ default: mod.FeaturesSection })), { ssr: false });
const TestimonialsSection = dynamic(() => import("./landing/Testimonials").then(mod => ({ default: mod.TestimonialsSection })), { ssr: false });
const PricingSection = dynamic(() => import("./landing/Pricing").then(mod => ({ default: mod.PricingSection })), { ssr: false });
const FooterSection = dynamic(() => import("./landing/Footer").then(mod => ({ default: mod.FooterSection })), { ssr: false });

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
