import { GoogleGenAI } from '@google/genai';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchImageSafe } from '@/lib/ssrf';
import type { ProductAnalysisResult } from '@/features/photo-studio/constants/productTaxonomy';
import {
  STYLE_MOOD_COMPATIBILITY,
  AUDIENCE_MOOD_COMPATIBILITY,
} from '@/features/photo-studio/constants/productTaxonomy';
import { NICHE_SCENE_PRESETS } from '@/features/photo-studio/constants/nicheScenePresets';

// ============================================================================
// PHOTO STUDIO - Product Classification API Route
//
// Uses Gemini Vision to classify a product image and recommend scene presets.
// ============================================================================

export const runtime = 'nodejs';
export const maxDuration = 60;

// ============================================================================
// IMAGE SIZE CONSTANTS
// ============================================================================

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_SIZE * 1.37);

function parseBase64DataUrl(dataUrl: string): { data: string; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  return match ? { mimeType: match[1], data: match[2] } : { mimeType: 'image/jpeg', data: dataUrl };
}

// ============================================================================
// CLASSIFICATION PROMPT
// ============================================================================

const CLASSIFICATION_PROMPT = `You are a product photography expert. Analyze this product image and return a JSON classification.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "category": "<one of: fashion_clothing, fashion_shoes, fashion_accessories, fashion_bags, beauty_skincare, beauty_makeup, beauty_haircare, beauty_fragrance, jewelry, watches, electronics_tech, electronics_audio, electronics_gaming, home_decor, home_furniture, home_kitchen, home_lighting, food_beverage, food_gourmet, sports_fitness, outdoor_adventure, kids_toys, kids_clothing, pets, art_crafts, automotive, garden_plants, office_supplies, health_wellness>",
  "subCategory": "<specific product type, e.g. 'running shoes', 'face moisturizer'>",
  "materials": ["<array of: fabric, leather, metal, wood, glass, ceramic, plastic, stone, organic, rubber, paper, mixed>"],
  "style": "<one of: minimalist, luxury, vintage, modern, rustic, industrial, bohemian, classic, playful, sporty, tech, organic>",
  "targetAudience": "<one of: premium, mass_market, eco_conscious, tech_savvy, family, young_adult, professional, creative, fitness, senior>",
  "colorPalette": {
    "dominant": "<hex color of dominant color>",
    "accent": ["<hex colors of accent colors>"],
    "brightness": "<light|medium|dark>"
  },
  "characteristics": {
    "isTransparent": <boolean>,
    "isReflective": <boolean>,
    "hasComplexShape": <boolean>,
    "size": "<small|medium|large>"
  },
  "confidence": <number 0-1>
}

Analyze the product carefully: its shape, materials, colors, brand positioning, and typical use context.`;

// ============================================================================
// PRESET SCORING ENGINE
// ============================================================================

function scorePresetsForProduct(analysis: ProductAnalysisResult): string[] {
  const scores: { id: string; score: number }[] = [];

  for (const preset of NICHE_SCENE_PRESETS) {
    let score = 0;

    // Category match (weight: 30)
    if (preset.targetCategories.includes(analysis.category)) {
      score += 30;
    }

    // Style-mood compatibility (weight: 20)
    const compatibleMoods = STYLE_MOOD_COMPATIBILITY[analysis.style] || [];
    if (compatibleMoods.includes(preset.mood)) {
      score += 20;
    }

    // Audience-mood compatibility (weight: 15)
    const audienceMoods = AUDIENCE_MOOD_COMPATIBILITY[analysis.targetAudience] || [];
    if (audienceMoods.includes(preset.mood)) {
      score += 15;
    }

    // Material match (weight: 15)
    const materialOverlap = analysis.materials.filter(m =>
      preset.targetMaterials.includes(m)
    ).length;
    score += Math.min(materialOverlap * 5, 15);

    // Style match (weight: 10)
    if (preset.targetStyles.includes(analysis.style)) {
      score += 10;
    }

    // Brightness-scene compatibility (weight: 10)
    const brightness = analysis.colorPalette?.brightness;
    if (brightness === 'dark' && ['dramatic', 'luxury'].includes(preset.mood)) score += 10;
    if (brightness === 'light' && ['professional', 'natural', 'playful'].includes(preset.mood)) score += 10;
    if (brightness === 'medium' && ['lifestyle', 'cozy'].includes(preset.mood)) score += 10;

    scores.push({ id: preset.id, score });
  }

  // Sort by score descending, return top 8 preset IDs
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .filter(s => s.score >= 20) // Minimum threshold
    .map(s => s.id);
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  // Auth
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Non authentifié.' } }, { status: 401 });
  }

  // API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: { code: 'SERVICE_UNAVAILABLE', message: 'API non configurée.' } }, { status: 500 });
  }

  // Parse body
  let body: { imageUrl?: string; imageBase64?: string };
  try { body = await request.json(); } catch {
    return NextResponse.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Corps invalide.' } }, { status: 400 });
  }

  const { imageUrl, imageBase64 } = body;
  if (!imageUrl && !imageBase64) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Image requise.' } }, { status: 400 });
  }

  if (imageBase64 && imageBase64.length > MAX_BASE64_LENGTH) {
    return NextResponse.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Image trop volumineuse.' } }, { status: 400 });
  }

  // Resolve image
  let imageData: string;
  let imageMimeType: string;
  try {
    if (imageUrl) {
      const fetched = await fetchImageSafe(imageUrl, MAX_IMAGE_SIZE);
      imageData = fetched.data;
      imageMimeType = fetched.mimeType;
    } else {
      const parsed = parseBase64DataUrl(imageBase64!);
      imageData = parsed.data;
      imageMimeType = parsed.mimeType;
    }
  } catch {
    return NextResponse.json({ success: false, error: { code: 'IMAGE_FETCH_FAILED', message: 'Impossible de charger l\'image.' } }, { status: 400 });
  }

  // Call Gemini Vision
  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: imageMimeType, data: imageData } },
          { text: CLASSIFICATION_PROMPT },
        ],
      },
      config: { temperature: 0.2 },
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({ success: false, error: { code: 'NO_RESULT', message: 'Aucune classification retournée.' } }, { status: 500 });
    }

    // Parse JSON from response (strip markdown fences if present)
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let analysis: ProductAnalysisResult;
    try {
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error('[Photo Studio Classify] Failed to parse JSON:', text);
      return NextResponse.json({ success: false, error: { code: 'PARSE_ERROR', message: 'Réponse IA invalide.' } }, { status: 500 });
    }

    // Score and recommend presets
    const suggestedSceneIds = scorePresetsForProduct(analysis);
    analysis.suggestedSceneIds = suggestedSceneIds;




    return NextResponse.json({
      success: true,
      classification: analysis,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Photo Studio Classify] Error:', message);
    return NextResponse.json({ success: false, error: { code: 'CLASSIFICATION_FAILED', message: 'Échec de la classification.' } }, { status: 500 });
  }
}
