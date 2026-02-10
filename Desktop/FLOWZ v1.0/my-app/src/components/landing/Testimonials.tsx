"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';

export function TestimonialsSection() {
    const [index, setIndex] = useState(1);

    const handleSwipe = (dir: number) => {
        setIndex((prev) => (prev + dir + 3) % 3);
    }

    // Data for cards
    const cards = [
        { name: "Sarah Jenkins", role: "CTO at TechFlow", quote: "Prism has completely transformed how we ship code." },
        { name: "Michael Klein", role: "Lead Engineer at Vercel", quote: "The feature flags integration is a game changer." },
        { name: "Emily Liu", role: "VP Eng at Stripe", quote: "Simply the best tool for tracking velocity." }
    ]

    return (
        <section className="px-6 md:px-8 lg:px-12 max-w-[1400px] mx-auto mt-24 mb-24 text-center">
            <h2 className="text-3xl sm:text-5xl text-white tracking-tight font-light mb-16">Trusted by financial teams</h2>

            <div className="relative h-[650px] w-full max-w-[1200px] mx-auto perspective-distant">
                {cards.map((card, i) => {
                    // 0=Left, 1=Center, 2=Right
                    const pos = (i - index + 1 + 3) % 3;

                    let className = "transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] md:absolute md:top-1/2 md:left-1/2 w-full border bg-[#0A0B0E] border-white/10 shadow-2xl rounded-[2rem] p-8 md:w-[400px] ";

                    if (pos === 0) { // Left
                        className += "md:-translate-x-[125%] md:-translate-y-[60%] md:-rotate-[6deg] md:scale-[0.9] z-10 opacity-40"
                    } else if (pos === 1) { // Center
                        className += "md:w-[460px] md:-translate-x-1/2 md:-translate-y-[65%] md:scale-100 z-30 opacity-100 border-primary/20"
                    } else { // Right
                        className += "md:translate-x-[25%] md:-translate-y-[60%] md:rotate-[6deg] md:scale-[0.9] z-10 opacity-40"
                    }

                    return (
                        <div key={i} className={className}>
                            <blockquote className="text-lg text-white mb-8 font-light">"{card.quote}"</blockquote>
                            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-medium text-primary">{card.name.charAt(0)}</div>
                                <div className="text-left">
                                    <div className="text-sm text-white font-medium">{card.name}</div>
                                    <div className="text-xs text-neutral-500">{card.role}</div>
                                </div>
                            </div>
                        </div>
                    )
                })}

                <div className="hidden md:flex gap-6 absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
                    <button onClick={() => handleSwipe(-1)} className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center bg-[#0A0B0E] hover:bg-white/5 text-white">
                        <Icon icon="lucide:arrow-left" />
                    </button>
                    <button onClick={() => handleSwipe(1)} className="w-14 h-14 rounded-full border border-primary/30 flex items-center justify-center bg-[#0A0B0E] hover:bg-primary/10 text-primary">
                        <Icon icon="lucide:arrow-right" />
                    </button>
                </div>
            </div>

        </section>
    )
}
