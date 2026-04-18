import { getCurrentUser } from "@/lib/services/auth"
import { getProducteursStats } from "@/lib/services/producteurs"
import { getLotsStats } from "@/lib/services/lots"
import ProfileClient from "./ProfileClient"

export default async function ProfilPage() {
  const [user, producteurs, lots] = await Promise.all([
    getCurrentUser(),
    getProducteursStats(),
    getLotsStats(),
  ])

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
      stats={{
        producteurs: producteurs.length,
        lotsGeneres: lots.length,
        ddsEmises: 67,
        actionsLoguees: 1284,
      }}
    />
  )
}
