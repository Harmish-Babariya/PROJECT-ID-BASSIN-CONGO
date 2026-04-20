import { NextResponse } from "next/server"

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED:
    "Vous devez être connecté pour effectuer cette action. Connectez-vous puis réessayez.",
  FORBIDDEN: "Accès refusé : cette action est réservée aux administrateurs.",
  CANNOT_DELETE_SELF: "Vous ne pouvez pas supprimer votre propre compte.",
  CANNOT_DEACTIVATE_SELF: "Vous ne pouvez pas désactiver votre propre compte.",

  INVALID_BODY: "Le corps de la requête est invalide. Envoyez un JSON valide.",
  INVALID_EMAIL:
    "Adresse e-mail invalide. Vérifiez le format (ex. nom@domaine.com).",
  NAME_REQUIRED: "Le nom complet est requis.",
  COUNTRY_REQUIRED: "Un pays doit être sélectionné pour un rôle Point focal.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 8 caractères.",

  USER_EXISTS: "Un utilisateur avec cet e-mail existe déjà.",
  NOT_FOUND: "Ressource introuvable.",
  NOT_PENDING: "Cette action n'est possible que pour une invitation en attente.",

  INVALID_TOKEN:
    "Ce lien de vérification est invalide. Demandez à un administrateur de vous renvoyer une invitation.",
  TOKEN_EXPIRED:
    "Ce lien de vérification a expiré. Demandez à un administrateur de vous renvoyer une invitation.",
  VERIFY_FAILED:
    "La vérification a échoué. Réessayez dans un instant ou contactez l'administrateur.",

  CREATE_FAILED: "Impossible de créer le compte. Réessayez dans un instant.",
  PROFILE_INSERT_FAILED: "Impossible d'enregistrer le profil utilisateur.",
  UPDATE_FAILED: "La mise à jour a échoué. Réessayez.",
  DELETE_FAILED: "La suppression a échoué. Réessayez.",
  INVITE_FAILED: "L'envoi de l'invitation a échoué. Réessayez.",
  MAIL_NOT_CONFIGURED:
    "Le service d'e-mail n'est pas configuré. Contactez l'administrateur technique.",
  MAIL_SEND_FAILED:
    "L'envoi de l'e-mail a échoué. Vérifiez la configuration Mailjet et réessayez.",

  MISSING_FIELDS: "Tous les champs sont requis.",
  WRONG_CURRENT_PASSWORD: "Mot de passe actuel incorrect.",
  EMAIL_PASSWORD_REQUIRED: "E-mail et mot de passe sont requis.",
  INVALID_CREDENTIALS:
    "Identifiants incorrects. Vérifiez votre e-mail et votre mot de passe.",
  USER_INACTIVE:
    "Votre compte a été désactivé. Contactez un administrateur.",

  SERVER_ERROR: "Erreur serveur. Veuillez réessayer dans un instant.",
}

export function apiError(
  code: keyof typeof ERROR_MESSAGES | string,
  status: number,
  extra?: { detail?: string; message?: string }
) {
  const message =
    extra?.message || ERROR_MESSAGES[code] || ERROR_MESSAGES.SERVER_ERROR
  return NextResponse.json(
    {
      error: code,
      message,
      ...(extra?.detail ? { detail: extra.detail } : {}),
    },
    { status }
  )
}
