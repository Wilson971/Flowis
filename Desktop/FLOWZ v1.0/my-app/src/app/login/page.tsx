"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useRef, useCallback, Suspense } from "react"
import { motion } from "framer-motion"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Info,
  Github,
  Chrome,
  Zap,
  Users,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motionTokens } from "@/lib/design-system"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MatrixRainCanvas } from "./MatrixRainCanvas"

function LoginContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [emailValid, setEmailValid] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const loginBoxRef = useRef<HTMLDivElement>(null)
  const loginContainerRef = useRef<HTMLDivElement>(null)

  const redirectPath = searchParams.get("redirect") || "/app/overview"

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setEmail(value)
      setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
    },
    []
  )

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  const handleCollision = useCallback(() => {
    loginContainerRef.current?.classList.add("protected")
    setTimeout(() => {
      loginContainerRef.current?.classList.remove("protected")
    }, 1500)
  }, [])

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
        setError("Consultez votre boite mail pour le lien de confirmation.")
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push(redirectPath)
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue"
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOAuth(provider: "google" | "github") {
    setIsLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      },
    })
    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden antialiased">
      {/* Matrix Rain + Physics */}
      <MatrixRainCanvas
        loginBoxRef={loginBoxRef}
        onCollision={handleCollision}
      />

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-muted/20 via-background to-background opacity-40" />

      {/* Navigation Back */}
      <div className="absolute top-8 left-8 z-20">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Retour
        </Link>
      </div>

      {/* Login Container */}
      <div
        ref={loginContainerRef}
        className="login-container w-full max-w-md px-6"
      >
        {/* Logo Section */}
        <motion.div
          variants={motionTokens.variants.fadeIn}
          initial="hidden"
          animate="visible"
          className="text-center mb-8 floating"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-xl shadow-primary/20 relative overflow-hidden">
            <Zap className="relative z-10 h-8 w-8 text-primary-foreground" />
            <div className="absolute inset-0 bg-primary/20" />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">
            FLOWZ
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? "Creez votre espace de travail"
              : "Connectez-vous a votre espace de travail"}
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-success/15 border border-success/30 rounded-full text-[11px] font-medium text-success">
              <ShieldCheck className="h-3 w-3" />
              <span>Session Protegee</span>
            </div>
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div
          variants={motionTokens.variants.slideUp}
          initial="hidden"
          animate="visible"
        >
          <div
            ref={loginBoxRef}
            className={cn(
              "bg-card/80 backdrop-blur-xl border border-border/40 rounded-2xl p-6 relative shadow-xl overflow-hidden"
            )}
          >
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />

            <form onSubmit={onSubmit} className="space-y-6 relative z-10">
              {/* Error message */}
              {error && (
                <div
                  className={cn(
                    "p-3 rounded-lg text-xs font-medium border",
                    error.includes("confirm") || error.includes("boite")
                      ? "bg-primary/10 border-primary/20 text-primary"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  )}
                >
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-foreground"
                >
                  Adresse e-mail
                  <span className="text-xs text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="emma.chen@company.com"
                    value={email}
                    onChange={handleEmailChange}
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    required
                    disabled={isLoading}
                    variant="glass"
                    className="h-12 pl-12 pr-10 rounded-xl text-foreground"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div
                      className={cn(
                        "w-2 h-2 bg-info rounded-full transition-opacity duration-300",
                        emailValid ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="flex items-center gap-2 text-foreground"
                >
                  Mot de passe
                  <span className="text-xs text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoCapitalize="none"
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    variant="glass"
                    className="h-12 pl-12 pr-12 rounded-xl text-foreground"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(checked) =>
                      setRememberMe(checked === true)
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    Se souvenir de moi
                  </span>
                </label>
                {!isSignUp && (
                  <a
                    href="#"
                    className="text-sm text-primary hover:text-primary/80 font-medium transition-colors hover:underline"
                  >
                    Mot de passe oublie ?
                  </a>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="glow"
                disabled={isLoading}
                className="w-full h-12 rounded-xl text-sm font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Connexion en cours...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isSignUp ? "Creer mon compte" : "Se connecter"}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>

              {/* Security Notice */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg border border-border/40">
                <Info className="h-4 w-4 shrink-0 text-primary" />
                <span>
                  Connexion securisee avec chiffrement SSL 256 bits
                </span>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-card text-muted-foreground font-medium">
                    Ou continuer avec
                  </span>
                </div>
              </div>

              {/* Social Login */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="glass"
                  disabled={isLoading}
                  onClick={() => handleOAuth("github")}
                  className="h-12 rounded-xl"
                >
                  <Github className="h-5 w-5" />
                  <span className="text-sm font-medium">GitHub</span>
                </Button>
                <Button
                  type="button"
                  variant="glass"
                  disabled={isLoading}
                  onClick={() => handleOAuth("google")}
                  className="h-12 rounded-xl"
                >
                  <Chrome className="h-5 w-5" />
                  <span className="text-sm font-medium">Google</span>
                </Button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Sign Up / Sign In Toggle */}
        <motion.div
          variants={motionTokens.variants.fadeIn}
          initial="hidden"
          animate="visible"
          transition={motionTokens.transitions.slow}
          className="text-center mt-6"
        >
          <button
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp
              ? "Deja un compte ? Se connecter"
              : "Pas encore de compte ? "}
            {!isSignUp && (
              <span className="text-primary font-medium hover:text-primary/80 transition-colors hover:underline">
                Creer un compte
              </span>
            )}
          </button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          variants={motionTokens.variants.fadeIn}
          initial="hidden"
          animate="visible"
          transition={motionTokens.transitions.slow}
          className="flex items-center justify-center gap-6 mt-8 text-xs text-muted-foreground flex-wrap"
        >
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/50 transition-all duration-200">
            <ShieldCheck className="h-4 w-4 text-success" />
            <span>Certifie SOC 2</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/50 transition-all duration-200">
            <Lock className="h-4 w-4 text-primary" />
            <span>SSL 256 bits</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted/50 transition-all duration-200">
            <Users className="h-4 w-4 text-info" />
            <span>125k+ equipes</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  )
}
