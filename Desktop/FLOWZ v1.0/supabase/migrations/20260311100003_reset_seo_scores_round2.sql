-- Round 2: reset after fixing batch-analyze to read seo.title/seo.description
-- from working_content (same path as useProductSave and useSeoAnalysis)
UPDATE products SET seo_score = NULL, seo_breakdown = NULL;
