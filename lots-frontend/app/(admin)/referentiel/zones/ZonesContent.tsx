"use client"
import { useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { actionCreateZone, actionUpdateZone, actionDeleteZone } from "./actions"
import Pagination from "@/components/Pagination"
import { usePagination } from "@/components/usePagination"
import ConfirmModal from "@/components/ConfirmModal"
import SortableHeader from "@/components/SortableHeader"
import { useTableSort } from "@/components/useTableSort"

const inputClass = "w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
const selectClass = "w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
const labelClass = "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5"

type Pays = { id: number; code: string; nom: string }
type Zone = { id: number; code: string; nom: string; pays_id: number; pays?: Pays }

export default function ZonesContent({ zones, pays }: { zones: Zone[]; pays: Pays[] }) {
  const { t } = useLanguage()
  const tr = t.referentiel
  const [list, setList] = useState<Zone[]>(zones)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Zone | null>(null)
  const [form, setForm] = useState({ code: "", nom: "", pays_id: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")
  const [confirmTarget, setConfirmTarget] = useState<Zone | null>(null)

  const filtered = list.filter(z =>
    z.nom.toLowerCase().includes(search.toLowerCase()) ||
    z.code.toLowerCase().includes(search.toLowerCase()) ||
    (z.pays as any)?.nom?.toLowerCase().includes(search.toLowerCase())
  )
  const { sorted, sortKey, sortDirection, toggle } = useTableSort<Zone>(filtered, {
    code: (z) => z.code,
    nom: (z) => z.nom,
    pays: (z) => (z.pays as any)?.nom ?? "",
  })
  const { page, pageSize, total, setPage, setPageSize, paged } = usePagination(sorted, 10)

  function openNew() {
    setEditing(null)
    setForm({ code: "", nom: "", pays_id: "" })
    setError("")
    setSuccess("")
    setShowForm(true)
  }

  function openEdit(z: Zone) {
    setEditing(z)
    setForm({ code: z.code, nom: z.nom, pays_id: String(z.pays_id) })
    setError("")
    setSuccess("")
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm({ code: "", nom: "", pays_id: "" })
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
      fd.set("pays_id", form.pays_id)
      if (editing) {
        await actionUpdateZone(editing.id, fd)
        const paysObj = pays.find(p => p.id === parseInt(form.pays_id))
        setList(list.map(z => z.id === editing.id
          ? { ...z, code: form.code.toUpperCase(), nom: form.nom, pays_id: parseInt(form.pays_id), pays: paysObj }
          : z
        ))
        setSuccess(tr.zonesUpdateSuccess)
        closeForm()
      } else {
        await actionCreateZone(fd)
        setSuccess(tr.zonesCreateSuccess)
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message || tr.genericError)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(z: Zone) {
    try {
      await actionDeleteZone(z.id)
      setList(list.filter(x => x.id !== z.id))
      setSuccess(tr.zonesDeleteSuccess)
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
          <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{tr.zonesBreadcrumb}</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">{tr.zonesTitle}</h1>
        </div>
        <button
          onClick={openNew}
          className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#24a88e] transition"
        >
          {tr.zonesNew}
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

      {/* Search */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <input
          type="text"
          placeholder={tr.searchZone}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-5">
              {editing ? tr.zonesFormEdit : tr.zonesFormNew}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>{tr.zonesLabelPays}</label>
                <select
                  className={selectClass}
                  value={form.pays_id}
                  onChange={e => setForm(f => ({ ...f, pays_id: e.target.value }))}
                  required
                >
                  <option value="">{tr.zonesSelectPays}</option>
                  {pays.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{tr.zonesLabelCode}</label>
                <input
                  className={inputClass}
                  placeholder={tr.zonesPlaceholderCode}
                  value={form.code}
                  onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                  required
                  maxLength={10}
                />
              </div>
              <div>
                <label className={labelClass}>{tr.zonesLabelNom}</label>
                <input
                  className={inputClass}
                  placeholder={tr.zonesPlaceholderNom}
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
                  {loading ? "..." : editing ? tr.zonesBtnSave : tr.zonesBtnCreate}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-gray-200 transition"
                >
                  {tr.zonesBtnCancel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <SortableHeader label={tr.zonesCode} sortKey="code" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={tr.zonesNom} sortKey="nom" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <SortableHeader label={tr.zonesPays} sortKey="pays" activeKey={sortKey} direction={sortDirection} onToggle={toggle} />
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tr.zonesActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map(z => (
              <tr key={z.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 font-mono text-sm font-bold text-[#2ac1a3]">{z.code}</td>
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{z.nom}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{(z.pays as any)?.nom || "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => openEdit(z)} className="text-xs font-semibold text-[#2AC1A3] hover:text-[#1da88e] uppercase tracking-wide transition">
                      {tr.edit}
                    </button>
                    <button onClick={() => setConfirmTarget(z)} className="text-xs font-semibold text-red-400 hover:text-red-600 uppercase tracking-wide transition">
                      {tr.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">{tr.zonesEmpty}</td>
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
      <p className="text-gray-400 text-sm">{tr.zonesCount(filtered.length).toUpperCase()}</p>

      <ConfirmModal
        open={!!confirmTarget}
        title={tr.deleteTitle}
        message={tr.zonesDeleteConfirm}
        confirmLabel={tr.delete}
        cancelLabel={tr.cancel}
        onConfirm={() => confirmTarget && handleDelete(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  )
}
