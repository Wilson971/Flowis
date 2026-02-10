export function MarqueeSection() {
    return (
        <div className="pt-8 pb-8 px-6 md:px-8 lg:px-12 max-w-[1400px] mx-auto">
            <div className="relative flex w-full flex-col items-center justify-center overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]">
                <div className="flex w-max min-w-full shrink-0 animate-marquee-rtl items-center gap-12 group-hover:[animation-play-state:paused]">
                    {[1, 2, 3, 4, 1, 2, 3, 4].map((i, index) => (
                        <div key={`company-${index}`} className="flex items-center gap-12 shrink-0 opacity-50">
                            <span className="text-xl font-bold text-neutral-600">COMPANY {i}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
