"use client"
import { useLanguage } from "@/contexts/LanguageContext"

type Profile = {
  id: string
  nom_complet: string | null
  email: string | null
  role: string | null
  created_at: string | null
  pays: { nom: string } | null
}

export default function UtilisateursContent({ profiles }: { profiles: Profile[] }) {
  const { t } = useLanguage()
  const u = t.utilisateurs

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">{u.breadcrumb}</p>
        <h1 className="text-2xl font-bold text-gray-900">{u.title}</h1>
        <p className="text-gray-500 text-sm mt-1">{u.subtitle}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{u.colName}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{u.colEmail}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{u.colRole}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{u.colCountry}</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">{u.colDate}</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{user.nom_complet || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email || "-"}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {user.role === "admin" ? u.roleAdmin : u.roleFocal}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.pays?.nom || "-"}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {profiles.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">{u.empty}</p>
        </div>
      )}
    </div>
  )
}
