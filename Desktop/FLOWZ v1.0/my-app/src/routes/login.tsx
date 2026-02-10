import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Icon } from '@iconify/react'
import { useState } from 'react'
import { cn } from '../lib/utils'
import { createClient } from '../lib/supabase/client'

type LoginSearch = {
    redirect?: string
}

// @ts-ignore
export const Route = createFileRoute('/login')({
    validateSearch: (search: Record<string, unknown>): LoginSearch => {
        return {
            redirect: search.redirect as string | undefined,
        }
    },
    component: LoginComponent,
})

function LoginComponent() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSignUp, setIsSignUp] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()
    const supabase = createClient()
    const { redirect } = Route.useSearch() as LoginSearch

    async function onSubmit(event: React.SyntheticEvent) {
        event.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/app/overview`,
                    },
                })
                if (error) throw error
                setError("Check your email for the confirmation link.")
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                navigate({ to: (redirect as any) || '/app/overview' })
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during authentication")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-[#000000] overflow-hidden font-geist text-slate-300 selection:bg-primary selection:text-white">
            {/* Background Effects */}
            <div className="absolute inset-0 -z-10 w-full h-full overflow-hidden">
                <div className="absolute w-full h-full left-0 top-0 -z-10 opacity-60 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/20 via-[#000000] to-[#000000]"></div>
            </div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none translate-x-1/2 -translate-y-1/2 z-0 bg-primary/5"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 translate-y-1/4 z-0"></div>

            {/* Navigation Back */}
            <div className="absolute top-8 left-8 z-20">
                <Link to="/" className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors group">
                    <Icon icon="lucide:arrow-left" className="transition-transform group-hover:-translate-x-1" />
                    Back to Home
                </Link>
            </div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-[#0A0B0E] border border-white/10 rounded-2xl shadow-2xl p-8 relative overflow-hidden group">
                    {/* Subtle Glow Effect inside card */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                    <div className="flex flex-col gap-2 text-center mb-8 relative z-10">
                        <div className="w-12 h-12 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center mx-auto mb-4 text-primary">
                            <Icon icon="solar:user-circle-bold" width="24" height="24" />
                        </div>
                        <h1 className="text-2xl font-semibold text-white tracking-tight">
                            {isSignUp ? 'Create an account' : 'Welcome back'}
                        </h1>
                        <p className="text-sm text-neutral-500">
                            {isSignUp ? 'Enter your details to register' : 'Enter your credentials to access your account'}
                        </p>
                    </div>

                    <div className="grid gap-6 relative z-10">
                        {error && (
                            <div className={cn(
                                "p-3 rounded-lg text-xs font-medium border",
                                error.includes("confirm") ? "bg-primary/10 border-primary/20 text-primary" : "bg-red-500/10 border-red-500/20 text-red-500"
                            )}>
                                {error}
                            </div>
                        )}

                        <form onSubmit={onSubmit}>
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <label htmlFor="email" className="text-xs font-medium text-neutral-300">Email</label>
                                    <input
                                        id="email"
                                        placeholder="name@example.com"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect="off"
                                        required
                                        disabled={isLoading}
                                        className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="password" className="text-xs font-medium text-neutral-300">Password</label>
                                        {!isSignUp && <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">Forgot password?</a>}
                                    </div>
                                    <input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoCapitalize="none"
                                        autoComplete="current-password"
                                        required
                                        disabled={isLoading}
                                        className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <button
                                    disabled={isLoading}
                                    className="relative overflow-hidden rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-primary to-emerald-600 hover:brightness-110 border border-primary/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                                >
                                    {isLoading && (
                                        <Icon icon="lucide:loader-2" className="mr-2 h-4 w-4 animate-spin inline" />
                                    )}
                                    {isSignUp ? 'Create Account' : 'Sign In with Email'}
                                </button>
                            </div>
                        </form>

                        <div className="text-center">
                            <button
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-xs text-neutral-500 hover:text-white transition-colors"
                            >
                                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                            </button>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-[#0A0B0E] px-2 text-neutral-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={async () => {
                                    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/app/overview` } });
                                    if (error) setError(error.message);
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all disabled:opacity-50"
                            >
                                <Icon icon="flat-color-icons:google" className="h-4 w-4" />
                                Google
                            </button>
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={async () => {
                                    const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/app/overview` } });
                                    if (error) setError(error.message);
                                }}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-all disabled:opacity-50"
                            >
                                <Icon icon="lucide:github" className="h-4 w-4" />
                                GitHub
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
