"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import LanguageSwitcher from "@/components/LanguageSwitcher"
import { Eye, EyeOff, Mail, AlertCircle } from "lucide-react"

export default function LoginForm() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!email || !password) {
      setError(t.login.errorRequired)
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.error === "INVALID_CREDENTIALS") {
          setError(t.login.errorInvalidCredentials)
        } else if (data.error === "USER_INACTIVE") {
          setError(t.login.errorDeactivated)
        } else {
          setError(t.login.errorServer)
        }
        setLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError(t.login.errorServer)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#edf1f2] relative">
      {/* Language Switcher - top right */}
      <div className="absolute top-5 right-5">
        <LanguageSwitcher variant="auth" />
      </div>

      {/* Centered Content */}
      <div className="w-full max-w-md flex flex-col items-center px-6">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="ID Bassin Congo"
            width={220}
            height={70}
            priority
          />
        </div>

        {/* Title & Subtitle - left aligned within the card */}
        <div className="w-full mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t.login.title}
          </h1>
          <p className="text-gray-500 text-sm">
            {t.login.subtitle}
          </p>
        </div>

        {/* Error Banner - solid coral bg with white text */}
        {error && (
          <div className="w-full flex items-center gap-3 bg-[#e87461] text-white px-5 py-3.5 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full space-y-5">
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 tracking-wider mb-2">
              {t.login.email}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 bg-white text-gray-900 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-[#2ac1a3] focus:border-transparent outline-none
                           placeholder:text-gray-400 text-sm"
                placeholder={t.login.emailPlaceholder}
                required
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 tracking-wider mb-2">
              {t.login.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 bg-white text-gray-900 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-[#2ac1a3] focus:border-transparent outline-none
                           placeholder:text-gray-400 text-sm"
                placeholder={t.login.passwordPlaceholder}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me + Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-[#2ac1a3] focus:ring-[#2ac1a3]"
              />
              <span className="text-sm text-gray-600">{t.login.rememberMe}</span>
            </label>
            <button
              type="button"
              className="text-xs font-semibold text-[#2ac1a3] tracking-wider hover:underline"
            >
              {t.login.forgotPassword}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2ac1a3] text-white py-3.5 rounded-lg font-semibold tracking-wider
                       hover:bg-[#24a88e] disabled:opacity-50 disabled:cursor-not-allowed
                       transition text-sm"
          >
            {loading ? t.login.loading : t.login.submit}
          </button>

          {/* Footer spacer */}
          <div className="h-4" />
        </form>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-gray-400 tracking-widest">
        {t.login.footer}
      </p>
    </div>
  )
}
