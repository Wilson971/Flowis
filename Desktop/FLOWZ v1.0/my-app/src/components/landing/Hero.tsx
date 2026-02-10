import Link from "next/link";
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';


export function HeroSection() {
    return (
        <main className="md:px-8 lg:px-12 max-w-[1400px] mr-auto ml-auto pr-6 pl-6 grid lg:grid-cols-2 pt-32 pb-32 relative gap-x-16 gap-y-16 items-center">
            {/* Background Script & Div - Simplified for React */}
            <div className="absolute inset-0 -z-10 w-full h-full overflow-hidden">
                <div className="absolute w-full h-full left-0 top-0 -z-10 opacity-60 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/20 via-[#000000] to-[#000000]"></div>
            </div>

            {/* Left Content */}
            <div className="flex flex-col gap-8 max-w-2xl gap-x-8 gap-y-8 items-start">
                <div className="inline-flex bg-slate-900 border-neutral-900 border rounded-full pt-1.5 pr-5 pb-1.5 pl-1.5 gap-x-3 gap-y-3 items-center">
                    <span className="text-white text-xs px-2.5 py-1 rounded-full font-medium bg-primary">New</span>
                    <span className="text-slate-300 text-sm">Global tax compliance</span>
                </div>

                <h1 className="md:text-7xl leading-[1.1] text-5xl font-light text-white tracking-tight">
                    The monetization infrastructure for developers
                </h1>

                <p className="leading-relaxed text-lg text-slate-400 max-w-lg">
                    Ledger handles tax, payments, and subscriptions so you can focus on
                    building your product. The best alternative to Lemon Squeezy and
                    Polar.
                </p>

                <div className="flex pt-2 gap-x-4 gap-y-4 items-center">
                    <div className="inline-block bg-transparent">
                        <button className="relative overflow-hidden rounded-full px-10 py-5 text-lg font-medium text-white bg-black border-2 border-transparent shadow-[inset_0_0_0_1px_#1a1818] transition-all hover:-translate-y-0.5" style={{
                            backgroundImage: 'linear-gradient(#000000, #000000), conic-gradient(from calc(var(--gradient-angle, 0deg) - 0deg), transparent 0%, #059669 5%, #34d399 15%, #059669 30%, transparent 40%, transparent 100%)',
                            backgroundOrigin: 'padding-box, border-box',
                            backgroundClip: 'padding-box, border-box',
                        }}>
                            <span className="relative z-10">Start Building</span>
                        </button>
                    </div>
                    <button className="group px-8 py-4 rounded-full border text-slate-300 text-lg hover:bg-slate-900 transition-all flex items-center gap-3 border-neutral-900">
                        Documentation
                        <Icon icon="solar:book-bookmark-linear" className="text-xl group-hover:text-white transition-colors" />
                    </button>
                </div>
            </div>

            {/* Right Visual (Mockup) */}
            <HeroMockup />
        </main>
    );
}

function HeroMockup() {
    return (
        <div className="card-top lg:justify-self-end flex flex-col overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group bg-[#0A0B0E] w-[32rem] h-fit z-10 border-white/10 border rounded-[1.2em] ml-auto relative shadow-2xl justify-self-end hover:border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-br via-transparent to-transparent pointer-events-none from-primary/5"></div>

            <div className="z-10 flex flex-col h-full pt-8 pr-8 pb-8 pl-8 relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-baseline gap-3">
                        <span className="text-6xl text-white tabular-nums tracking-tight font-light">$2.8M</span>
                        <span className="text-base text-neutral-500">processed volume</span>
                    </div>
                    <button className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors border border-white/5 shadow-lg">
                        <Icon icon="lucide:activity" width="20" height="20" />
                    </button>
                </div>

                {/* Chart Section */}
                <div className="flex-1 flex flex-col gap-2 relative">
                    <div className="flex justify-between text-xs font-medium text-neutral-400 uppercase tracking-wide px-1">
                        <span className="text-primary/80">Daily Peak</span>
                        <span>$450k</span>
                    </div>

                    <div className="h-44 flex items-end justify-between gap-3 relative mt-1">
                        <div className="absolute top-0 left-0 right-0 h-px border-t border-dashed border-white/20 w-full z-0"></div>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                            <div key={day} className="flex flex-col items-center gap-3 w-full h-full group/bar cursor-pointer z-10">
                                <div className="relative w-full h-full rounded-lg overflow-hidden bg-white/[0.02] ring-1 ring-white/5">
                                    <div className="absolute inset-0 opacity-10 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,#fff_4px,#fff_6px)]"></div>
                                    <div
                                        className={cn(
                                            "absolute bottom-0 left-0 right-0 bg-gradient-to-t rounded-lg transition-all duration-500 group-hover/bar:brightness-110 shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-bar-loop",
                                            i === 2 ? "from-primary to-[#4285f4]" : (i === 6 ? "from-neutral-600 to-neutral-400" : "from-primary to-primary")
                                        )}
                                        style={{
                                            height: [65, 85, 100, 55, 90, 45, 30][i] + '%',
                                            animationDelay: i * 100 + 'ms'
                                        }}
                                    ></div>
                                </div>
                                <span className={cn("text-xs transition-colors", i === 2 ? "text-white" : "text-neutral-500 group-hover/bar:text-white")}>{day}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="flex items-end justify-between mt-10 pt-6 border-t border-white/5">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-white text-xl">135<span className="text-primary">+</span></span>
                            <span className="text-neutral-500 text-sm">currencies</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <span className="text-white text-xl">$42,805</span>
                            <span className="text-neutral-500 text-sm">tax automated</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
