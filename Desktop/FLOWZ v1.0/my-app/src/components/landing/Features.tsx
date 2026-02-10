"use client";

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

export function FeaturesSection() {
    return (
        <section className="px-6 md:px-8 lg:px-12 max-w-[1400px] mx-auto mt-24 mb-24">
            <div className="bg-gradient-to-br from-white/10 via-white/0 to-white/10 w-full rounded-3xl p-8 border border-white/5 relative">
                <div className="mb-16">
                    <h2 className="text-3xl sm:text-5xl text-white tracking-tight font-light">Built for modern software businesses</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 relative group border border-white/10 md:p-10 overflow-hidden bg-[#0A0B0E] rounded-3xl p-8 shadow-2xl hover:border-white/20 transition-all">
                        <h3 className="text-2xl font-semibold text-white mb-4">Enterprise Compliance</h3>
                        <p className="text-slate-400">Automatic tax handling for 135+ currencies.</p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-10">
                            {['Global Tax', 'SOC2 Type II', 'Invoicing', 'Liability'].map(item => (
                                <div key={item} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                                    <Icon icon="lucide:check-circle" className="text-slate-400 text-2xl" />
                                    <span className="text-xs font-medium text-slate-300">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="group relative overflow-hidden h-full bg-[#0A0B0E] border border-white/10 rounded-3xl p-8 shadow-lg hover:border-primary/30">
                            {/* Terminal Visual */}
                            <div className="relative h-48 w-full mb-8 rounded-2xl bg-[#0f1115] border border-white/5 overflow-hidden p-4 font-mono text-[11px]">
                                <TerminalAnimation />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">Instant Webhooks</h3>
                            <p className="text-sm text-slate-400">Real-time event delivery.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function TerminalAnimation() {
    const [lines, setLines] = useState<string[]>([
        "> initializing_ledger_api...",
        "> connecting_webhooks...",
    ])

    useEffect(() => {
        const timer = setInterval(() => {
            setLines(prev => {
                const newLines = [...prev]
                if (newLines.length > 5) newLines.shift()
                newLines.push(`> event_processed: ${Math.random().toString(36).substring(7)}`)
                return newLines
            })
        }, 1500)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="flex flex-col gap-1 text-primary">
            {lines.map((l, i) => <div key={i}>{l}</div>)}
            <div className="animate-pulse">_</div>
        </div>
    )
}
