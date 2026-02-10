/**
 * Product Taxonomy for Smart Scene Recommendations
 *
 * This module defines the complete classification system for e-commerce products.
 * Used by the Smart Scene Engine to match products with optimal scene presets.
 */

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT CATEGORIES - 28 categories covering 95%+ of e-commerce niches
// ══════════════════════════════════════════════════════════════════════════════

export type ProductCategory =
  // Fashion & Apparel
  | 'fashion_clothing'
  | 'fashion_shoes'
  | 'fashion_accessories'
  | 'fashion_bags'
  // Beauty & Personal Care
  | 'beauty_skincare'
  | 'beauty_makeup'
  | 'beauty_haircare'
  | 'beauty_fragrance'
  // Luxury & Accessories
  | 'jewelry'
  | 'watches'
  // Electronics & Tech
  | 'electronics_tech'
  | 'electronics_audio'
  | 'electronics_gaming'
  // Home & Living
  | 'home_decor'
  | 'home_furniture'
  | 'home_kitchen'
  | 'home_lighting'
  // Food & Beverage
  | 'food_beverage'
  | 'food_gourmet'
  // Sports & Outdoor
  | 'sports_fitness'
  | 'outdoor_adventure'
  // Other Categories
  | 'kids_toys'
  | 'kids_clothing'
  | 'pets'
  | 'art_crafts'
  | 'automotive'
  | 'garden_plants'
  | 'office_supplies'
  | 'health_wellness';

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT MATERIALS - Visual material detection
// ══════════════════════════════════════════════════════════════════════════════

export type ProductMaterial =
  | 'fabric'      // Textiles, cotton, polyester, silk
  | 'leather'     // Real or faux leather
  | 'metal'       // Steel, aluminum, gold, silver
  | 'wood'        // Natural or processed wood
  | 'glass'       // Clear, frosted, colored glass
  | 'ceramic'     // Porcelain, pottery, stoneware
  | 'plastic'     // Various plastics, acrylic
  | 'stone'       // Marble, granite, natural stones
  | 'organic'     // Natural materials, plants, food
  | 'rubber'      // Rubber, silicone
  | 'paper'       // Cardboard, paper products
  | 'mixed';      // Multiple materials combined

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT STYLES - Design aesthetic classification
// ══════════════════════════════════════════════════════════════════════════════

export type ProductStyle =
  | 'minimalist'  // Clean, simple, uncluttered
  | 'luxury'      // High-end, premium, exclusive
  | 'vintage'     // Retro, antique, nostalgic
  | 'modern'      // Contemporary, current trends
  | 'rustic'      // Natural, handcrafted, artisanal
  | 'industrial'  // Raw, urban, mechanical
  | 'bohemian'    // Free-spirited, eclectic, artistic
  | 'classic'     // Timeless, traditional, elegant
  | 'playful'     // Fun, colorful, whimsical
  | 'sporty'      // Athletic, dynamic, energetic
  | 'tech'        // Futuristic, digital, innovative
  | 'organic';    // Natural, eco-friendly, sustainable

// ══════════════════════════════════════════════════════════════════════════════
// TARGET AUDIENCE - Brand positioning
// ══════════════════════════════════════════════════════════════════════════════

export type TargetAudience =
  | 'premium'       // Luxury, high-income consumers
  | 'mass_market'   // General consumers, affordable
  | 'eco_conscious' // Sustainability-focused buyers
  | 'tech_savvy'    // Early adopters, tech enthusiasts
  | 'family'        // Parents, household buyers
  | 'young_adult'   // Gen Z, millennials
  | 'professional'  // Business, corporate buyers
  | 'creative'      // Artists, designers, makers
  | 'fitness'       // Health and fitness enthusiasts
  | 'senior';       // Older demographic, accessibility focus

// ══════════════════════════════════════════════════════════════════════════════
// SCENE MOOD - Emotional tone of photography
// ══════════════════════════════════════════════════════════════════════════════

export type SceneMood =
  | 'professional'  // Clean, commercial, catalog-ready
  | 'lifestyle'     // In-context, relatable, aspirational
  | 'artistic'      // Creative, editorial, unique
  | 'natural'       // Organic, eco-friendly, earthy
  | 'luxury'        // Premium, exclusive, high-end
  | 'playful'       // Fun, energetic, youthful
  | 'cozy'          // Warm, comfortable, inviting
  | 'dramatic';     // Bold, high-contrast, impactful

