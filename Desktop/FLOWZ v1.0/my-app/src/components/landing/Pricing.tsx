"use client";

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

export function PricingSection() {
    const [annual, setAnnual] = useState(false);

    return (
        <section className="px-6 md:px-8 lg:px-12 max-w-[1400px] mx-auto mt-24 mb-24 relative">
            <div className="bg-gradient-to-br from-white/10 via-white/0 to-white/10 w-full rounded-3xl p-8 border border-white/5 relative">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12">
                    <div>
                        <h2 className="text-3xl sm:text-5xl text-white tracking-tight font-light">Start scaling today</h2>
                    </div>
                    <div className="flex items-center gap-3 select-none">
                        <span className={cn("text-sm transition-colors", !annual ? "text-white" : "text-neutral-400")}>Monthly</span>
                        <button onClick={() => setAnnual(!annual)} className="w-12 h-6 rounded-full bg-white/10 border border-white/10 relative">
                            <div className={cn("absolute top-1 left-1 w-4 h-4 rounded-full bg-primary transition-transform", annual ? "translate-x-6" : "")}></div>
                        </button>
                        <span className={cn("text-sm transition-colors", annual ? "text-white" : "text-neutral-400")}>Yearly</span>
                    </div>
                </div>

                <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl shadow-2xl grid grid-cols-1 lg:grid-cols-2">
                    <div className="p-8 border-r border-white/5">
                        <h3 className="text-xl font-medium text-white mb-2">Pro Infrastructure</h3>
                        <div className="flex items-baseline gap-1 mb-8 mt-4">
                            <span className="text-5xl font-light text-white tracking-tight">$</span>
                            <span className="text-5xl font-light text-white tracking-tight">{annual ? '279' : '29'}</span>
                            <span className="text-neutral-500">/{annual ? 'year' : 'month'}</span>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="text-sm font-medium text-white mb-6">What's included in Pro:</div>
                        <ul className="space-y-4">
                            {['Merchant of Record', 'Automatic tax handling', 'Unlimited tiers', 'Smart revenue recovery'].map(i => (
                                <li key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                                    <Icon icon="lucide:check" className="text-primary" /> {i}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}
