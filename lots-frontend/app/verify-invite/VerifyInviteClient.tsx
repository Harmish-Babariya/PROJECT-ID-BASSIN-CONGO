"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, AlertCircle } from "lucide-react"

type Status =
  | { kind: "loading" }
  | {
      kind: "success"
      email: string | null
      mailFailed: boolean
      alreadyVerified: boolean
      message: string | null
    }
  | { kind: "error"; message: string }

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN:
    "Ce lien de vérification est invalide. Demandez à un administrateur de vous renvoyer une invitation.",
  TOKEN_EXPIRED:
    "Ce lien a expiré. Demandez à un administrateur de vous renvoyer une invitation.",
  VERIFY_FAILED:
    "La vérification a échoué. Réessayez dans un instant ou contactez l'administrateur.",
  SERVER_ERROR: "Erreur serveur. Réessayez dans un instant.",
}

export default function VerifyInviteClient({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>(
    token ? { kind: "loading" } : { kind: "error", message: ERROR_MESSAGES.INVALID_TOKEN }
  )

  useEffect(() => {
    if (!token) return
    let cancelled = false

    fetch("/api/auth/verify-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok || !data?.success) {
          setStatus({
            kind: "error",
            message:
              data?.message ||
              ERROR_MESSAGES[data?.error] ||
              ERROR_MESSAGES.SERVER_ERROR,
          })
          return
        }
        setStatus({
          kind: "success",
          email: data.email ?? null,
          mailFailed: Boolean(data.mailFailed),
          alreadyVerified: Boolean(data.alreadyVerified),
          message: data.message ?? null,
        })
      })
      .catch(() => {
        if (cancelled) return
        setStatus({ kind: "error", message: ERROR_MESSAGES.SERVER_ERROR })
      })

    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#edf1f2] px-6">
      <div className="mb-8">
        <Image src="/logo.png" alt="ID Bassin Congo" width={220} height={70} priority />
      </div>

      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        {status.kind === "loading" && (
          <>
            <div className="w-14 h-14 border-4 border-[#2ac1a3] border-t-transparent rounded-full animate-spin mx-auto mb-5" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Vérification en cours...
            </h1>
            <p className="text-gray-500 text-sm">
              Nous validons votre lien d&apos;invitation, merci de patienter.
            </p>
          </>
        )}

        {status.kind === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#e8faf6] flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-9 h-9 text-[#2ac1a3]" strokeWidth={2.25} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              E-mail vérifié
            </h1>
            {status.message ? (
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                {status.message}
                {!status.alreadyVerified && !status.mailFailed && status.email
                  ? " Vous pouvez maintenant vous connecter."
                  : ""}
              </p>
            ) : status.alreadyVerified ? (
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Votre compte est déjà activé. Vous pouvez vous connecter avec les identifiants reçus précédemment.
              </p>
            ) : status.mailFailed ? (
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Votre compte est activé, mais l&apos;envoi du mot de passe par e-mail a échoué.
                Contactez l&apos;administrateur pour récupérer vos identifiants.
              </p>
            ) : (
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Votre e-mail est vérifié. Vos identifiants de connexion{" "}
                {status.email ? (
                  <>
                    ont été envoyés à{" "}
                    <span className="font-semibold text-gray-900">{status.email}</span>.
                  </>
                ) : (
                  "ont été envoyés par e-mail."
                )}{" "}
                Vous pouvez maintenant vous connecter.
              </p>
            )}
            <Link
              href="/login"
              className="inline-block w-full bg-[#2ac1a3] hover:bg-[#24a88e] text-white py-3.5 rounded-lg font-semibold tracking-wider text-sm transition"
            >
              ALLER À LA CONNEXION
            </Link>
          </>
        )}

        {status.kind === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-[#FDECEC] flex items-center justify-center mx-auto mb-5">
              <AlertCircle className="w-9 h-9 text-[#C2413A]" strokeWidth={2.25} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Vérification impossible
            </h1>
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{status.message}</p>
            <Link
              href="/login"
              className="inline-block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3.5 rounded-lg font-semibold tracking-wider text-sm transition"
            >
              RETOUR À LA CONNEXION
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
