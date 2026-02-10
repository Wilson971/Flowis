/**
 * View Presets for Product Image Generation
 *
 * Presets d'angles de vue pour la generation d'images produit.
 * Note: Les icones sont gerees dans SettingsModal avec VIEW_PRESET_ICONS.
 */

import type { ViewPreset, ViewAngle } from '../types/studio';

export const VIEW_PRESETS: ViewPreset[] = [
  {
    id: 'single',
    name: 'Packshot Simple',
    description: 'Vue principale face',
    icon: 'image',
    angles: ['front'],
    imagesCount: 1,
  },
  {
    id: 'multi-3',
    name: 'Multi-angles (3)',
    description: 'Face + 3/4 + Profil',
    icon: 'rotate-cw',
    angles: ['front', 'three_quarter_right', 'side_right'],
    imagesCount: 3,
  },
  {
    id: 'multi-4',
    name: 'Multi-angles (4)',
    description: 'Face + 3/4 + Profil + Dos',
    icon: 'rotate-cw',
    angles: ['front', 'three_quarter_right', 'side_right', 'back'],
    imagesCount: 4,
  },
  {
    id: 'details',
    name: 'D\u00e9tails',
    description: 'Zoom texture et coutures',
    icon: 'search',
    angles: ['detail_texture', 'detail_stitching'],
    imagesCount: 2,
  },
  {
    id: '360',
    name: 'Rotation 360\u00b0',
    description: 'S\u00e9rie coh\u00e9rente 8 vues',
    icon: 'focus',
    angles: [
      'front',
      'three_quarter_right',
      'side_right',
      'back',
      'side_left',
      'three_quarter_left',
      'top',
      'detail_texture',
    ],
    imagesCount: 8,
  },
  {
    id: 'lifestyle',
    name: 'Mise en situation',
    description: 'Produit en contexte',
    icon: 'home',
    angles: ['in_context'],
    imagesCount: 1,
  },
];

/**
 * Recuperer un preset par son ID
 */
export const getViewPresetById = (id: string): ViewPreset | undefined => {
  return VIEW_PRESETS.find(preset => preset.id === id);
};

/**
 * Angles disponibles avec leurs labels
 */
export const VIEW_ANGLE_LABELS: Record<ViewAngle, string> = {
  front: 'Face',
  three_quarter_left: '3/4 Gauche',
  three_quarter_right: '3/4 Droit',
  side_left: 'Profil Gauche',
  side_right: 'Profil Droit',
  back: 'Dos',
  top: 'Vue dessus',
  detail_texture: 'D\u00e9tail texture',
  detail_stitching: 'D\u00e9tail coutures',
  in_context: 'En situation',
};
