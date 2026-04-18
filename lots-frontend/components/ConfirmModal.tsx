"use client"
import { TriangleAlert } from "lucide-react"

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="px-7 py-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              danger ? "bg-red-50" : "bg-[#C4943A]/10"
            }`}>
              <TriangleAlert className={`w-4 h-4 ${danger ? "text-red-500" : "text-[#C4943A]"}`} />
            </div>
            <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
          </div>
        </div>
        <div className="px-7 py-5">
          <p className="text-[13px] text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="px-7 py-5 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 bg-white text-gray-600 text-[10px] font-semibold tracking-[0.08em] rounded-lg uppercase hover:bg-gray-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white text-[10px] font-semibold tracking-[0.08em] rounded-lg uppercase transition ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[#C4943A] hover:bg-[#b07d30]"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
