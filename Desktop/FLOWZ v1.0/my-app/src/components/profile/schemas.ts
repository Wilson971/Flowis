import { z } from 'zod';

export const profileGeneralSchema = z.object({
    first_name: z.string().min(1, 'Le prénom est requis').max(50, 'Max 50 caractères'),
    last_name: z.string().min(1, 'Le nom est requis').max(50, 'Max 50 caractères'),
    username: z
        .string()
        .min(3, 'Min 3 caractères')
        .max(30, 'Max 30 caractères')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Uniquement lettres, chiffres, - et _')
        .optional()
        .or(z.literal('')),
    country: z.string().min(2, 'Code pays requis').max(5, 'Code pays invalide').optional().or(z.literal('')),
    timezone: z.string().optional(),
    language: z.enum(['fr', 'en', 'es', 'de']).optional(),
    phone: z.string().max(20, 'Max 20 caractères').optional().nullable(),
    job_title: z.string().max(100, 'Max 100 caractères').optional().nullable(),
    company: z.string().max(100, 'Max 100 caractères').optional().nullable(),
    bio: z.string().max(500, 'Max 500 caractères').optional().nullable(),
});

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
        newPassword: z
            .string()
            .min(8, 'Minimum 8 caractères')
            .regex(/[A-Z]/, 'Au moins une majuscule')
            .regex(/[a-z]/, 'Au moins une minuscule')
            .regex(/[0-9]/, 'Au moins un chiffre'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: 'Les mots de passe ne correspondent pas',
        path: ['confirmPassword'],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: 'Le nouveau mot de passe doit être différent de l\'actuel',
        path: ['newPassword'],
    });

export type ProfileGeneralFormData = z.infer<typeof profileGeneralSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
