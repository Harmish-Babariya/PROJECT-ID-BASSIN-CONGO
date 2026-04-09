import Link from "next/link"
import { getCurrentUser } from "@/lib/services/auth"
import { redirect } from "next/navigation"

export default async function ProfilPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  const roleBadgeColor = user.role === "admin"
    ? "bg-purple-100 text-purple-700"
    : "bg-blue-100 text-blue-700"

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 tracking-widest uppercase mb-1">
          ID BASSIN CONGO / PROFIL
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-[#2ac1a3]/10 flex items-center justify-center">
            <span className="text-2xl font-bold text-[#2ac1a3]">
              {user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.email}</h2>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${roleBadgeColor}`}>
              {user.role === "admin" ? "Administrateur" : "Point Focal"}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <ProfileRow label="Email" value={user.email} />
          <ProfileRow label="Role" value={user.role === "admin" ? "Administrateur" : "Point Focal"} />
          <ProfileRow label="Pays" value={user.country || "Non assigne"} />
          <ProfileRow
            label="Membre depuis"
            value={user.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }) : "-"}
          />
        </div>
      </div>

      <div className="max-w-2xl">
        <Link
          href="/dashboard"
          className="text-[#2ac1a3] hover:underline text-sm"
        >
          &larr; Retour au tableau de bord
        </Link>
      </div>
    </div>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  )
}
