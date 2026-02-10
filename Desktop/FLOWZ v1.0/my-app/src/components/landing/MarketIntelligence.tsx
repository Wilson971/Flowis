"use client";

import { useRef } from 'react';
import { cn } from '@/lib/utils';

export function MarketIntelligenceSection() {
    // Generate static heights to avoid SSR hydration mismatch
    // Using simple static array or useEffect could replace this, but keeping original logic which was useRef init
    // Actually, to make it Hydration safe, it should either be fixed values or useId/useEffect.
    // The original code used useRef init which might be unstable for SSR if random is used.
    // I will use a static deterministic array to make it Server Component compatible if possible,
    // but the animation frame loop might need client. The animation is CSS.
    // Let's make it static deterministic for better performance (Server Component).

    // Original: Math.random(). I will replace with deterministic pattern.
    const candleHeights = [
        45, 62, 38, 75, 50, 85, 42, 60, 55, 70,
        48, 65, 40, 78, 52, 88, 45, 62, 58, 72
    ];

    return (
        <section className="px-6 md:px-8 lg:px-12 max-w-[1400px] mx-auto mt-24 mb-24">
            <div className="bg-gradient-to-br from-white/10 via-white/0 to-white/10 w-full rounded-3xl p-8 border border-white/5 relative">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-16 gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-6 h-[1px] bg-primary"></span>
                            <p className="text-sm font-semibold tracking-wide uppercase text-primary">Market Intelligence</p>
                        </div>
                        <h2 className="text-3xl sm:text-5xl text-white tracking-tight font-light">Real-time financial data</h2>
                    </div>
                </div>

                <div className="overflow-hidden group bg-[#0A0B0E] w-full border-white/10 border rounded-3xl relative shadow-2xl p-6 md:p-10">
                    {/* Simulated Chart */}
                    <div className="h-[400px] w-full relative">
                        {/* Candles - Just a visual representation */}
                        <div className="absolute inset-0 flex items-end justify-between px-2 pb-8">
                            {candleHeights.map((height, i) => (
                                <div key={`candle-${i}`} className="w-2 relative group animate-candle-loop" style={{ height: `${height}%`, animationDelay: `${i * 100}ms` }}>
                                    <div className="w-[1px] h-full bg-primary/50 mx-auto"></div>
                                    <div className={cn("absolute w-[6px] left-1/2 -translate-x-1/2 rounded-[1px]", i % 2 === 0 ? "bg-primary" : "bg-purple-500")} style={{ height: '40%', top: '20%' }}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