// ══════════════════════════════════════════════════════════════════════════════
// SEASONALITY - Time-based relevance
// ══════════════════════════════════════════════════════════════════════════════

export type Seasonality =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'holiday'   // Christmas, special occasions
  | 'all';      // Year-round

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCT ANALYSIS RESULT - Output from Vision AI
// ══════════════════════════════════════════════════════════════════════════════

export type ProductAnalysisResult = {
  /** Primary product category */
  category: ProductCategory;

  /** Specific product type (e.g., "running shoes", "moisturizer") */
  subCategory: string;

  /** Detected materials in the product */
  materials: ProductMaterial[];

  /** Design style/aesthetic */
  style: ProductStyle;

  /** Inferred target audience */
  targetAudience: TargetAudience;

  /** Color palette extracted from product */
  colorPalette: {
    dominant: string;      // Hex color
    accent: string[];      // Array of hex colors
    brightness: 'light' | 'medium' | 'dark';
  };

  /** Product characteristics */
  characteristics: {
    isTransparent: boolean;
    isReflective: boolean;
    hasComplexShape: boolean;
    size: 'small' | 'medium' | 'large';
  };

  /** AI confidence score 0-1 */
  confidence: number;

  /** Pre-computed suggested scene IDs */
  suggestedSceneIds: string[];
};

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORY RELATIONSHIPS - For partial matching
// ══════════════════════════════════════════════════════════════════════════════

export const CATEGORY_RELATIONSHIPS: Record<ProductCategory, ProductCategory[]> = {
  // Fashion cluster
  fashion_clothing: ['fashion_shoes', 'fashion_accessories', 'fashion_bags'],
  fashion_shoes: ['fashion_clothing', 'sports_fitness', 'fashion_accessories'],
  fashion_accessories: ['fashion_clothing', 'jewelry', 'fashion_bags'],
  fashion_bags: ['fashion_accessories', 'fashion_clothing', 'jewelry'],

  // Beauty cluster
  beauty_skincare: ['beauty_makeup', 'beauty_haircare', 'health_wellness'],
  beauty_makeup: ['beauty_skincare', 'beauty_fragrance', 'fashion_accessories'],
  beauty_haircare: ['beauty_skincare', 'beauty_fragrance'],
  beauty_fragrance: ['beauty_makeup', 'beauty_skincare', 'jewelry'],

  // Luxury cluster
  jewelry: ['watches', 'fashion_accessories', 'beauty_fragrance'],
  watches: ['jewelry', 'electronics_tech', 'fashion_accessories'],

  // Electronics cluster
  electronics_tech: ['electronics_audio', 'electronics_gaming', 'office_supplies'],
  electronics_audio: ['electronics_tech', 'electronics_gaming'],
  electronics_gaming: ['electronics_tech', 'electronics_audio', 'kids_toys'],

  // Home cluster
  home_decor: ['home_furniture', 'home_lighting', 'art_crafts'],
  home_furniture: ['home_decor', 'home_lighting', 'office_supplies'],
  home_kitchen: ['home_decor', 'food_beverage', 'food_gourmet'],
  home_lighting: ['home_decor', 'home_furniture'],

  // Food cluster
  food_beverage: ['food_gourmet', 'home_kitchen', 'health_wellness'],
  food_gourmet: ['food_beverage', 'home_kitchen'],

  // Sports cluster
  sports_fitness: ['outdoor_adventure', 'fashion_shoes', 'health_wellness'],
  outdoor_adventure: ['sports_fitness', 'fashion_bags', 'electronics_tech'],

  // Kids cluster
  kids_toys: ['kids_clothing', 'electronics_gaming'],
  kids_clothing: ['kids_toys', 'fashion_clothing'],

  // Other
  pets: ['home_decor', 'food_beverage'],
  art_crafts: ['home_decor', 'jewelry', 'office_supplies'],
  automotive: ['electronics_tech', 'sports_fitness'],
  garden_plants: ['home_decor', 'outdoor_adventure'],
  office_supplies: ['electronics_tech', 'home_furniture'],
  health_wellness: ['beauty_skincare', 'sports_fitness', 'food_beverage'],
};

// ══════════════════════════════════════════════════════════════════════════════
// STYLE-MOOD COMPATIBILITY - For matching scores
// ══════════════════════════════════════════════════════════════════════════════

