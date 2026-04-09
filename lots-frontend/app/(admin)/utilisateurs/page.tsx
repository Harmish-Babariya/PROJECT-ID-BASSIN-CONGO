import { supabaseAdmin } from "@/lib/supabase-server"

export default async function UtilisateursPage() {
  const { data: profiles } = await supabaseAdmin
    .from("user_profiles")
    .select("*, pays(nom)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">
          ID BASSIN CONGO / UTILISATEURS
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
        <p className="text-gray-500 text-sm mt-1">
          Liste des utilisateurs de la plateforme.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Nom</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Email</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Role</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Pays</th>
              <th className="px-6 py-3 text-left text-[10px] font-semibold text-gray-500 tracking-widest uppercase">Date creation</th>
            </tr>
          </thead>
          <tbody>
            {(profiles || []).map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {u.nom_complet || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {u.email || "-"}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    u.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {u.role === "admin" ? "Administrateur" : "Point Focal"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {u.pays?.nom || "-"}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {u.created_at
                    ? new Date(u.created_at).toLocaleDateString("fr-FR")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!profiles || profiles.length === 0) && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Aucun utilisateur enregistre</p>
        </div>
      )}
    </div>
  )
}
