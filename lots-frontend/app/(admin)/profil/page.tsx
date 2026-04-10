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
        role: user.role,
        country: user.country,
        created_at: user.created_at,
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