export const STYLE_MOOD_COMPATIBILITY: Record<ProductStyle, SceneMood[]> = {
  minimalist: ['professional', 'lifestyle', 'natural'],
  luxury: ['luxury', 'professional', 'dramatic'],
  vintage: ['artistic', 'cozy', 'natural'],
  modern: ['professional', 'lifestyle', 'artistic'],
  rustic: ['natural', 'cozy', 'lifestyle'],
  industrial: ['dramatic', 'artistic', 'professional'],
  bohemian: ['artistic', 'natural', 'lifestyle'],
  classic: ['professional', 'luxury', 'cozy'],
  playful: ['playful', 'lifestyle', 'artistic'],
  sporty: ['lifestyle', 'dramatic', 'playful'],
  tech: ['professional', 'dramatic', 'artistic'],
  organic: ['natural', 'cozy', 'lifestyle'],
};

// ══════════════════════════════════════════════════════════════════════════════
// AUDIENCE-MOOD COMPATIBILITY - For matching scores
// ══════════════════════════════════════════════════════════════════════════════

export const AUDIENCE_MOOD_COMPATIBILITY: Record<TargetAudience, SceneMood[]> = {
  premium: ['luxury', 'professional', 'dramatic'],
  mass_market: ['lifestyle', 'professional', 'playful'],
  eco_conscious: ['natural', 'lifestyle', 'cozy'],
  tech_savvy: ['professional', 'dramatic', 'artistic'],
  family: ['lifestyle', 'cozy', 'playful'],
  young_adult: ['lifestyle', 'artistic', 'playful'],
  professional: ['professional', 'luxury', 'lifestyle'],
  creative: ['artistic', 'playful', 'natural'],
  fitness: ['lifestyle', 'dramatic', 'playful'],
  senior: ['cozy', 'professional', 'natural'],
};

// ══════════════════════════════════════════════════════════════════════════════
// CATEGORY LABELS - French translations for UI
// ══════════════════════════════════════════════════════════════════════════════

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  fashion_clothing: 'Mode - V\u00eatements',
  fashion_shoes: 'Mode - Chaussures',
  fashion_accessories: 'Mode - Accessoires',
  fashion_bags: 'Mode - Sacs',
  beauty_skincare: 'Beaut\u00e9 - Soins',
  beauty_makeup: 'Beaut\u00e9 - Maquillage',
  beauty_haircare: 'Beaut\u00e9 - Cheveux',
  beauty_fragrance: 'Beaut\u00e9 - Parfums',
  jewelry: 'Bijoux',
  watches: 'Montres',
  electronics_tech: 'Tech - \u00c9lectronique',
  electronics_audio: 'Tech - Audio',
  electronics_gaming: 'Tech - Gaming',
  home_decor: 'Maison - D\u00e9co',
  home_furniture: 'Maison - Mobilier',
  home_kitchen: 'Maison - Cuisine',
  home_lighting: 'Maison - \u00c9clairage',
  food_beverage: 'Alimentation',
  food_gourmet: 'Gastronomie',
  sports_fitness: 'Sport & Fitness',
  outdoor_adventure: 'Outdoor & Aventure',
  kids_toys: 'Enfants - Jouets',
  kids_clothing: 'Enfants - V\u00eatements',
  pets: 'Animaux',
  art_crafts: 'Art & Artisanat',
  automotive: 'Automobile',
  garden_plants: 'Jardin & Plantes',
  office_supplies: 'Bureau',
  health_wellness: 'Sant\u00e9 & Bien-\u00eatre',
};

export const MATERIAL_LABELS: Record<ProductMaterial, string> = {
  fabric: 'Tissu',
  leather: 'Cuir',
  metal: 'M\u00e9tal',
  wood: 'Bois',
  glass: 'Verre',
  ceramic: 'C\u00e9ramique',
  plastic: 'Plastique',
  stone: 'Pierre',
  organic: 'Organique',
  rubber: 'Caoutchouc',
  paper: 'Papier',
  mixed: 'Mixte',
};

export const STYLE_LABELS: Record<ProductStyle, string> = {
  minimalist: 'Minimaliste',
  luxury: 'Luxe',
  vintage: 'Vintage',
  modern: 'Moderne',
  rustic: 'Rustique',
  industrial: 'Industriel',
  bohemian: 'Boh\u00e8me',
  classic: 'Classique',
  playful: 'Ludique',
  sporty: 'Sportif',
  tech: 'Tech',
  organic: 'Organique',
};
