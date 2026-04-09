"use client"
import { useEffect, useState } from "react"
import { CheckCircle, XCircle, X } from "lucide-react"

type ToastType = "success" | "error"

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-slide-in ${
      type === "success" ? "bg-green-600" : "bg-red-600"
    }`}>
      {type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Hook for managing toast state
export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showSuccess = (message: string) => setToast({ message, type: "success" })
  const showError = (message: string) => setToast({ message, type: "error" })
  const hideToast = () => setToast(null)

  return { toast, showSuccess, showError, hideToast }
}
