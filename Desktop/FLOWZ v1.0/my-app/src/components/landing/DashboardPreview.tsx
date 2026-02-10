import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

export function DashboardPreviewSection() {
    return (
        <section className="w-full max-w-[1400px] z-30 mr-auto mb-24 ml-auto px-6 md:px-8 lg:px-12">
            <div className="overflow-hidden flex min-h-[900px] group selection:text-white text-slate-300 bg-[#0A0B0E] border-white/10 border rounded-3xl relative shadow-2xl selection:bg-primary">
                {/* Sidebar */}
                <aside className="w-72 bg-[#0c0d10] border-r border-white/5 flex-col hidden lg:flex relative z-20">
                    <div className="flex flex-col h-full p-6">
                        <div className="flex gap-3 mb-10 pl-2 items-center">
                            <div className="flex flex-col">
                                <span className="text-white font-semibold text-lg tracking-tight leading-none">Ledger</span>
                                <span className="text-[10px] uppercase font-medium text-neutral-500 tracking-wider mt-1">Production</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-8">
                            {/* Menu Items Simulation */}
                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold text-neutral-600 uppercase tracking-wider mb-3 px-4">General</div>
                                <div className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 text-white text-sm font-medium border border-white/5">
                                    <Icon icon="lucide:layout-grid" /> Overview
                                </div>
                                <div className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-neutral-400 text-sm font-medium">
                                    <Icon icon="lucide:bar-chart-2" /> Analytics
                                </div>
                            </div>
                            {/* ... more menu items */}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden flex flex-col bg-[#0c0d10] relative">
                    <div className="absolute top-0 right-0 w-[800px] h-[600px] rounded-full blur-[120px] pointer-events-none translate-x-1/3 -translate-y-1/4 z-0 bg-primary/5"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/3 translate-y-1/4 z-0"></div>

                    {/* Header */}
                    <header className="flex sticky z-30 bg-[#0c0d10]/80 h-20 border-white/5 border-b px-8 top-0 backdrop-blur-md items-center justify-between">
                        <div className="flex gap-3 text-sm items-center">
                            <span className="text-neutral-500">Ledger</span>
                            <span className="text-neutral-700">/</span>
                            <span className="text-white font-medium">Overview</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <button className="bg-gradient-to-r hover:brightness-110 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] border from-primary to-primary border-primary/20">
                                <Icon icon="lucide:plus" /> Space
                            </button>
                        </div>
                    </header>

                    <div className="p-8 overflow-y-auto flex-1 relative z-10 custom-scrollbar">
                        {/* Grid Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <BalanceCard title="Gross Volume" value="$42,805" percent="+12.5%" />
                            <BalanceCard title="Net Revenue" value="$36,210" percent="+8.2%" />
                            <BalanceCard title="Active Subscribers" value="1,429" percent="+4.1%" />

                            {/* Available Balance Large Card */}
                            <div className="bg-gradient-to-br from-[#1c1d24] to-[#121317] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-all shadow-lg lg:col-span-1 lg:row-span-1">
                                <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full blur-[40px] pointer-events-none bg-primary/5"></div>
                                <div className="mb-8 relative z-10">
                                    <p className="text-sm font-medium text-neutral-400 mb-1">Total Balance</p>
                                    <h2 className="text-4xl font-semibold text-white tracking-tight">$385,430<span className="text-2xl text-neutral-600">.00</span></h2>
                                </div>
                                <div className="flex gap-3 relative z-10">
                                    <button className="flex-1 bg-white text-neutral-900 hover:bg-neutral-200 text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
                                        Transfer
                                    </button>
                                    <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                                        Add Funds
                                    </button>
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-[#121317] border border-white/5 rounded-2xl flex flex-col relative overflow-hidden lg:col-span-2">
                                <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-white">Recent Activity</h3>
                                </div>
                                <div className="flex-1">
                                    <ActivityItem name="Stripe Payout" date="Today, 9:41 AM" amount="+$1,420.00" amountColor="text-primary" />
                                    <ActivityItem name="AWS Invoice" date="Yesterday" amount="-$64.00" amountColor="text-white" icon="rect" />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </section>
    );
}

function BalanceCard({ title, value, percent }: { title: string, value: string, percent: string }) {
    return (
        <div className="bg-[#121317] border border-white/5 rounded-2xl p-6 relative group hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start mb-6">
                <span className="text-sm font-medium text-neutral-500">{title}</span>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-3xl font-semibold text-white tracking-tight">{value}</span>
                <div className="flex text-[10px] font-bold border rounded-md pt-1 pr-2.5 pb-1 pl-2.5 shadow-[0_0_10px_rgba(16,185,129,0.1)] gap-x-1.5 gap-y-1.5 items-center text-primary bg-primary/10 border-primary/20">
                    {percent}
                </div>
            </div>
        </div>
    );
}

function ActivityItem({ name, date, amount, amountColor, icon }: any) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-0 cursor-pointer">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg border flex items-center justify-center bg-primary/10 border-primary/20 text-primary">
                    <Icon icon={icon === 'rect' ? "lucide:file-text" : "lucide:check"} width="14" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-medium text-white">{name}</span>
                    <span className="text-[10px] text-neutral-500">{date}</span>
                </div>
            </div>
            <span className={cn("text-xs font-medium", amountColor)}>{amount}</span>
        </div>
    );
}
