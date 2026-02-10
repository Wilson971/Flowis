# Getting Started with FLOWZ Products Management

This guide will help you set up and run the products management system.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# AI Provider Keys (for edge functions)
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

### 3. Set Up Supabase Database

Follow the [Supabase Deployment Guide](./supabase/DEPLOYMENT_GUIDE.md) to:

1. Run database migrations
2. Deploy edge functions
3. Set up environment secrets

Quick commands:

```bash
# Link to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Push database migrations
supabase db push

# Deploy edge functions
supabase functions deploy push-to-store
supabase functions deploy batch-generation

# Set secrets
supabase secrets set GEMINI_API_KEY=your_key
supabase secrets set OPENAI_API_KEY=your_key
```

### 4. Create Your First Store

You can create a store using the Supabase dashboard or SQL editor:

```sql
INSERT INTO stores (name, platform, platform_connections, user_id)
VALUES (
  'My WooCommerce Store',
  'woocommerce',
  '{
    "shop_url": "https://mystore.com",
    "api_key": "ck_xxxxxxxxxxxxx",
    "api_secret": "cs_xxxxxxxxxxxxx"
  }'::jsonb,
  auth.uid()
);
```

Or for Shopify:

```sql
INSERT INTO stores (name, platform, platform_connections, user_id)
VALUES (
  'My Shopify Store',
  'shopify',
  '{
    "shop_url": "mystore.myshopify.com",
    "access_token": "shpat_xxxxxxxxxxxxx"
  }'::jsonb,
  auth.uid()
);
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
my-app/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx       # Main navigation sidebar
│   │   │   ├── TopHeader.tsx         # Top header with search
│   │   │   └── StoreSelector.tsx     # Store dropdown selector
│   │   ├── products/
│   │   │   ├── ProductsTable.tsx     # Products list table
│   │   │   └── ProductSeoForm.tsx    # SEO edit form
│   │   └── ui/                        # shadcn/ui components
│   │
│   ├── contexts/
│   │   ├── StoreContext.tsx          # Store management context
│   │   ├── ThemeContext.tsx          # Theme (dark/light) context
│   │   └── SidebarContext.tsx        # Sidebar state context
│   │
│   ├── hooks/
│   │   └── useProducts.ts            # React Query hooks for products
│   │
│   ├── lib/
│   │   ├── productHelpers.ts         # Product utility functions
│   │   ├── syncHelpers.ts            # Sync utility functions
│   │   └── supabase/
│   │       └── client.ts             # Supabase client
│   │
│   ├── routes/
│   │   ├── __root.tsx                # Root layout with providers
│   │   ├── index.tsx                 # Landing page
│   │   └── app/
│   │       ├── overview.tsx          # Dashboard
│   │       ├── products/
│   │       │   ├── index.tsx         # Products list
│   │       │   └── $productId/
│   │       │       └── edit.tsx      # Product edit page
│   │       └── stores/
│   │           └── index.tsx         # Stores management
│   │
│   ├── types/
│   │   └── product.ts                # TypeScript types
│   │
│   └── styles/
│       └── app.css                   # Global styles + theme tokens
│
├── supabase/
│   ├── functions/                    # Edge Functions
│   │   ├── push-to-store/           # Sync to e-commerce
│   │   └── batch-generation/        # AI content generation
│   │
│   └── migrations/                   # Database migrations
│       ├── 20250121_create_stores_table.sql
│       ├── 20250121_create_products_table.sql
│       ├── 20250121_create_batch_jobs_tables.sql
│       ├── 20250121_create_seo_serp_tables.sql
│       └── 20250121_create_rpc_functions.sql
│
└── package.json
```

## 🎯 Key Features Implemented

### ✅ Store Management
- **Multiple stores support**: Connect WooCommerce, Shopify, or custom platforms
- **Store selector**: Quick switch between stores from the header
- **Store CRUD**: View, configure, and manage connected stores

### ✅ Product Management
- **Products list**: View all products with filtering and search
- **Product edit**: Edit product details, SEO content, and metadata
- **Draft system**: AI-generated content is stored as drafts for review
- **Sync status**: Track which products need to be synced to the store

### ✅ Content Generation (Backend Ready)
- **Batch generation**: Generate content for multiple products at once
- **AI providers**: Support for Gemini and OpenAI
- **Content types**: Title, descriptions, SEO fields, alt text
- **SERP enrichment**: Optional keyword research integration

### ✅ User Interface
- **Dark/Light theme**: Full theme support with smooth transitions
- **Responsive design**: Works on desktop, tablet, and mobile
- **Modern UI**: Uses shadcn/ui components + Tailwind CSS v4
- **Sidebar navigation**: Collapsible sidebar with persistence
- **Dashboard**: Overview with KPIs (connected to mock data)

## 🔧 Available Scripts

```bash
# Development
npm run dev                # Start dev server
npm run build              # Build for production
npm run preview            # Preview production build

# Supabase
supabase start             # Start local Supabase
supabase db push           # Push migrations to remote
supabase functions serve   # Test functions locally
supabase gen types         # Generate TypeScript types
```

## 📊 Database Tables

| Table | Description |
|-------|-------------|
| `stores` | Connected e-commerce stores |
| `products` | Products imported from stores |
| `batch_jobs` | AI content generation jobs |
| `batch_job_items` | Individual products in a batch |
| `product_seo_analysis` | SEO analysis results |
| `product_serp_analysis` | SERP/keyword analysis |
| `studio_jobs` | AI image generation jobs |

## 🔐 Authentication & Security

- **Row Level Security (RLS)** enabled on all tables
- Users can only access data from their own stores
- Edge functions verify user authorization
- API keys stored securely as Supabase secrets

## 🛠️ Next Steps

### Short Term
1. ✅ Test store creation and product import
2. ⏳ Implement product import from WooCommerce/Shopify
3. ⏳ Add batch operations UI (filters, toolbar)
4. ⏳ Integrate TipTap editor for rich text
5. ⏳ Add image upload and management

### Medium Term
1. SEO analysis implementation
2. SERP keyword research
3. Batch operations (approve all, reject all)
4. Product categories and tags
5. Advanced filters and search

### Long Term
1. Real-time collaboration
2. Content templates
3. A/B testing for product content
4. Analytics dashboard
5. Multi-language support

## 📚 Documentation

- [Supabase Deployment Guide](./supabase/DEPLOYMENT_GUIDE.md)
- [TanStack Router Docs](https://tanstack.com/router/latest)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Supabase Docs](https://supabase.com/docs)

## 🐛 Troubleshooting

### Issue: "Store not found"
**Solution**: Create a store using SQL or the Supabase dashboard first.

### Issue: Products not loading
**Solution**:
1. Check if `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
2. Verify RLS policies allow your user to access products
3. Check browser console for errors

### Issue: Edge functions fail
**Solution**:
1. Ensure secrets are set: `supabase secrets list`
2. Check function logs: `supabase functions logs [function-name]`
3. Verify Supabase project is linked: `supabase link`

### Issue: Dark/light theme not working
**Solution**: Clear localStorage and refresh: `localStorage.clear()`

## 💡 Tips

- Use the **Store Selector** in the header to quickly switch between stores
- **Draft content** must be approved before syncing to the store
- The **Products list** auto-refreshes when changes are made
- Use **Cmd/Ctrl + K** to open the search (coming soon)
- Check the **batch progress panel** when generating content

## 🤝 Contributing

This is a private project, but contributions are welcome via pull requests.

## 📝 License

Proprietary - All rights reserved

---

**Need help?** Check the documentation or create an issue in the repository.
