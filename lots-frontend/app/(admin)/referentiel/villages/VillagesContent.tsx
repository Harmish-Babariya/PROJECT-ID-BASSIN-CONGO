"use client"
import { useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { actionCreateVillage, actionUpdateVillage, actionDeleteVillage } from "./actions"
import Pagination from "@/components/Pagination"
import { usePagination } from "@/components/usePagination"

const inputClass = "w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
const selectClass = "w-full px-4 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#2ac1a3] focus:ring-1 focus:ring-[#2ac1a3]"
const labelClass = "block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5"

type Pays = { id: number; code: string; nom: string }
type Zone = { id: number; code: string; nom: string; pays_id: number; pays?: Pays }
type Village = { id: number; nom: string; zone_id: number; zones?: Zone }

export default function VillagesContent({ villages, zones }: { villages: Village[]; zones: Zone[] }) {
  const { t } = useLanguage()
  const tr = t.referentiel
  const [list, setList] = useState<Village[]>(villages)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Village | null>(null)
  const [form, setForm] = useState({ nom: "", zone_id: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [search, setSearch] = useState("")
  const [filterZone, setFilterZone] = useState("")

  const filtered = list.filter(v => {
    const matchSearch = v.nom.toLowerCase().includes(search.toLowerCase()) ||
      (v.zones as any)?.nom?.toLowerCase().includes(search.toLowerCase()) ||
      (v.zones as any)?.pays?.nom?.toLowerCase().includes(search.toLowerCase())
    const matchZone = !filterZone || String(v.zone_id) === filterZone
    return matchSearch && matchZone
  })
  const { page, pageSize, total, setPage, setPageSize, paged } = usePagination(filtered, 10)

  function openNew() {
    setEditing(null)
    setForm({ nom: "", zone_id: "" })
    setError("")
    setSuccess("")
    setShowForm(true)
  }

  function openEdit(v: Village) {
    setEditing(v)
    setForm({ nom: v.nom, zone_id: String(v.zone_id) })
    setError("")
    setSuccess("")
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setForm({ nom: "", zone_id: "" })
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const fd = new FormData()
      fd.set("nom", form.nom)
      fd.set("zone_id", form.zone_id)
      if (editing) {
        await actionUpdateVillage(editing.id, fd)
        const zoneObj = zones.find(z => z.id === parseInt(form.zone_id))
        setList(list.map(v => v.id === editing.id
          ? { ...v, nom: form.nom, zone_id: parseInt(form.zone_id), zones: zoneObj }
          : v
        ))
        setSuccess(tr.villagesUpdateSuccess)
        closeForm()
      } else {
        await actionCreateVillage(fd)
        setSuccess(tr.villagesCreateSuccess)
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(v: Village) {
    if (!confirm(tr.villagesDeleteConfirm)) return
    try {
      await actionDeleteVillage(v.id)
      setList(list.filter(x => x.id !== v.id))
      setSuccess(tr.villagesDeleteSuccess)
    } catch (err: any) {
      setError(err.message || "Erreur suppression")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{tr.villagesBreadcrumb}</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-wide">{tr.villagesTitle}</h1>
        </div>
        <button
          onClick={openNew}
          className="bg-[#2ac1a3] text-white px-5 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-[#24a88e] transition"
        >
          {tr.villagesNew}
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

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher un village..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={inputClass}
          />
        </div>
        <select
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#2ac1a3]"
          value={filterZone}
          onChange={e => setFilterZone(e.target.value)}
        >
          <option value="">Toutes les zones</option>
          {zones.map(z => (
            <option key={z.id} value={z.id}>{z.nom}</option>
          ))}
        </select>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide mb-5">
              {editing ? tr.villagesFormEdit : tr.villagesFormNew}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>{tr.villagesLabelZone}</label>
                <select
                  className={selectClass}
                  value={form.zone_id}
                  onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))}
                  required
                >
                  <option value="">{tr.villagesSelectZone}</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.nom} — {(z.pays as any)?.nom || ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>{tr.villagesLabelNom}</label>
                <input
                  className={inputClass}
                  placeholder={tr.villagesPlaceholderNom}
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
                  {loading ? "..." : editing ? tr.villagesBtnSave : tr.villagesBtnCreate}
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-gray-200 transition"
                >
                  {tr.villagesBtnCancel}
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
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tr.villagesNom}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tr.villagesZone}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tr.villagesPays}</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-500 tracking-widest uppercase">{tr.villagesActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paged.map(v => (
              <tr key={v.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{v.nom}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{(v.zones as any)?.nom || "—"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{(v.zones as any)?.pays?.nom || "—"}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <button onClick={() => openEdit(v)} className="text-xs font-semibold text-gray-500 hover:text-[#2ac1a3] uppercase tracking-wide transition">
                      Modifier
                    </button>
                    <button onClick={() => handleDelete(v)} className="text-xs font-semibold text-gray-500 hover:text-red-500 uppercase tracking-wide transition">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-400 text-sm">{tr.villagesEmpty}</td>
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
      <p className="text-gray-400 text-sm">{tr.villagesCount(filtered.length).toUpperCase()}</p>
    </div>
  )
}
