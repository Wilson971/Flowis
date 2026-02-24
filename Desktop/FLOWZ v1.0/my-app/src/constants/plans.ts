/**
 * Plan definitions for workspace billing display (MVP - no Stripe)
 */

import type { PlanDefinition } from '@/types/workspace'

export const PLAN_DEFINITIONS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0€',
    description: 'Pour démarrer et explorer FLOWZ',
    limits: {
      max_products: 50,
      max_articles: 20,
      max_stores: 2,
      max_ai_credits: 100,
    },
    features: [
      'Jusqu\'à 50 produits',
      'Jusqu\'à 20 articles',
      '2 boutiques connectées',
      '100 crédits AI / mois',
      'Photo Studio (basique)',
      'SEO Analysis',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '29€/mois',
    description: 'Pour les e-commerçants ambitieux',
    limits: {
      max_products: 500,
      max_articles: 100,
      max_stores: 5,
      max_ai_credits: 1000,
    },
    features: [
      'Jusqu\'à 500 produits',
      'Jusqu\'à 100 articles',
      '5 boutiques connectées',
      '1 000 crédits AI / mois',
      'Photo Studio (avancé)',
      'SEO Analysis + SERP',
      'Batch processing',
      'Support prioritaire',
    ],
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Sur devis',
    description: 'Pour les grandes équipes et volumes',
    limits: {
      max_products: 10000,
      max_articles: 1000,
      max_stores: 20,
      max_ai_credits: 10000,
    },
    features: [
      'Produits illimités',
      'Articles illimités',
      '20 boutiques connectées',
      '10 000 crédits AI / mois',
      'Photo Studio (illimité)',
      'API dédiée',
      'SSO / SAML',
      'Account manager',
      'SLA garanti',
    ],
  },
]

export const CURRENCIES = [
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'USD', label: '$ Dollar (USD)' },
  { value: 'GBP', label: '£ Livre (GBP)' },
  { value: 'CHF', label: 'CHF Franc suisse (CHF)' },
  { value: 'CAD', label: '$ Dollar canadien (CAD)' },
] as const

export const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
] as const

export const TIMEZONES = [
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Europe/London', label: 'Londres (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET/CEST)' },
  { value: 'Europe/Zurich', label: 'Zurich (CET/CEST)' },
  { value: 'America/New_York', label: 'New York (EST/EDT)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST/PDT)' },
  { value: 'America/Toronto', label: 'Toronto (EST/EDT)' },
  { value: 'America/Montreal', label: 'Montréal (EST/EDT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
] as const

export const WORKSPACE_ROLE_LABELS: Record<string, { label: string; description: string }> = {
  owner: { label: 'Propriétaire', description: 'Contrôle total du workspace' },
  admin: { label: 'Administrateur', description: 'Gestion des membres et paramètres' },
  editor: { label: 'Éditeur', description: 'Création et édition de contenu' },
  viewer: { label: 'Lecteur', description: 'Consultation uniquement' },
}
