"use client";

import Link from "next/link";
import { Icon } from '@iconify/react';

export function Navbar() {
    return (
        <div className="md:px-8 lg:px-12 max-w-[1400px] mr-auto ml-auto pr-6 pl-6 relative z-50">
            <nav className="flex sticky bg-[#000000] border-[#ffffff]/10 border rounded-full mt-4 mb-0 pt-4 pr-4 pb-4 pl-4 top-4 backdrop-blur-md items-center justify-between">
                <div className="flex items-center gap-2">
                    {/* @ts-ignore */}
                    <Link href="/" className="flex items-center justify-center">
                        <span className="text-white font-bold text-xl tracking-tight">LEDGER</span>
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                    <a href="#" className="text-white transition-colors hover:text-primary">Platform</a>
                    <button className="flex items-center gap-1 hover:text-white transition-colors">
                        Features
                        <Icon icon="solar:alt-arrow-down-linear" />
                    </button>
                    <button className="flex items-center gap-1 hover:text-white transition-colors">
                        Resources
                        <Icon icon="solar:alt-arrow-down-linear" />
                    </button>
                    <a href="#" className="hover:text-white transition-colors">Pricing</a>
                    <a href="#" className="hover:text-white transition-colors">Docs</a>
                </div>

                <div className="flex items-center gap-4">
                    {/* @ts-ignore */}
                    <Link href="/login">
                        <button className="hidden md:block px-5 py-2 rounded-full border text-slate-300 hover:bg-slate-900 transition-colors text-sm border-neutral-900">
                            Sign In
                        </button>
                    </Link>
                    {/* @ts-ignore */}
                    <Link href="/app/overview">
                        <button className="px-5 py-2 rounded-full bg-white hover:bg-slate-200 transition-colors text-sm text-neutral-950 font-medium">
                            Get Started
                        </button>
                    </Link>
                </div>
            </nav>
        </div>
    );
}
