import nodemailer, { type Transporter } from "nodemailer"
import {
  MAILJET_API_KEY,
  MAILJET_API_SECRET,
  MAILJET_FROM_EMAIL,
  MAILJET_FROM_NAME,
} from "@/lib/env"

// Mailjet SMTP relay config:
//   SMTP Server: in-v3.mailjet.com
//   Username: MAILJET_API_KEY, Password: MAILJET_API_SECRET
//   Port 587 (STARTTLS, preferred) or 465 (TLS)
type SendArgs = {
  to: string
  toName?: string
  subject: string
  textPart: string
  htmlPart: string
}

let cachedTransporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (!MAILJET_API_KEY || !MAILJET_API_SECRET) return null
  if (cachedTransporter) return cachedTransporter
  cachedTransporter = nodemailer.createTransport({
    host: "in-v3.mailjet.com",
    port: 587,
    secure: false, // STARTTLS on 587
    auth: {
      user: MAILJET_API_KEY,
      pass: MAILJET_API_SECRET,
    },
  })
  return cachedTransporter
}

export async function sendMail({
  to,
  toName,
  subject,
  textPart,
  htmlPart,
}: SendArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!MAILJET_FROM_EMAIL) {
    return { ok: false, error: "MAIL_NOT_CONFIGURED" }
  }
  const transporter = getTransporter()
  if (!transporter) {
    return { ok: false, error: "MAIL_NOT_CONFIGURED" }
  }

  const from = MAILJET_FROM_NAME
    ? `"${MAILJET_FROM_NAME}" <${MAILJET_FROM_EMAIL}>`
    : MAILJET_FROM_EMAIL
  const recipient = toName ? `"${toName}" <${to}>` : to

  try {
    await transporter.sendMail({
      from,
      to: recipient,
      subject,
      text: textPart,
      html: htmlPart,
    })
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "MAIL_SEND_FAILED",
    }
  }
}

export function buildInviteEmail(opts: {
  fullName: string
  email: string
  tempPassword: string
  loginUrl: string
  roleLabel: string
}) {
  const subject = "Votre compte ID Bassin Congo a été créé"

  const textPart = [
    `Bonjour ${opts.fullName},`,
    "",
    `Un compte ID Bassin Congo vient de vous être créé (rôle : ${opts.roleLabel}).`,
    "",
    "Voici vos identifiants de connexion :",
    `  E-mail       : ${opts.email}`,
    `  Mot de passe : ${opts.tempPassword}`,
    "",
    `Connectez-vous ici : ${opts.loginUrl}`,
    "",
    "Pour des raisons de sécurité, changez votre mot de passe après votre première connexion.",
    "",
    "— ID Bassin Congo",
  ].join("\n")

  const htmlPart = `<!doctype html>
<html>
  <body style="font-family: Arial, Helvetica, sans-serif; background:#f4f6f8; padding:24px; color:#1f2937;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border-radius:12px; padding:28px; border:1px solid #e5e7eb;">
      <h1 style="margin:0 0 16px; font-size:20px; color:#111827;">Bienvenue sur ID Bassin Congo</h1>
      <p>Bonjour <strong>${escapeHtml(opts.fullName)}</strong>,</p>
      <p>Un compte vient de vous être créé pour la plateforme de traçabilité ID Bassin Congo (rôle&nbsp;: <strong>${escapeHtml(opts.roleLabel)}</strong>).</p>
      <div style="margin:20px 0; background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; padding:16px;">
        <p style="margin:0 0 6px; font-size:12px; letter-spacing:0.1em; color:#6b7280; text-transform:uppercase;">E-mail</p>
        <p style="margin:0 0 14px; font-family:monospace; font-size:14px;">${escapeHtml(opts.email)}</p>
        <p style="margin:0 0 6px; font-size:12px; letter-spacing:0.1em; color:#6b7280; text-transform:uppercase;">Mot de passe temporaire</p>
        <p style="margin:0; font-family:monospace; font-size:16px; letter-spacing:0.08em;">${escapeHtml(opts.tempPassword)}</p>
      </div>
      <p style="text-align:center; margin:24px 0;">
        <a href="${escapeAttr(opts.loginUrl)}" style="display:inline-block; background:#2ac1a3; color:#ffffff; text-decoration:none; padding:12px 22px; border-radius:8px; font-weight:600; letter-spacing:0.08em;">SE CONNECTER</a>
      </p>
      <p style="font-size:13px; color:#6b7280;">Pour votre sécurité, pensez à changer ce mot de passe après votre première connexion.</p>
      <p style="font-size:12px; color:#9ca3af; margin-top:28px;">— ID Bassin Congo</p>
    </div>
  </body>
</html>`

  return { subject, textPart, htmlPart }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeAttr(s: string) {
  return escapeHtml(s)
}
