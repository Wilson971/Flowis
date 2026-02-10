/**
 * Script pour inspecter les données d'un produit synchronisé
 * Usage: npx tsx scripts/inspect-product.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Charger .env.local manuellement
function loadEnv() {
    try {
        const envPath = resolve(process.cwd(), '.env.local');
        const envContent = readFileSync(envPath, 'utf-8');
        const lines = envContent.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key, ...valueParts] = trimmed.split('=');
                const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        }
    } catch {
        // Ignore if file doesn't exist
    }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variables d\'environnement Supabase manquantes');
    console.log('Définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRandomProduct() {
    console.log('🔍 Recherche d\'un produit au hasard...\n');

    // Vérifier les sync jobs récents
    const { data: syncJobs, error: syncError } = await supabase
        .from('sync_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (syncJobs && syncJobs.length > 0) {
        console.log('📋 DERNIERS JOBS DE SYNC:');
        console.log('───────────────────────────────────────────────────────────');
        syncJobs.forEach((job: any, i: number) => {
            console.log(`\n  Job ${i + 1}:`);
            console.log(`    ID:              ${job.id}`);
            console.log(`    Store ID:        ${job.store_id}`);
            console.log(`    Status:          ${job.status}`);
            console.log(`    Phase:           ${job.current_phase}`);
            console.log(`    Products:        ${job.synced_products}/${job.total_products}`);
            console.log(`    Variations:      ${job.synced_variations}/${job.total_variations}`);
            console.log(`    Categories:      ${job.synced_categories}/${job.total_categories}`);
            console.log(`    Error:           ${job.error_message || '(aucune)'}`);
            console.log(`    Started:         ${job.started_at}`);
            console.log(`    Completed:       ${job.completed_at || '(en cours)'}`);
        });
        console.log('\n');
    } else {
        console.log('⚠️ Aucun job de sync trouvé\n');
    }

    // Vérifier les stores
    const { data: stores, error: storeError } = await supabase
        .from('stores')
        .select('id, name, platform, created_at')
        .limit(5);

    if (stores && stores.length > 0) {
        console.log('🏪 STORES DISPONIBLES:');
        console.log('───────────────────────────────────────────────────────────');
        stores.forEach((store: any, i: number) => {
            console.log(`  ${i + 1}. ${store.name} (${store.platform}) - ID: ${store.id}`);
        });
        console.log('\n');
    } else {
        console.log('⚠️ Aucun store trouvé\n');
    }

    // D'abord, compter tous les produits
    const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    console.log(`📊 Nombre total de produits dans la base: ${count ?? 0}\n`);

    // Récupérer un produit au hasard (le plus récent)
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('imported_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('❌ Erreur:', error.message);
        return;
    }

    if (!products || products.length === 0) {
        console.log('❌ Aucun produit trouvé dans la base de données');
        return;
    }

    // Prendre un produit au hasard parmi les 5 premiers
    const randomIndex = Math.floor(Math.random() * products.length);
    const product = products[randomIndex];

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 PRODUIT IMPORTÉ');
    console.log('═══════════════════════════════════════════════════════════\n');

    // Informations de base
    console.log('📋 INFORMATIONS DE BASE');
    console.log('───────────────────────────────────────────────────────────');
    console.log(`ID:                  ${product.id}`);
    console.log(`Titre:               ${product.title}`);
    console.log(`Platform:            ${product.platform}`);
    console.log(`Platform Product ID: ${product.platform_product_id}`);
    console.log(`SKU:                 ${product.sku || '(non défini)'}`);
    console.log(`Type:                ${product.product_type || '(non défini)'}`);
    console.log(`Prix:                ${product.price || '(non défini)'}`);
    console.log(`Stock:               ${product.stock ?? '(non défini)'}`);
    console.log(`Image URL:           ${product.image_url || '(non définie)'}`);
    console.log(`Importé le:          ${product.imported_at}`);
    console.log(`Mis à jour le:       ${product.updated_at || '(jamais)'}`);
    console.log(`AI Enhanced:         ${product.ai_enhanced ? 'Oui' : 'Non'}`);
    console.log();

    // Metadata
    if (product.metadata) {
        console.log('📊 METADATA (données WooCommerce)');
        console.log('───────────────────────────────────────────────────────────');
        const meta = product.metadata;

        console.log(`  Status:            ${meta.status || '(non défini)'}`);
        console.log(`  Type:              ${meta.type || meta.product_type || '(non défini)'}`);
        console.log(`  Slug:              ${meta.slug || meta.handle || '(non défini)'}`);
        console.log(`  Permalink:         ${meta.permalink || '(non défini)'}`);
        console.log(`  Featured:          ${meta.featured ? 'Oui' : 'Non'}`);
        console.log(`  Visibility:        ${meta.catalog_visibility || '(non défini)'}`);

        // Prix
        console.log('\n  💰 Prix:');
        console.log(`    Regular Price:   ${meta.regular_price || '(non défini)'}`);
        console.log(`    Sale Price:      ${meta.sale_price || '(non défini)'}`);
        console.log(`    On Sale:         ${meta.on_sale ? 'Oui' : 'Non'}`);
        console.log(`    Tax Status:      ${meta.tax_status || '(non défini)'}`);
        console.log(`    Tax Class:       ${meta.tax_class || '(non défini)'}`);

        // Stock
        console.log('\n  📦 Inventaire:');
        console.log(`    Stock Status:    ${meta.stock_status || '(non défini)'}`);
        console.log(`    Manage Stock:    ${meta.manage_stock ? 'Oui' : 'Non'}`);
        console.log(`    Backorders:      ${meta.backorders || '(non défini)'}`);

        // Dimensions
        console.log('\n  📐 Dimensions:');
        console.log(`    Weight:          ${meta.weight || '(non défini)'}`);
        if (meta.dimensions) {
            console.log(`    Length:          ${meta.dimensions.length || '(non défini)'}`);
            console.log(`    Width:           ${meta.dimensions.width || '(non défini)'}`);
            console.log(`    Height:          ${meta.dimensions.height || '(non défini)'}`);
        }
        console.log(`    Shipping Class:  ${meta.shipping_class || '(non défini)'}`);

        // Catégories
        if (meta.categories && meta.categories.length > 0) {
            console.log('\n  🏷️ Catégories:');
            meta.categories.forEach((cat: any, i: number) => {
                console.log(`    ${i + 1}. ${cat.name} (ID: ${cat.id})`);
            });
        }

        // Attributs
        if (meta.attributes && meta.attributes.length > 0) {
            console.log('\n  🎨 Attributs:');
            meta.attributes.forEach((attr: any, i: number) => {
                console.log(`    ${i + 1}. ${attr.name}: ${attr.options?.join(', ') || '(vide)'}`);
            });
        }

        // Variations
        if (meta.variants && meta.variants.length > 0) {
            console.log(`\n  🔄 Variations: ${meta.variants.length} variante(s)`);
            meta.variants.slice(0, 3).forEach((v: any, i: number) => {
                console.log(`    ${i + 1}. SKU: ${v.sku || 'N/A'} | Prix: ${v.price || 'N/A'} | Stock: ${v.stock_quantity ?? 'N/A'}`);
            });
            if (meta.variants.length > 3) {
                console.log(`    ... et ${meta.variants.length - 3} autres variantes`);
            }
        }

        // Images
        if (meta.images && meta.images.length > 0) {
            console.log(`\n  🖼️ Images: ${meta.images.length} image(s)`);
            meta.images.slice(0, 3).forEach((img: any, i: number) => {
                console.log(`    ${i + 1}. ${img.src?.substring(0, 60)}...`);
            });
        }

        console.log();
    }

    // Working Content
    if (product.working_content) {
        console.log('📝 WORKING CONTENT (contenu actuel)');
        console.log('───────────────────────────────────────────────────────────');
        const wc = product.working_content;
        console.log(`  Title:             ${wc.title || '(non défini)'}`);
        console.log(`  Short Description: ${(wc.short_description || '').substring(0, 100)}${wc.short_description?.length > 100 ? '...' : ''}`);
        console.log(`  Description:       ${(wc.description || '').substring(0, 100)}${wc.description?.length > 100 ? '...' : ''}`);
        if (wc.seo) {
            console.log(`  SEO Title:         ${wc.seo.title || '(non défini)'}`);
            console.log(`  Meta Description:  ${(wc.seo.description || '').substring(0, 80)}${wc.seo.description?.length > 80 ? '...' : ''}`);
        }
        console.log();
    }

    // Draft Content
    if (product.draft_generated_content) {
        console.log('✨ DRAFT CONTENT (contenu généré par IA)');
        console.log('───────────────────────────────────────────────────────────');
        const dc = product.draft_generated_content;
        console.log(`  Title:             ${dc.title || '(non défini)'}`);
        console.log(`  Short Description: ${(dc.short_description || '').substring(0, 100)}...`);
        console.log();
    }

    // Dirty Fields
    if (product.dirty_fields_content && product.dirty_fields_content.length > 0) {
        console.log('⚠️ CHAMPS MODIFIÉS (à synchroniser)');
        console.log('───────────────────────────────────────────────────────────');
        product.dirty_fields_content.forEach((field: string) => {
            console.log(`  - ${field}`);
        });
        console.log();
    }

    // Store Snapshot
    if (product.store_snapshot_content) {
        console.log('💾 STORE SNAPSHOT (dernière version WooCommerce)');
        console.log('───────────────────────────────────────────────────────────');
        const ss = product.store_snapshot_content;
        console.log(`  Title:             ${ss.title || '(non défini)'}`);
        console.log(`  Short Description: ${(ss.short_description || '').substring(0, 100)}...`);
        console.log();
    }

    // Export JSON complet
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📄 JSON COMPLET (pour debug)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(JSON.stringify(product, null, 2));
}

inspectRandomProduct().catch(console.error);
