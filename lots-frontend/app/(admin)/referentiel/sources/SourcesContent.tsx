"use client"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useLanguage } from "@/contexts/LanguageContext"
import { actionCreateSource, actionUpdateSource, actionDeleteSource } from "./actions"
import ConfirmModal from "@/components/ConfirmModal"

const inputClass = "w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
const labelClass = "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5"

type Row = { id: number; source: string; version: string | null; purpose: string | null }

export default function SourcesContent({ rows }: { rows: Row[] }) {
  const { t } = useLanguage()
  const tr = t.referentiel
  const [list, setList] = useState<Row[]>(rows)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Row | null>(null)
  const [form, setForm] = useState({ source: "", version: "", purpose: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [confirmTarget, setConfirmTarget] = useState<Row | null>(null)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    document.body.style.overflow = showForm ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [showForm])

  function openNew() {
    setEditing(null); setForm({ source: "", version: "", purpose: "" }); setError(""); setShowForm(true)
  }
  function openEdit(r: Row) {
    setEditing(r); setForm({ source: r.source, version: r.version ?? "", purpose: r.purpose ?? "" }); setError(""); setShowForm(true)
  }
  function closeForm() {
    setShowForm(false); setEditing(null); setForm({ source: "", version: "", purpose: "" }); setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      const fd = new FormData()
      fd.set("source", form.source)
      fd.set("version", form.version)
      fd.set("purpose", form.purpose)
      if (editing) {
        await actionUpdateSource(editing.id, fd)
        setList(list.map(r => r.id === editing.id ? { ...r, ...form } : r))
        closeForm()
      } else {
        await actionCreateSource(fd)
        window.location.reload()
        return
      }
    } catch (err: any) {
      setError(err.message || tr.genericError)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(r: Row) {
    try {
      await actionDeleteSource(r.id)
      setList(list.filter(x => x.id !== r.id))
    } catch (err: any) {
      setError(err.message || tr.deleteError)
    } finally {
      setConfirmTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{tr.referentielBreadcrumb}</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">{tr.sourcesTitle}</h1>
        </div>
        <button
          onClick={openNew}
          className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#24a88e] transition"
        >
          {tr.sourcesNew}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">{error}</div>
      )}

      {showForm && mounted && createPortal(
        <div className="fixed inset-0 bg-black/70 z-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-5">
              {editing ? tr.sourcesFormEdit : tr.sourcesFormNew}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>{tr.sourcesColSource}</label>
                <input className={inputClass} placeholder={tr.sourcesSourcePlaceholder}
                  value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} required />
              </div>
              <div>
                <label className={labelClass}>{tr.sourcesColVersion}</label>
                <input className={inputClass} placeholder={tr.sourcesVersionPlaceholder}
                  value={form.version} onChange={e => setForm(f => ({ ...f, version: e.target.value }))} />
              </div>
              <div>
                <label className={labelClass}>{tr.sourcesColPurpose}</label>
                <textarea className={inputClass} rows={3} placeholder={tr.sourcesPurposePlaceholder}
                  value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-[#2ac1a3] text-white py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#24a88e] transition disabled:opacity-60">
                  {loading ? "..." : editing ? tr.btnSave : tr.btnCreate}
                </button>
                <button type="button" onClick={closeForm}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-gray-200 transition">
                  {tr.cancel}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tr.sourcesColSource}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tr.sourcesColVersion}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tr.sourcesColPurpose}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tr.paysActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {list.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-bold text-gray-900">{r.source}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{r.version || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-[320px]">{r.purpose || "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => openEdit(r)} className="text-xs font-semibold text-[#2AC1A3] hover:text-[#1da88e] uppercase tracking-wide transition">{tr.edit}</button>
                    <button onClick={() => setConfirmTarget(r)} className="text-xs font-semibold text-red-400 hover:text-red-600 uppercase tracking-wide transition">{tr.delete}</button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">{tr.sourcesEmpty}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!confirmTarget}
        title={tr.deleteTitle}
        message={tr.sourcesDeleteConfirm}
        confirmLabel={tr.delete}
        cancelLabel={tr.cancel}
        onConfirm={() => confirmTarget && handleDelete(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
