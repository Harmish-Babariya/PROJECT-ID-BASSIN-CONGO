import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-server"
import { getCurrentUser } from "@/lib/services/auth"
import { apiError } from "@/lib/api-errors"
import { insertAuditLog } from "@/lib/services/audit"

export async function POST(request: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return apiError("UNAUTHORIZED", 401)

  let body: { currentPassword?: string; newPassword?: string }
  try {
    body = await request.json()
  } catch {
    return apiError("INVALID_BODY", 400)
  }

  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return apiError("MISSING_FIELDS", 400)
  }

  if (newPassword.length < 8) {
    return apiError("PASSWORD_TOO_SHORT", 400)
  }

  // Verify current password by attempting sign-in
  const { error: verifyError } = await supabaseAdmin.auth.signInWithPassword({
    email: me.email,
    password: currentPassword,
  })

  if (verifyError) {
    return apiError("WRONG_CURRENT_PASSWORD", 401)
  }

  // Update to new password
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    me.id,
    { password: newPassword }
  )

  if (updateError) {
    return apiError("UPDATE_FAILED", 500, { detail: updateError.message })
  }

  await insertAuditLog(me.id, "change_password", "user_profiles", me.id)

  return NextResponse.json({ success: true })
}
