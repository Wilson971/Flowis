/**
 * Niche-Based Scene Presets Library
 *
 * 40+ specialized scene presets organized by e-commerce niche.
 * Each preset includes matching criteria for the Smart Scene Engine.
 */

import type {
  ProductCategory,
  ProductMaterial,
  ProductStyle,
  SceneMood,
  Seasonality,
} from './productTaxonomy';

// ══════════════════════════════════════════════════════════════════════════════
// SCENE PRESET TYPE DEFINITION
// ══════════════════════════════════════════════════════════════════════════════

export type ScenePreset = {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Short description for UI */
  description: string;

  /** Full AI prompt modifier for image generation */
  promptModifier: string;

  /** Thumbnail URL for preview */
  thumbnail: string;

  /** Primary categories this scene works best with */
  targetCategories: ProductCategory[];

  /** Compatible product styles */
  targetStyles: ProductStyle[];

  /** Compatible materials */
  targetMaterials: ProductMaterial[];

  /** Scene mood/atmosphere */
  mood: SceneMood;

  /** Seasonal relevance */
  seasonality: Seasonality;

  /** Scene category for filtering */
  sceneCategory: 'studio' | 'lifestyle' | 'nature' | 'urban' | 'luxury' | 'creative' | 'seasonal';

  /** Keywords for search */
  keywords: string[];

  /** Is this a premium/pro scene? */
  isPremium?: boolean;
};

// ══════════════════════════════════════════════════════════════════════════════
// STUDIO SCENES - Professional e-commerce backgrounds
// ══════════════════════════════════════════════════════════════════════════════

