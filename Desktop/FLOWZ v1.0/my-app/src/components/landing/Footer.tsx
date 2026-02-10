export function FooterSection() {
    return (
        <section className="px-6 md:px-8 lg:px-12 max-w-[1400px] mx-auto mt-24 pb-6">
            <div className="bg-[#0A0B0E] border-white/10 border rounded-3xl p-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4">
                        <span className="font-semibold text-xs tracking-widest uppercase text-primary">Contact</span>
                        <h3 className="text-slate-300 text-lg font-medium mt-2">Sales & Enterprise</h3>
                        <a href="mailto:hello@ledger.com" className="text-3xl text-white block mt-2 hover:text-primary">hello@ledger.com</a>
                    </div>
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
                        {['Product', 'Resources', 'Company', 'Legal'].map(col => (
                            <div key={col} className="flex flex-col gap-4">
                                <span className="text-white font-medium text-sm">{col}</span>
                                <ul className="flex flex-col gap-3 text-sm text-slate-500">
                                    {[1, 2, 3, 4].map(i => <li key={`${col}-link-${i}`}><a href="#" className="hover:text-primary">Link {i}</a></li>)}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-full pt-8 mt-8 border-t border-white/5">
                    <p className="text-[13vw] leading-[0.75] font-bold text-white/5 tracking-tighter w-full text-center lg:text-left pointer-events-none">
                        LEDGER
                    </p>
                </div>
            </div>
        </section>
    )
}
