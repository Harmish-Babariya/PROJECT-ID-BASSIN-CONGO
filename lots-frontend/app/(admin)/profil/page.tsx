import { getCurrentUser } from "@/lib/services/auth"
import { getProfileStats, getRecentActivity } from "@/lib/services/audit"
import ProfileClient from "./ProfileClient"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function ProfilPage() {
  const user = await getCurrentUser()

  const isAdmin = user?.role === "admin"

  const [rawStats, recentActivity] = await Promise.all([
    user
      ? getProfileStats(user.id, user.role, user.country_id)
      : Promise.resolve(null),
    user
      ? getRecentActivity(user.id, user.role, isAdmin ? 10 : 5)
      : Promise.resolve([]),
  ])

  // Admin: producteurs / lots / dds / actions
  // Point focal: producteurs / parcelles / collectes / actions (country-scoped)
  const stats = isAdmin
    ? {
        producteurs: rawStats?.producteurs ?? 0,
        lotsGeneres: rawStats?.lots ?? 0,
        ddsEmises: rawStats?.dds ?? 0,
        actionsLoguees: rawStats?.totalActions ?? 0,
      }
    : {
        producteurs: rawStats?.producteurs ?? 0,
        lotsGeneres: rawStats?.parcelles ?? 0,   // slot 2: parcelles for focal
        ddsEmises: rawStats?.collectes ?? 0,      // slot 3: collectes for focal
        actionsLoguees: rawStats?.totalActions ?? 0,
      }

  return (
    <ProfileClient
      user={user ? {
        email: user.email,
        nom_complet: user.nom_complet,
        organisation: user.organisation,
        user_code: user.user_code,
        role: user.role,
        country: user.country,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
      } : null}
      stats={stats}
      recentActivity={recentActivity}
    />
  )
}
