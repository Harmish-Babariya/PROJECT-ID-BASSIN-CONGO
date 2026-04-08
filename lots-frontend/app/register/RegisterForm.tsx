"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { Eye, EyeOff, Mail, User, AlertCircle } from "lucide-react"

export default function RegisterForm() {
  const router = useRouter()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!name || !email || !password || !confirmPassword) {
      setError(t.register.errorRequired)
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t.register.errorPasswordShort)
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t.register.errorPasswordMismatch)
      setLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (data.error === "USER_EXISTS") {
          setError(t.register.errorUserExists)
        } else {
          setError(t.register.errorServer)
        }
        setLoading(false)
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError(t.register.errorServer)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#edf1f2] relative">
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

        {/* Title & Subtitle */}
        <div className="w-full mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {t.register.title}
          </h1>
          <p className="text-gray-500 text-sm">
            {t.register.subtitle}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="w-full flex items-center gap-3 bg-[#e87461] text-white px-5 py-3.5 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="w-full space-y-5">
          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 tracking-wider mb-2">
              {t.register.name}
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 bg-white text-gray-900 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-[#2ac1a3] focus:border-transparent outline-none
                           placeholder:text-gray-400 text-sm"
                placeholder={t.register.namePlaceholder}
                required
              />
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 tracking-wider mb-2">
              {t.register.email}
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 bg-white text-gray-900 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-[#2ac1a3] focus:border-transparent outline-none
                           placeholder:text-gray-400 text-sm"
                placeholder={t.register.emailPlaceholder}
                required
              />
              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 tracking-wider mb-2">
              {t.register.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 bg-white text-gray-900 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-[#2ac1a3] focus:border-transparent outline-none
                           placeholder:text-gray-400 text-sm"
                placeholder={t.register.passwordPlaceholder}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 tracking-wider mb-2">
              {t.register.confirmPassword}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3.5 pr-12 bg-white text-gray-900 border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-[#2ac1a3] focus:border-transparent outline-none
                           placeholder:text-gray-400 text-sm"
                placeholder={t.register.confirmPasswordPlaceholder}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2ac1a3] text-white py-3.5 rounded-lg font-semibold tracking-wider
                       hover:bg-[#24a88e] disabled:opacity-50 disabled:cursor-not-allowed
                       transition text-sm"
          >
            {loading ? t.register.loading : t.register.submit}
          </button>

          {/* Link to Login */}
          <p className="text-center text-sm text-gray-500">
            {t.register.hasAccount}{" "}
            <Link href="/login" className="font-semibold text-[#2ac1a3] tracking-wider hover:underline">
              {t.register.login}
            </Link>
          </p>
        </form>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-gray-400 tracking-widest">
        {t.register.footer}
      </p>
    </div>
  )
}
