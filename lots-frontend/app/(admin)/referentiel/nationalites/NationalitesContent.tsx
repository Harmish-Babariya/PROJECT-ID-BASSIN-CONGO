"use client"
import { useMemo, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { actionCreateNationalite, actionUpdateNationalite, actionDeleteNationalite } from "./actions"
import Pagination from "@/components/Pagination"
import { usePagination } from "@/components/usePagination"
import ConfirmModal from "@/components/ConfirmModal"
import SortableHeader from "@/components/SortableHeader"
import { useTableSort } from "@/components/useTableSort"

const inputClass = "w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
const labelClass = "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5"

type Nationalite = { id: number; code: string; nom: string }

export default function NationalitesContent({ nationalites }: { nationalites: Nationalite[] }) {
  const { t } = useLanguage()
  const tr = t.referentiel
  const labels = (t.producteurs as { optionLabels?: Record<string, string> }).optionLabels ?? {}
  const displayNom = (nom: string) => labels[nom] ?? nom
  const [list, setList] = useState<Nationalite[]>(nationalites)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Nationalite | null>(null)
  const [form, setForm] = useState({ code: "", nom: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [confirmTarget, setConfirmTarget] = useState<Nationalite | null>(null)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(n =>
      n.code.toLowerCase().includes(q) ||
      n.nom.toLowerCase().includes(q) ||
      (labels[n.nom] ?? n.nom).toLowerCase().includes(q)
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, search, labels])

  const { sorted, sortKey, sortDirection, toggle } = useTableSort<Nationalite>(filtered, {
    code: (n) => n.code,
    nom: (n) => displayNom(n.nom),
  })
  const { page, pageSize, total, setPage, setPageSize, paged } = usePagination(sorted, 10)

  function openNew() {
    setEditing(null)
    setForm({ code: "", nom: "" })
    setError("")
    setSuccess("")
    setShowForm(true)
  }

  function openEdit(n: Nationalite) {
    setEditing(n)
    setForm({ code: n.code, nom: n.nom })
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
        await actionUpdateNationalite(editing.id, fd)
        setList(list.map(n => n.id === editing.id ? { ...n, code: form.code.toUpperCase(), nom: form.nom } : n))
        setSuccess(tr.nationalitesUpdateSuccess)
      } else {
        await actionCreateNationalite(fd)
        setSuccess(tr.nationalitesCreateSuccess)
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

  async function handleDelete(n: Nationalite) {
    try {
      await actionDeleteNationalite(n.id)
      setList(list.filter(x => x.id !== n.id))
      setSuccess(tr.nationalitesDeleteSuccess)
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
          <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{tr.nationalitesBreadcrumb}</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">{tr.nationalitesTitle}</h1>
        </div>
        <button
          onClick={openNew}
          className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#24a88e] transition"
        >
          {tr.nationalitesNew}
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
              {editing ? tr.nationalitesFormEdit : tr.nationalitesFormNew}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>{tr.nationalitesLabelCode}</label>
                <input
                  className={inputClass}
                  placeholder={tr.nationalitesPlaceholderCode}
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  required
                  maxLength={10}
                />
              </div>
              <div>
                <label className={labelClass}>{tr.nationalitesLabelNom}</label>
                <input
                  className={inputClass}
                  placeholder={tr.nationalitesPlaceholderNom}
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
                  {loading ? "..." : editing ? tr.nationalitesBtnSave : tr.nationalitesBtnCreate}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-gray-200 transition"
                >
                  {tr.nationalitesBtnCancel}
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
              <SortableHeader label={tr.nationalitesCode} sortKey="code" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={tr.nationalitesNom} sortKey="nom" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tr.nationalitesActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map(n => (
              <tr key={n.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono text-sm font-bold text-[#2ac1a3]">{n.code}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{displayNom(n.nom)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => openEdit(n)}
                      className="text-xs font-semibold text-[#2AC1A3] hover:text-[#1da88e] uppercase tracking-wide transition"
                    >
                      {tr.edit}
                    </button>
                    <button
                      onClick={() => setConfirmTarget(n)}
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
                <td colSpan={3} className="px-6 py-12 text-center text-gray-400 text-sm">{tr.nationalitesEmpty}</td>
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
      <p className="text-gray-400 text-sm">{tr.nationalitesCount(filtered.length).toUpperCase()}</p>

      <ConfirmModal
        open={!!confirmTarget}
        title={tr.deleteTitle}
        message={tr.nationalitesDeleteConfirm}
        confirmLabel={tr.delete}
        cancelLabel={tr.cancel}
        onConfirm={() => confirmTarget && handleDelete(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
