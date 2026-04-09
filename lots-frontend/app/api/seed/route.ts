import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"

export async function POST() {
  try {
    const ADMIN_EMAIL = "admin@gmail.com"
    const ADMIN_PASSWORD = "admin@123"

    // Check if user already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.email === ADMIN_EMAIL)

    let userId: string

    if (existing) {
      userId = existing.id
      // Update password
      await supabaseAdmin.auth.admin.updateUserById(existing.id, {
        password: ADMIN_PASSWORD,
      })
    } else {
      // Create admin user in auth
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
        user_metadata: { name: "Admin" },
      })

      if (error || !data.user) {
        return NextResponse.json({ success: false, error: error?.message }, { status: 500 })
      }
      userId = data.user.id
    }

    // Ensure user_profiles entry exists with admin role
    // Table structure: id (FK to auth.users.id), role, email, nom_complet, pays_id, etc.
    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single()

    if (profile) {
      await supabaseAdmin
        .from("user_profiles")
        .update({ role: "admin" })
        .eq("id", userId)
    } else {
      await supabaseAdmin
        .from("user_profiles")
        .insert({
          id: userId,
          email: ADMIN_EMAIL,
          role: "admin",
          nom_complet: "Admin",
        })
    }

    return NextResponse.json({
      success: true,
      message: existing ? "Admin user updated" : "Admin user created",
      email: ADMIN_EMAIL,
      userId,
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