const STUDIO_SCENES: ScenePreset[] = [
  {
    id: 'studio-pure-white',
    name: 'Studio Blanc Pur',
    description: 'Fond blanc professionnel, standard e-commerce',
    promptModifier: 'on a seamless pure white infinity background (#FFFFFF), professional studio lighting with soft diffusion, subtle shadow beneath the product for depth, commercial e-commerce photography style, 4K quality, product centered with balanced margins',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    targetCategories: ['fashion_clothing', 'fashion_shoes', 'electronics_tech', 'home_decor', 'beauty_skincare', 'jewelry', 'watches'],
    targetStyles: ['minimalist', 'modern', 'classic'],
    targetMaterials: ['fabric', 'leather', 'metal', 'plastic', 'glass', 'ceramic'],
    mood: 'professional',
    seasonality: 'all',
    sceneCategory: 'studio',
    keywords: ['blanc', 'white', 'professionnel', 'e-commerce', 'amazon', 'marketplace'],
  },
  {
    id: 'studio-soft-grey',
    name: 'Studio Gris Doux',
    description: 'Fond gris d\u00e9grad\u00e9, \u00e9clairage studio premium',
    promptModifier: 'on a smooth gradient background transitioning from light grey (#F5F5F5) to white, professional studio lighting from top-left at 45 degrees, soft graduated shadow beneath product, polished studio floor reflection at 15% opacity, premium commercial photography',
    thumbnail: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=400&h=400&fit=crop',
    targetCategories: ['electronics_tech', 'watches', 'electronics_audio', 'automotive', 'home_furniture'],
    targetStyles: ['minimalist', 'modern', 'tech'],
    targetMaterials: ['metal', 'plastic', 'glass', 'rubber'],
    mood: 'professional',
    seasonality: 'all',
    sceneCategory: 'studio',
    keywords: ['gris', 'grey', 'studio', 'tech', 'premium'],
  },
  {
    id: 'studio-black-dramatic',
    name: 'Noir Dramatique',
    description: 'Fond noir avec \u00e9clairage dramatique',
    promptModifier: 'on a deep black textured surface (#0A0A0A), dramatic rim lighting from behind highlighting product edges, subtle spotlight from above, luxury product photography with high contrast, cinematic commercial style',
    thumbnail: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&h=400&fit=crop',
    targetCategories: ['electronics_tech', 'watches', 'jewelry', 'electronics_audio', 'electronics_gaming', 'automotive'],
    targetStyles: ['luxury', 'modern', 'tech', 'industrial'],
    targetMaterials: ['metal', 'glass', 'plastic', 'leather'],
    mood: 'dramatic',
    seasonality: 'all',
    sceneCategory: 'studio',
    keywords: ['noir', 'black', 'dramatique', 'luxe', 'premium', 'dark mode'],
  },
  {
    id: 'studio-cream-warm',
    name: 'Cr\u00e8me Chaleureux',
    description: 'Fond cr\u00e8me doux, ambiance chaleureuse',
    promptModifier: 'on a warm cream-colored backdrop (#FAF5EF), soft warm lighting simulating golden hour, gentle shadows, cozy and inviting atmosphere, lifestyle product photography with warmth',
    thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
    targetCategories: ['beauty_skincare', 'home_decor', 'fashion_accessories', 'food_gourmet', 'art_crafts'],
    targetStyles: ['classic', 'vintage', 'organic', 'rustic'],
    targetMaterials: ['ceramic', 'organic', 'fabric', 'wood', 'paper'],
    mood: 'cozy',
    seasonality: 'all',
    sceneCategory: 'studio',
    keywords: ['cr\u00e8me', 'cream', 'chaleureux', 'warm', 'doux'],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// LUXURY SCENES - Premium brand positioning
// ══════════════════════════════════════════════════════════════════════════════

const LUXURY_SCENES: ScenePreset[] = [
  {
    id: 'luxury-black-velvet',
    name: 'Velours Noir',
    description: 'Velours noir luxueux, bijouterie classique',
    promptModifier: 'elegantly placed on deep black velvet fabric with subtle texture visible, dramatic side lighting from the left highlighting metallic reflections and gemstone facets, luxury jewelry photography with shallow depth of field, rich dark ambiance',
    thumbnail: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
    targetCategories: ['jewelry', 'watches', 'fashion_accessories', 'beauty_fragrance'],
    targetStyles: ['luxury', 'classic', 'vintage'],
    targetMaterials: ['metal', 'glass', 'stone', 'leather'],
    mood: 'luxury',
    seasonality: 'all',
    sceneCategory: 'luxury',
    keywords: ['velours', 'velvet', 'bijoux', 'jewelry', 'luxe', 'premium'],
  },
  {
    id: 'luxury-white-marble',
    name: 'Marbre Carrara',
    description: 'Marbre blanc italien, \u00e9l\u00e9gance intemporelle',
    promptModifier: 'on pristine white Carrara marble surface with subtle natural grey veining, soft diffused natural light from a window, elegant minimalist composition, high-end luxury brand aesthetic, polished marble reflection',
    thumbnail: 'https://images.unsplash.com/photo-1544457070-4cd773b4d71e?w=400&h=400&fit=crop',
    targetCategories: ['jewelry', 'watches', 'beauty_skincare', 'beauty_fragrance', 'home_decor'],
    targetStyles: ['luxury', 'minimalist', 'classic'],
    targetMaterials: ['metal', 'glass', 'ceramic', 'stone'],
    mood: 'luxury',
    seasonality: 'all',
    sceneCategory: 'luxury',
    keywords: ['marbre', 'marble', 'carrara', 'luxe', '\u00e9l\u00e9gant', 'premium'],
  },
  {
    id: 'luxury-gold-accent',
    name: 'Or & Marbre',
    description: 'Marbre blanc avec touches dor\u00e9es',
    promptModifier: 'on white marble surface with elegant gold leaf accents and golden decorative elements nearby, warm luxurious lighting, premium brand positioning, refined and sophisticated atmosphere, high-end catalog style',
    thumbnail: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=400&fit=crop',
    targetCategories: ['jewelry', 'watches', 'beauty_fragrance', 'beauty_makeup', 'home_decor'],
    targetStyles: ['luxury', 'classic'],
    targetMaterials: ['metal', 'glass', 'ceramic'],
    mood: 'luxury',
    seasonality: 'all',
    sceneCategory: 'luxury',
    keywords: ['or', 'gold', 'marbre', 'marble', 'luxe', 'premium', 'dor\u00e9'],
    isPremium: true,
  },
  {
    id: 'luxury-silk-blush',
    name: 'Soie Blush',
    description: 'Soie rose poudr\u00e9, f\u00e9minit\u00e9 luxueuse',
    promptModifier: 'resting on flowing blush pink silk fabric (#F8E1E4) with elegant draping and soft folds, delicate feminine lighting, romantic luxury atmosphere, high-end beauty brand aesthetic, soft shadows in silk creases',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    targetCategories: ['jewelry', 'beauty_makeup', 'beauty_fragrance', 'fashion_accessories'],
    targetStyles: ['luxury', 'classic', 'bohemian'],
    targetMaterials: ['metal', 'glass', 'fabric'],
    mood: 'luxury',
    seasonality: 'all',
    sceneCategory: 'luxury',
    keywords: ['soie', 'silk', 'rose', 'pink', 'blush', 'f\u00e9minin', 'romantic'],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// FASHION SCENES - Apparel & accessories
// ══════════════════════════════════════════════════════════════════════════════

const FASHION_SCENES: ScenePreset[] = [
  {
    id: 'fashion-runway-white',
    name: 'Runway Blanc',
    description: 'Podium de d\u00e9fil\u00e9, style haute couture',
    promptModifier: 'displayed on a pristine white fashion runway floor, professional fashion photography lighting with dramatic shadows, clean minimalist backdrop, high-end boutique aesthetic, editorial fashion style',
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    targetCategories: ['fashion_clothing', 'fashion_shoes', 'fashion_bags'],
    targetStyles: ['minimalist', 'modern', 'luxury'],
    targetMaterials: ['fabric', 'leather', 'mixed'],
    mood: 'professional',
    seasonality: 'all',
    sceneCategory: 'studio',
    keywords: ['runway', 'd\u00e9fil\u00e9', 'fashion', 'mode', 'haute couture'],
  },
  {
    id: 'fashion-urban-concrete',
    name: 'Urban Concrete',
    description: 'B\u00e9ton urbain, street style',
    promptModifier: 'on raw concrete urban surface with interesting texture, soft natural city light, blurred graffiti wall or industrial backdrop, street fashion photography style, edgy urban aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=400&h=400&fit=crop',
    targetCategories: ['fashion_clothing', 'fashion_shoes', 'fashion_accessories', 'fashion_bags'],
    targetStyles: ['modern', 'industrial', 'sporty'],
    targetMaterials: ['fabric', 'leather', 'rubber', 'mixed'],
    mood: 'lifestyle',
    seasonality: 'all',
    sceneCategory: 'urban',
    keywords: ['urbain', 'urban', 'b\u00e9ton', 'concrete', 'street', 'ville'],
  },
  {
    id: 'fashion-boutique-wood',
    name: 'Boutique Bois',
    description: '\u00c9tag\u00e8re boutique en bois clair',
    promptModifier: 'displayed on a light oak wood shelf in an elegant boutique setting, soft warm lighting, blurred luxury store interior in background, retail display aesthetic, inviting shopping atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
    targetCategories: ['fashion_accessories', 'fashion_bags', 'jewelry', 'beauty_fragrance'],
    targetStyles: ['classic', 'modern', 'minimalist'],
    targetMaterials: ['leather', 'fabric', 'metal'],
    mood: 'lifestyle',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['boutique', 'shop', 'bois', 'wood', '\u00e9tag\u00e8re', 'retail'],
  },
  {
    id: 'fashion-flat-lay',
    name: 'Flat Lay Mode',
    description: 'Vue du dessus, style magazine',
    promptModifier: 'photographed from directly above in a stylish flat lay composition, on a clean white or light grey surface, surrounded by complementary fashion accessories, editorial magazine style, organized and aesthetic arrangement',
    thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=400&fit=crop',
    targetCategories: ['fashion_clothing', 'fashion_accessories', 'beauty_makeup', 'jewelry'],
    targetStyles: ['modern', 'minimalist', 'playful'],
    targetMaterials: ['fabric', 'leather', 'metal', 'plastic'],
    mood: 'artistic',
    seasonality: 'all',
    sceneCategory: 'creative',
    keywords: ['flat lay', 'vue dessus', 'magazine', 'editorial', 'style'],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// BEAUTY SCENES - Skincare, makeup, fragrance
// ══════════════════════════════════════════════════════════════════════════════

const BEAUTY_SCENES: ScenePreset[] = [
  {
    id: 'beauty-spa-zen',
    name: 'Spa Zen',
    description: 'Ambiance spa relaxante avec pierres',
    promptModifier: 'on smooth spa stones with delicate water droplets, bamboo elements and soft green leaves in background, zen garden aesthetic, diffused natural morning light, wellness and relaxation brand atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=400&fit=crop',
    targetCategories: ['beauty_skincare', 'beauty_haircare', 'health_wellness'],
    targetStyles: ['minimalist', 'organic', 'modern'],
    targetMaterials: ['glass', 'ceramic', 'plastic', 'organic'],
    mood: 'natural',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['spa', 'zen', 'relaxation', 'wellness', 'bien-\u00eatre', 'stones'],
  },
  {
    id: 'beauty-botanical-fresh',
    name: 'Botanical Fresh',
    description: 'Plantes fra\u00eeches, ingr\u00e9dients naturels',
    promptModifier: 'surrounded by fresh green botanical leaves and natural plant ingredients, natural light wood or stone surface, greenhouse morning light filtering through, organic skincare brand aesthetic, fresh and clean atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
    targetCategories: ['beauty_skincare', 'beauty_haircare', 'health_wellness'],
    targetStyles: ['organic', 'modern', 'minimalist'],
    targetMaterials: ['glass', 'ceramic', 'organic', 'paper'],
    mood: 'natural',
    seasonality: 'spring',
    sceneCategory: 'nature',
    keywords: ['botanical', 'plantes', 'plants', 'naturel', 'organic', 'green'],
  },
  {
    id: 'beauty-pink-glam',
    name: 'Pink Glam',
    description: 'Rose glamour, esth\u00e9tique makeup',
    promptModifier: 'on a shimmering pink holographic or iridescent surface, soft pink and purple lighting with sparkle effects, glamorous makeup brand aesthetic, Instagram-ready beauty photography, trendy and youthful vibe',
    thumbnail: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
    targetCategories: ['beauty_makeup', 'beauty_fragrance', 'fashion_accessories'],
    targetStyles: ['playful', 'modern', 'luxury'],
    targetMaterials: ['plastic', 'metal', 'glass'],
    mood: 'playful',
    seasonality: 'all',
    sceneCategory: 'creative',
    keywords: ['pink', 'rose', 'glam', 'glamour', 'makeup', 'sparkle'],
  },
  {
    id: 'beauty-bathroom-marble',
    name: 'Salle de Bain Luxe',
    description: 'Comptoir marbre, ambiance bathroom',
    promptModifier: 'on a marble bathroom countertop, soft natural light from a window, blurred elegant bathroom interior in background, premium skincare routine setting, clean and sophisticated atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop',
    targetCategories: ['beauty_skincare', 'beauty_haircare', 'beauty_fragrance'],
    targetStyles: ['luxury', 'minimalist', 'modern'],
    targetMaterials: ['glass', 'ceramic', 'plastic'],
    mood: 'lifestyle',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['bathroom', 'salle de bain', 'marbre', 'marble', 'routine', 'skincare'],
  },
  {
    id: 'beauty-water-splash',
    name: 'Water Fresh',
    description: "\u00c9claboussures d'eau, fra\u00eecheur pure",
    promptModifier: 'with dynamic water splash and droplets around the product, bright clean lighting, pure freshness aesthetic, hydration and cleansing brand imagery, crisp and refreshing atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1525904097878-94fb15835963?w=400&h=400&fit=crop',
    targetCategories: ['beauty_skincare', 'beauty_haircare', 'health_wellness'],
    targetStyles: ['modern', 'minimalist'],
    targetMaterials: ['glass', 'plastic'],
    mood: 'artistic',
    seasonality: 'summer',
    sceneCategory: 'creative',
    keywords: ['water', 'eau', 'splash', 'fresh', 'fra\u00eecheur', 'hydration'],
    isPremium: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// TECH SCENES - Electronics & gadgets
// ══════════════════════════════════════════════════════════════════════════════

const TECH_SCENES: ScenePreset[] = [
  {
    id: 'tech-dark-gradient',
    name: 'Tech Dark',
    description: 'Gradient sombre, style Apple',
    promptModifier: 'on a sleek dark gradient surface transitioning from charcoal to black, subtle blue LED accent lighting reflecting on the product, futuristic tech product photography, Apple-style minimalist presentation, premium technology aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=400&h=400&fit=crop',
    targetCategories: ['electronics_tech', 'electronics_audio', 'electronics_gaming', 'watches'],
    targetStyles: ['minimalist', 'modern', 'tech'],
    targetMaterials: ['metal', 'glass', 'plastic'],
    mood: 'professional',
    seasonality: 'all',
    sceneCategory: 'studio',
    keywords: ['tech', 'dark', 'gradient', 'apple', 'premium', 'futuristic'],
  },
  {
    id: 'tech-workspace-modern',
    name: 'Workspace Moderne',
    description: 'Bureau moderne, productivit\u00e9',
    promptModifier: 'on a clean modern desk with minimal accessories, soft natural window light, blurred home office or workspace background, productivity lifestyle photography, professional work-from-home aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=400&h=400&fit=crop',
    targetCategories: ['electronics_tech', 'electronics_audio', 'office_supplies'],
    targetStyles: ['minimalist', 'modern'],
    targetMaterials: ['metal', 'plastic', 'glass'],
    mood: 'lifestyle',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['workspace', 'bureau', 'desk', 'office', 'productivit\u00e9', 'work'],
  },
  {
    id: 'tech-neon-cyber',
    name: 'Neon Cyber',
    description: 'N\u00e9on cyberpunk, gaming aesthetic',
    promptModifier: 'in a cyberpunk environment with vibrant neon pink and blue lights, dark futuristic setting with geometric shapes, gaming setup aesthetic, RGB lighting ambiance, sci-fi atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=400&fit=crop',
    targetCategories: ['electronics_gaming', 'electronics_audio', 'electronics_tech'],
    targetStyles: ['modern', 'tech', 'playful'],
    targetMaterials: ['plastic', 'metal', 'rubber'],
    mood: 'artistic',
    seasonality: 'all',
    sceneCategory: 'creative',
    keywords: ['neon', 'cyber', 'cyberpunk', 'gaming', 'RGB', 'futuristic'],
  },
  {
    id: 'tech-floating-minimal',
    name: 'Tech Floating',
    description: 'Produit flottant, effet l\u00e9vitation',
    promptModifier: 'appearing to float in mid-air against a clean gradient background, dramatic lighting from multiple angles creating interesting shadows, levitation effect, premium tech product reveal style, cinematic presentation',
    thumbnail: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=400&h=400&fit=crop',
    targetCategories: ['electronics_tech', 'electronics_audio', 'watches'],
    targetStyles: ['modern', 'tech', 'minimalist'],
    targetMaterials: ['metal', 'glass', 'plastic'],
    mood: 'dramatic',
    seasonality: 'all',
    sceneCategory: 'creative',
    keywords: ['floating', 'flottant', 'l\u00e9vitation', 'hover', 'premium', 'reveal'],
    isPremium: true,
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// HOME & LIFESTYLE SCENES - Interior & living
// ══════════════════════════════════════════════════════════════════════════════

const HOME_SCENES: ScenePreset[] = [
  {
    id: 'home-scandi-minimal',
    name: 'Scandinave',
    description: 'Bois clair, minimalisme nordique',
    promptModifier: 'on a light birch or oak wood surface, white walls in background, soft natural daylight from a large window, Scandinavian interior design aesthetic, hygge cozy atmosphere, clean and airy feel',
    thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop',
    targetCategories: ['home_decor', 'home_kitchen', 'home_lighting', 'home_furniture'],
    targetStyles: ['minimalist', 'modern', 'organic'],
    targetMaterials: ['wood', 'ceramic', 'glass', 'fabric'],
    mood: 'cozy',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['scandinave', 'scandinavian', 'nordic', 'hygge', 'bois', 'wood', 'minimal'],
  },
  {
    id: 'home-rustic-farmhouse',
    name: 'Farmhouse Rustique',
    description: 'Cuisine campagne, bois vieilli',
    promptModifier: 'on a rustic reclaimed wood surface with visible grain and character, warm farmhouse kitchen background with herbs and plants, golden hour lighting through a window, French countryside aesthetic, artisanal charm',
    thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
    targetCategories: ['home_kitchen', 'food_beverage', 'food_gourmet', 'home_decor'],
    targetStyles: ['rustic', 'vintage', 'organic'],
    targetMaterials: ['wood', 'ceramic', 'metal', 'organic'],
    mood: 'cozy',
    seasonality: 'autumn',
    sceneCategory: 'lifestyle',
    keywords: ['farmhouse', 'ferme', 'rustique', 'campagne', 'countryside', 'artisan'],
  },
  {
    id: 'home-modern-living',
    name: 'Living Moderne',
    description: 'Salon contemporain, style magazine',
    promptModifier: 'in a modern minimalist living room setting, neutral earth tones, designer furniture blurred in background, editorial interior photography style, sophisticated home decor magazine aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&h=400&fit=crop',
    targetCategories: ['home_decor', 'home_furniture', 'home_lighting'],
    targetStyles: ['modern', 'minimalist', 'luxury'],
    targetMaterials: ['fabric', 'wood', 'metal', 'glass'],
    mood: 'lifestyle',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['salon', 'living room', 'moderne', 'contemporary', 'interior', 'magazine'],
  },
  {
    id: 'home-cozy-blanket',
    name: 'Cozy Plaid',
    description: 'Plaid douillet, ambiance hygge',
    promptModifier: 'nestled in soft cozy knit blanket or throw in neutral cream tones, warm ambient lighting, comfortable homey atmosphere, hygge lifestyle aesthetic, inviting and warm feeling',
    thumbnail: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop',
    targetCategories: ['home_decor', 'fashion_accessories', 'beauty_skincare', 'food_beverage'],
    targetStyles: ['organic', 'classic', 'bohemian'],
    targetMaterials: ['fabric', 'ceramic', 'organic'],
    mood: 'cozy',
    seasonality: 'winter',
    sceneCategory: 'lifestyle',
    keywords: ['cozy', 'plaid', 'blanket', 'hygge', 'chaleureux', 'warm', 'comfort'],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// FOOD & BEVERAGE SCENES
// ══════════════════════════════════════════════════════════════════════════════

const FOOD_SCENES: ScenePreset[] = [
  {
    id: 'food-marble-flatlay',
    name: 'Food Flat Lay',
    description: 'Vue du dessus, style culinaire',
    promptModifier: 'on a grey marble surface photographed from directly above, styled with fresh ingredients and props scattered artfully around, soft diffused overhead light, professional food photography, editorial cooking magazine style',
    thumbnail: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop',
    targetCategories: ['food_beverage', 'food_gourmet', 'home_kitchen'],
    targetStyles: ['modern', 'minimalist', 'organic'],
    targetMaterials: ['organic', 'ceramic', 'glass', 'metal'],
    mood: 'professional',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['food', 'flat lay', 'cuisine', 'culinary', 'marble', 'ingredients'],
  },
  {
    id: 'food-rustic-table',
    name: 'Table Artisan',
    description: 'Table bois rustique, fait maison',
    promptModifier: 'on an aged wooden farm table with natural texture and patina, linen napkin beside, fresh herbs and flour dust scattered, warm afternoon light, artisan food brand aesthetic, homemade charm',
    thumbnail: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400&h=400&fit=crop',
    targetCategories: ['food_beverage', 'food_gourmet', 'home_kitchen'],
    targetStyles: ['rustic', 'vintage', 'organic'],
    targetMaterials: ['organic', 'ceramic', 'wood', 'glass'],
    mood: 'cozy',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['artisan', 'rustique', 'table', 'bois', 'homemade', 'fait maison'],
  },
  {
    id: 'food-dark-moody',
    name: 'Food Dark & Moody',
    description: 'Style sombre, photographie culinaire',
    promptModifier: 'on a dark slate or black stone surface, dramatic chiaroscuro lighting, rich deep shadows, gourmet food photography style, sophisticated and luxurious food presentation',
    thumbnail: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=400&fit=crop',
    targetCategories: ['food_gourmet', 'food_beverage', 'home_kitchen'],
    targetStyles: ['luxury', 'modern'],
    targetMaterials: ['organic', 'ceramic', 'glass', 'metal'],
    mood: 'dramatic',
    seasonality: 'all',
    sceneCategory: 'creative',
    keywords: ['dark', 'moody', 'sombre', 'gourmet', 'dramatic', 'food'],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// NATURE & OUTDOOR SCENES
// ══════════════════════════════════════════════════════════════════════════════

const NATURE_SCENES: ScenePreset[] = [
  {
    id: 'nature-forest-rock',
    name: 'Rocher For\u00eat',
    description: 'Pierre moussue, lumi\u00e8re foresti\u00e8re',
    promptModifier: 'placed on a smooth grey rock in a forest setting, dappled sunlight filtering through trees, moss and ferns in soft focus background, nature photography aesthetic, organic and earthy atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&h=400&fit=crop',
    targetCategories: ['outdoor_adventure', 'beauty_skincare', 'health_wellness', 'garden_plants'],
    targetStyles: ['organic', 'rustic', 'bohemian'],
    targetMaterials: ['organic', 'glass', 'fabric', 'leather'],
    mood: 'natural',
    seasonality: 'spring',
    sceneCategory: 'nature',
    keywords: ['for\u00eat', 'forest', 'nature', 'rocher', 'rock', 'organic', 'outdoor'],
  },
  {
    id: 'nature-beach-sand',
    name: 'Plage Sable Blanc',
    description: 'Sable fin, ambiance vacances',
    promptModifier: 'on white sandy beach surface with turquoise ocean waves blurred in background, bright summer sunlight with lens flare, vacation lifestyle brand aesthetic, fresh and inviting coastal vibe',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
    targetCategories: ['fashion_accessories', 'beauty_skincare', 'outdoor_adventure', 'fashion_bags'],
    targetStyles: ['modern', 'bohemian', 'playful'],
    targetMaterials: ['fabric', 'organic', 'plastic', 'rubber'],
    mood: 'lifestyle',
    seasonality: 'summer',
    sceneCategory: 'nature',
    keywords: ['plage', 'beach', 'sable', 'sand', '\u00e9t\u00e9', 'summer', 'vacances', 'ocean'],
  },
  {
    id: 'nature-mountain-adventure',
    name: 'Montagne Aventure',
    description: 'Rocher montagne, outdoor vibes',
    promptModifier: 'on a rugged rock surface with blurred mountain landscape and peaks in background, golden hour outdoor lighting, adventure brand aesthetic, exploration and outdoor lifestyle photography',
    thumbnail: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=400&fit=crop',
    targetCategories: ['outdoor_adventure', 'sports_fitness', 'fashion_bags', 'electronics_tech'],
    targetStyles: ['sporty', 'rustic', 'modern'],
    targetMaterials: ['fabric', 'metal', 'rubber', 'mixed'],
    mood: 'lifestyle',
    seasonality: 'all',
    sceneCategory: 'nature',
    keywords: ['montagne', 'mountain', 'aventure', 'adventure', 'outdoor', 'hiking', 'trekking'],
  },
  {
    id: 'nature-greenhouse',
    name: 'Serre Tropicale',
    description: 'Plantes luxuriantes, lumi\u00e8re serre',
    promptModifier: 'in a lush greenhouse surrounded by tropical green plants and hanging vines, dappled sunlight through glass ceiling, botanical garden aesthetic, fresh and vibrant plant lover atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop',
    targetCategories: ['garden_plants', 'home_decor', 'beauty_skincare'],
    targetStyles: ['organic', 'bohemian', 'modern'],
    targetMaterials: ['ceramic', 'organic', 'glass', 'wood'],
    mood: 'natural',
    seasonality: 'spring',
    sceneCategory: 'nature',
    keywords: ['serre', 'greenhouse', 'plantes', 'plants', 'tropical', 'botanical'],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// SPORTS & FITNESS SCENES
// ══════════════════════════════════════════════════════════════════════════════

const SPORTS_SCENES: ScenePreset[] = [
  {
    id: 'sports-gym-floor',
    name: 'Sol Gym',
    description: 'Salle de sport, \u00e9nergie fitness',
    promptModifier: 'on gym rubber floor with blurred fitness equipment and weights in background, dramatic side lighting, athletic brand photography style, high-energy fitness aesthetic, motivational atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop',
    targetCategories: ['sports_fitness', 'fashion_shoes', 'electronics_audio', 'health_wellness'],
    targetStyles: ['sporty', 'modern'],
    targetMaterials: ['fabric', 'rubber', 'plastic', 'mixed'],
    mood: 'lifestyle',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['gym', 'sport', 'fitness', 'musculation', 'workout', 'training'],
  },
  {
    id: 'sports-track-field',
    name: 'Piste Athl\u00e9tisme',
    description: 'Piste rouge, running vibes',
    promptModifier: 'on red athletic track surface with lane markings visible, stadium or outdoor field blurred in background, bright daylight, running and athletics brand aesthetic, dynamic sports photography',
    thumbnail: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=400&fit=crop',
    targetCategories: ['fashion_shoes', 'sports_fitness', 'electronics_audio'],
    targetStyles: ['sporty', 'modern'],
    targetMaterials: ['fabric', 'rubber', 'plastic'],
    mood: 'lifestyle',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['piste', 'track', 'running', 'course', 'athl\u00e9tisme', 'athletics'],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// KIDS & PETS SCENES
// ══════════════════════════════════════════════════════════════════════════════

const KIDS_PETS_SCENES: ScenePreset[] = [
  {
    id: 'kids-playful-pastel',
    name: 'Pastel Ludique',
    description: 'Couleurs pastel, ambiance enfantine',
    promptModifier: "on a soft pastel-colored surface (mint, pink, or yellow), playful and cheerful atmosphere, gentle diffused lighting, children's product photography style, fun and safe feeling",
    thumbnail: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400&h=400&fit=crop',
    targetCategories: ['kids_toys', 'kids_clothing'],
    targetStyles: ['playful', 'modern'],
    targetMaterials: ['plastic', 'fabric', 'rubber'],
    mood: 'playful',
    seasonality: 'all',
    sceneCategory: 'creative',
    keywords: ['enfants', 'kids', 'pastel', 'jouets', 'toys', 'ludique', 'playful'],
  },
  {
    id: 'kids-wooden-toys',
    name: 'Jouets Bois',
    description: 'Bois naturel, jouets \u00e9ducatifs',
    promptModifier: 'on natural light wood surface, soft neutral background, warm gentle lighting, Montessori-inspired aesthetic, educational toy photography, safe and natural feeling',
    thumbnail: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop',
    targetCategories: ['kids_toys', 'kids_clothing'],
    targetStyles: ['organic', 'minimalist', 'classic'],
    targetMaterials: ['wood', 'fabric', 'organic'],
    mood: 'cozy',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['bois', 'wood', 'jouets', 'toys', 'montessori', '\u00e9ducatif', 'natural'],
  },
  {
    id: 'pets-cozy-home',
    name: 'Pet Home',
    description: 'Ambiance maison pour animaux',
    promptModifier: 'on a soft fluffy rug or pet bed in a cozy living room setting, warm natural light, pet-friendly home aesthetic, lifestyle pet product photography, comfortable and inviting atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=400&h=400&fit=crop',
    targetCategories: ['pets'],
    targetStyles: ['modern', 'organic', 'classic'],
    targetMaterials: ['fabric', 'plastic', 'organic', 'rubber'],
    mood: 'cozy',
    seasonality: 'all',
    sceneCategory: 'lifestyle',
    keywords: ['animaux', 'pets', 'chien', 'dog', 'chat', 'cat', 'maison', 'home'],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// SEASONAL SCENES
// ══════════════════════════════════════════════════════════════════════════════

const SEASONAL_SCENES: ScenePreset[] = [
  {
    id: 'seasonal-christmas',
    name: 'No\u00ebl Festif',
    description: 'Ambiance No\u00ebl, d\u00e9cor f\u00eates',
    promptModifier: 'surrounded by Christmas decorations, pine branches, red berries and golden ornaments, warm twinkling lights bokeh in background, festive holiday atmosphere, gift-giving season aesthetic',
    thumbnail: 'https://images.unsplash.com/photo-1512389142860-9c449e58a814?w=400&h=400&fit=crop',
    targetCategories: ['home_decor', 'jewelry', 'fashion_accessories', 'food_gourmet', 'beauty_fragrance'],
    targetStyles: ['classic', 'luxury', 'playful'],
    targetMaterials: ['metal', 'glass', 'fabric', 'organic'],
    mood: 'cozy',
    seasonality: 'holiday',
    sceneCategory: 'seasonal',
    keywords: ['no\u00ebl', 'christmas', 'f\u00eates', 'holiday', 'cadeau', 'gift', 'festif'],
    isPremium: true,
  },
  {
    id: 'seasonal-spring-flowers',
    name: 'Printemps Floral',
    description: 'Fleurs fra\u00eeches, renaissance printani\u00e8re',
    promptModifier: 'surrounded by fresh spring flowers (tulips, daffodils, cherry blossoms), soft pastel colors, bright natural spring light, renewal and freshness aesthetic, blooming garden atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=400&fit=crop',
    targetCategories: ['beauty_fragrance', 'beauty_skincare', 'home_decor', 'fashion_accessories'],
    targetStyles: ['organic', 'bohemian', 'classic'],
    targetMaterials: ['glass', 'ceramic', 'organic', 'fabric'],
    mood: 'natural',
    seasonality: 'spring',
    sceneCategory: 'seasonal',
    keywords: ['printemps', 'spring', 'fleurs', 'flowers', 'floral', 'fresh', 'bloom'],
  },
  {
    id: 'seasonal-autumn-harvest',
    name: 'Automne R\u00e9colte',
    description: 'Feuilles dor\u00e9es, ambiance automnale',
    promptModifier: 'surrounded by autumn leaves in orange, red and gold colors, pumpkins and harvest elements, warm golden hour lighting, cozy fall aesthetic, seasonal harvest atmosphere',
    thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    targetCategories: ['home_decor', 'food_beverage', 'fashion_accessories', 'beauty_skincare'],
    targetStyles: ['rustic', 'organic', 'classic'],
    targetMaterials: ['wood', 'ceramic', 'organic', 'fabric'],
    mood: 'cozy',
    seasonality: 'autumn',
    sceneCategory: 'seasonal',
    keywords: ['automne', 'autumn', 'fall', 'feuilles', 'leaves', 'harvest', 'pumpkin'],
  },
];

// ══════════════════════════════════════════════════════════════════════════════
// COMBINED EXPORT - All presets in one array
// ══════════════════════════════════════════════════════════════════════════════

export const NICHE_SCENE_PRESETS: ScenePreset[] = [
  ...STUDIO_SCENES,
  ...LUXURY_SCENES,
  ...FASHION_SCENES,
  ...BEAUTY_SCENES,
  ...TECH_SCENES,
  ...HOME_SCENES,
  ...FOOD_SCENES,
  ...NATURE_SCENES,
  ...SPORTS_SCENES,
  ...KIDS_PETS_SCENES,
  ...SEASONAL_SCENES,
];

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Get all presets for a specific scene category
 */
export const getPresetsBySceneCategory = (category: ScenePreset['sceneCategory']): ScenePreset[] => {
  return NICHE_SCENE_PRESETS.filter(preset => preset.sceneCategory === category);
};

/**
 * Get all presets matching a specific mood
 */
export const getPresetsByMood = (mood: SceneMood): ScenePreset[] => {
  return NICHE_SCENE_PRESETS.filter(preset => preset.mood === mood);
};

/**
 * Get all presets for a specific product category
 */
export const getPresetsForCategory = (category: ProductCategory): ScenePreset[] => {
  return NICHE_SCENE_PRESETS.filter(preset =>
    preset.targetCategories.includes(category)
  );
};

/**
 * Get preset by ID
 */
export const getPresetById = (id: string): ScenePreset | undefined => {
  return NICHE_SCENE_PRESETS.find(preset => preset.id === id);
};

/**
 * Search presets by keyword
 */
export const searchPresets = (query: string): ScenePreset[] => {
  const lowerQuery = query.toLowerCase();
  return NICHE_SCENE_PRESETS.filter(preset =>
    preset.name.toLowerCase().includes(lowerQuery) ||
    preset.description.toLowerCase().includes(lowerQuery) ||
    preset.keywords.some(kw => kw.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Get scene category labels for UI
 */
export const SCENE_CATEGORY_LABELS: Record<ScenePreset['sceneCategory'], string> = {
  studio: 'Studio',
  lifestyle: 'Lifestyle',
  nature: 'Nature',
  urban: 'Urbain',
  luxury: 'Luxe',
  creative: 'Cr\u00e9atif',
  seasonal: 'Saisonnier',
};

/**
 * Get mood labels for UI
 */
export const MOOD_LABELS: Record<SceneMood, string> = {
  professional: 'Professionnel',
  lifestyle: 'Lifestyle',
  artistic: 'Artistique',
  natural: 'Naturel',
  luxury: 'Luxe',
  playful: 'Ludique',
  cozy: 'Chaleureux',
  dramatic: 'Dramatique',
};
