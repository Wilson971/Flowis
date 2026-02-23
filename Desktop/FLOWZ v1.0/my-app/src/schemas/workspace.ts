/**
 * Zod validation schemas for workspace settings
 */

import { z } from 'zod'

export const workspaceGeneralSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  currency: z.string().min(2).max(5),
  default_language: z.enum(['fr', 'en', 'es', 'de']),
  timezone: z.string().min(1, 'Veuillez sélectionner un fuseau horaire'),
})

export type WorkspaceGeneralFormValues = z.infer<typeof workspaceGeneralSchema>

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .email('Veuillez entrer une adresse email valide'),
  role: z.enum(['admin', 'editor', 'viewer'], {
    required_error: 'Veuillez sélectionner un rôle',
  }),
})

export type InviteMemberFormValues = z.infer<typeof inviteMemberSchema>
