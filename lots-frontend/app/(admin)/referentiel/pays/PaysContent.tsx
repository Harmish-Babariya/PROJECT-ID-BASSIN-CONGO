"use client"
import { useMemo, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { translateGeoName } from "@/lib/i18n/geo"
import { actionCreatePays, actionUpdatePays, actionDeletePays } from "./actions"
import Pagination from "@/components/Pagination"
import { usePagination } from "@/components/usePagination"
import ConfirmModal from "@/components/ConfirmModal"
import SortableHeader from "@/components/SortableHeader"
import { useTableSort } from "@/components/useTableSort"

const inputClass = "w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
const labelClass = "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5"

type Pays = { id: number; code: string; nom: string }

export default function PaysContent({ pays }: { pays: Pays[] }) {
  const { t, locale } = useLanguage()
  const tr = t.referentiel
  const displayNom = (nom: string) => translateGeoName(nom, locale)
  const [list, setList] = useState<Pays[]>(pays)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Pays | null>(null)
  const [form, setForm] = useState({ code: "", nom: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [confirmTarget, setConfirmTarget] = useState<Pays | null>(null)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(p =>
      p.code.toLowerCase().includes(q) || p.nom.toLowerCase().includes(q)
    )
  }, [list, search])

  const { sorted, sortKey, sortDirection, toggle } = useTableSort<Pays>(filtered, {
    code: (p) => p.code,
    nom: (p) => p.nom,
  })
  const { page, pageSize, total, setPage, setPageSize, paged } = usePagination(sorted, 10)

  function openNew() {
    setEditing(null)
    setForm({ code: "", nom: "" })
    setError("")
    setSuccess("")
    setShowForm(true)
  }

  function openEdit(p: Pays) {
    setEditing(p)
    setForm({ code: p.code, nom: p.nom })
    setError("")
    setSuccess("")
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm({ code: "", nom: "" })
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const fd = new FormData()
      fd.set("code", form.code)
      fd.set("nom", form.nom)
      if (editing) {
        await actionUpdatePays(editing.id, fd)
        setList(list.map(p => p.id === editing.id ? { ...p, code: form.code.toUpperCase(), nom: form.nom } : p))
        setSuccess(tr.paysUpdateSuccess)
      } else {
        await actionCreatePays(fd)
        setSuccess(tr.paysCreateSuccess)
        // Refresh by reloading
        window.location.reload()
        return
      }
      closeForm()
    } catch (err: any) {
      setError(err.message || tr.genericError)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(p: Pays) {
    try {
      await actionDeletePays(p.id)
      setList(list.filter(x => x.id !== p.id))
      setSuccess(tr.paysDeleteSuccess)
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
          <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{tr.paysBreadcrumb}</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">{tr.paysTitle}</h1>
        </div>
        <button
          onClick={openNew}
          className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#24a88e] transition"
        >
          {tr.paysNew}
        </button>
      </div>

      {success && (
        <div className="bg-[#e6f9f5] border border-[#2ac1a3]/30 text-[#2ac1a3] px-4 py-3 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-5">
              {editing ? tr.paysFormEdit : tr.paysFormNew}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>{tr.paysLabelCode}</label>
                <input
                  className={inputClass}
                  placeholder={tr.paysPlaceholderCode}
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  required
                  maxLength={10}
                />
              </div>
              <div>
                <label className={labelClass}>{tr.paysLabelNom}</label>
                <input
                  className={inputClass}
                  placeholder={tr.paysPlaceholderNom}
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#2ac1a3] text-white py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#24a88e] transition disabled:opacity-60"
                >
                  {loading ? "..." : editing ? tr.paysBtnSave : tr.paysBtnCreate}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-gray-200 transition"
                >
                  {tr.paysBtnCancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <input
          type="text"
          placeholder={tr.searchPlaceholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <SortableHeader label={tr.paysCode} sortKey="code" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={tr.paysNom} sortKey="nom" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tr.paysActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono text-sm font-bold text-[#2ac1a3]">{p.code}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{displayNom(p.nom)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-xs font-semibold text-[#2AC1A3] hover:text-[#1da88e] uppercase tracking-wide transition"
                    >
                      {tr.edit}
                    </button>
                    <button
                      onClick={() => setConfirmTarget(p)}
                      className="text-xs font-semibold text-red-400 hover:text-red-600 uppercase tracking-wide transition"
                    >
                      {tr.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-400 text-sm">{tr.paysEmpty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        total={total}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
      <p className="text-gray-400 text-sm">{tr.paysCount(filtered.length).toUpperCase()}</p>

      <ConfirmModal
        open={!!confirmTarget}
        title={tr.deleteTitle}
        message={tr.paysDeleteConfirm}
        confirmLabel={tr.delete}
        cancelLabel={tr.cancel}
        onConfirm={() => confirmTarget && handleDelete(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
