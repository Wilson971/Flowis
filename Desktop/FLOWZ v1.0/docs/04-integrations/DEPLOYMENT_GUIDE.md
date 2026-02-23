# Supabase Deployment Guide

This guide explains how to deploy the database schema and edge functions to Supabase.

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link your Supabase project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

## Step 1: Run Database Migrations

Apply all migrations in order:

```bash
# Navigate to your project directory
cd my-app

# Run migrations
supabase db push

# Or run them individually:
supabase db execute -f supabase/migrations/20250121_create_stores_table.sql
supabase db execute -f supabase/migrations/20250121_create_products_table.sql
supabase db execute -f supabase/migrations/20250121_create_batch_jobs_tables.sql
supabase db execute -f supabase/migrations/20250121_create_seo_serp_tables.sql
supabase db execute -f supabase/migrations/20250121_create_rpc_functions.sql
```

## Step 2: Deploy Edge Functions

### Deploy push-to-store function:

```bash
supabase functions deploy push-to-store
```

### Deploy batch-generation function:

```bash
supabase functions deploy batch-generation
```

## Step 3: Set Environment Secrets

Edge functions need API keys for external services:

```bash
# Gemini API Key (for AI generation)
supabase secrets set GEMINI_API_KEY=your_gemini_api_key

# Verify secrets
supabase secrets list
```

## Step 4: Enable Realtime (Optional)

If you want realtime updates for products:

```bash
supabase realtime enable products
supabase realtime enable batch_jobs
supabase realtime enable batch_job_items
```

## Step 5: Create Initial Data

You can use the Supabase dashboard or SQL editor to create initial data:

```sql
-- Create a test store
INSERT INTO stores (name, platform, platform_connections)
VALUES (
  'My Test Store',
  'woocommerce',
  '{"shop_url": "https://mystore.com", "api_key": "ck_xxx", "api_secret": "cs_xxx"}'::jsonb
);

-- Check if store was created
SELECT * FROM stores;
```

## Database Schema Overview

### Tables Created:

1. **stores** - E-commerce stores (WooCommerce, Shopify)
2. **products** - Products imported from stores
3. **batch_jobs** - AI content generation batch jobs
4. **batch_job_items** - Individual products in batch jobs
5. **product_seo_analysis** - SEO analysis results
6. **product_serp_analysis** - SERP keyword analysis
7. **studio_jobs** - AI image generation jobs

### RPC Functions Created:

1. **accept_draft_content(product_id)** - Accept AI-generated draft
2. **reject_draft_content(product_id)** - Reject AI-generated draft
3. **cancel_sync(product_ids[])** - Cancel pending sync
4. **get_active_batch_job(store_id)** - Get active batch job

### Edge Functions Created:

1. **push-to-store** - Sync products to e-commerce platform
2. **batch-generation** - Generate AI content for multiple products

## Testing

### Test RPC functions:

```sql
-- Test accept_draft_content
SELECT accept_draft_content('product-uuid-here');

-- Test reject_draft_content
SELECT reject_draft_content('product-uuid-here');

-- Test cancel_sync
SELECT cancel_sync(ARRAY['uuid1', 'uuid2']::uuid[]);
```

### Test Edge Functions:

```bash
# Test push-to-store locally
supabase functions serve push-to-store

# In another terminal:
curl -i --location --request POST 'http://localhost:54321/functions/v1/push-to-store' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"product_ids":["uuid-here"]}'
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# AI Providers (used by edge functions)
GEMINI_API_KEY=your_gemini_key
```

## Security Notes

1. **Row Level Security (RLS)** is enabled on all tables
2. Users can only access data from their own stores
3. Edge functions verify user authorization before operations
4. API keys are stored securely as Supabase secrets

## Troubleshooting

### Issue: Migration fails

```bash
# Reset and try again
supabase db reset
supabase db push
```

### Issue: Edge function fails to deploy

```bash
# Check function logs
supabase functions logs push-to-store

# Redeploy with no-verify-jwt flag (development only)
supabase functions deploy push-to-store --no-verify-jwt
```

### Issue: RLS blocks queries

Check if user is authenticated and has proper store ownership:

```sql
-- Check current user
SELECT auth.uid();

-- Check user's stores
SELECT * FROM stores WHERE user_id = auth.uid();
```

## Next Steps

1. Create your first store via the UI or SQL
2. Import products from your e-commerce platform
3. Generate AI content using the batch generation feature
4. Sync changes back to your store using push-to-store

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
