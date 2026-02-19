import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        // ---- Authentication: verify user session ----
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({
                status: 'error',
                message: 'Non authentifié. Veuillez vous connecter.'
            }, { status: 401 });
        }

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({
                status: 'error',
                message: '❌ GEMINI_API_KEY is missing from environment variables.'
            }, { status: 500 });
        }

        // Initialize Gemini Client (matches flowriter.ts logic)
        // Note: flowriter.ts uses a specific import style, checking compatibility
        const ai = new GoogleGenAI({ apiKey });

        const prompt = "Réponds seulement par ce mot exact : 'SUCCÈS'.";

        console.log("🛠️ TEST DIAGNOSTIC: Sending request to Gemini...");

        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
        });

        const text = result.text?.trim();

        console.log("🛠️ TEST DIAGNOSTIC: Received:", text);

        if (text === 'SUCCÈS' || text?.includes('SUCCÈS')) {
            return NextResponse.json({
                status: 'success',
                message: '✅ Connection to Gemini is WORKING!',
                response: text,
                keyConfigured: true
            });
        } else {
            return NextResponse.json({
                status: 'warning',
                message: '⚠️ Connection worked but response was unexpected.',
                response: text
            });
        }

    } catch (error: any) {
        console.error("❌ TEST DIAGNOSTIC FAILED:", error);
        return NextResponse.json({
            status: 'error',
            message: error.message || 'Unknown error occurred',
            ...(process.env.NODE_ENV === 'development' ? { details: error.message } : {}),
        }, { status: 500 });
    }
}
