-- ============================================================
-- Migration: create_seo_audits
-- Date: 2026-03-01
-- Purpose: Tables for SEO audit results + RPC for scoring
-- ============================================================

-- ── Types ────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE audit_severity AS ENUM ('critical', 'warning', 'ok');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE audit_category AS ENUM ('technical', 'on_page', 'quick_wins', 'performance');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tables ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.seo_audits (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    site_id       uuid NOT NULL REFERENCES public.gsc_sites(id) ON DELETE CASCADE,
    score         int  NOT NULL CHECK (score BETWEEN 0 AND 100),
    score_technical   int NOT NULL DEFAULT 0,
    score_on_page     int NOT NULL DEFAULT 0,
    score_quick_wins  int NOT NULL DEFAULT 0,
    score_performance int NOT NULL DEFAULT 0,
    summary       jsonb NOT NULL DEFAULT '{}',
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.seo_audit_issues (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id    uuid NOT NULL REFERENCES public.seo_audits(id) ON DELETE CASCADE,
    tenant_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category    audit_category NOT NULL,
    severity    audit_severity NOT NULL,
    title       text NOT NULL,
    description text NOT NULL,
    affected_count int NOT NULL DEFAULT 0,
    metadata    jsonb NOT NULL DEFAULT '{}',
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_seo_audits_tenant_site
    ON public.seo_audits (tenant_id, site_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_seo_audit_issues_audit
    ON public.seo_audit_issues (audit_id, severity);

-- ── RLS ──────────────────────────────────────────────────────

ALTER TABLE public.seo_audits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_audit_issues  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "seo_audits_tenant_isolation" ON public.seo_audits
    FOR ALL USING (tenant_id = auth.uid());

CREATE POLICY "seo_audit_issues_tenant_isolation" ON public.seo_audit_issues
    FOR ALL USING (tenant_id = auth.uid());

-- ── RPC: run_seo_audit ───────────────────────────────────────
-- Calcule un audit SEO complet depuis les données GSC en BDD.
-- Retourne l'audit_id du résultat persisté.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.run_seo_audit(
    p_tenant_id  uuid,
    p_site_id    uuid,
    p_date_range text DEFAULT 'last_28_days'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    -- Indexation vars
    v_total_urls          int := 0;
    v_indexed_urls        int := 0;
    v_not_indexed_urls    int := 0;
    v_error_urls          int := 0;
    v_sitemap_count       int := 0;
    v_sitemap_pages_sub   int := 0;
    v_sitemap_pages_idx   int := 0;

    -- Keywords / perf vars
    v_quick_wins_count    int := 0;
    v_low_ctr_count       int := 0;
    v_no_clicks_count     int := 0;
    v_total_clicks        bigint := 0;
    v_total_impressions   bigint := 0;
    v_avg_ctr             numeric := 0;
    v_avg_position        numeric := 0;
    v_prev_clicks         bigint := 0;

    -- Scoring vars
    v_score_technical     int := 0;
    v_score_on_page       int := 0;
    v_score_quick_wins    int := 0;
    v_score_performance   int := 0;
    v_score_total         int := 0;

    -- Output
    v_audit_id            uuid;
    v_issues              jsonb := '[]'::jsonb;
    v_issue               jsonb;

    -- Helpers
    v_index_ratio         numeric := 0;
    v_not_indexed_pct     numeric := 0;
BEGIN
    -- ── 0. Verify ownership ─────────────────────────────────
    IF NOT EXISTS (
        SELECT 1 FROM gsc_sites
        WHERE id = p_site_id AND tenant_id = p_tenant_id
    ) THEN
        RETURN jsonb_build_object('error', 'site_not_found');
    END IF;

    -- ── 1. Indexation data ──────────────────────────────────
    SELECT
        COALESCE(SUM(CASE WHEN coverage_state IS NOT NULL THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN coverage_state = 'Submitted and indexed' THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN coverage_state NOT IN ('Submitted and indexed', 'Indexed, not submitted in sitemap') THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN coverage_state ILIKE '%error%' OR coverage_state ILIKE '%Crawl%anomaly%' THEN 1 ELSE 0 END), 0)
    INTO v_total_urls, v_indexed_urls, v_not_indexed_urls, v_error_urls
    FROM gsc_indexation_urls
    WHERE site_id = p_site_id AND tenant_id = p_tenant_id;

    -- ── 2. Sitemaps ─────────────────────────────────────────
    SELECT
        COUNT(*),
        COALESCE(SUM(pages_submitted), 0),
        COALESCE(SUM(pages_indexed), 0)
    INTO v_sitemap_count, v_sitemap_pages_sub, v_sitemap_pages_idx
    FROM gsc_sitemaps
    WHERE site_id = p_site_id AND tenant_id = p_tenant_id;

    -- ── 3. Keywords / performance ────────────────────────────
    SELECT
        COALESCE(SUM(clicks), 0),
        COALESCE(SUM(impressions), 0),
        COALESCE(AVG(ctr), 0),
        COALESCE(AVG(position), 0)
    INTO v_total_clicks, v_total_impressions, v_avg_ctr, v_avg_position
    FROM gsc_keywords
    WHERE site_id = p_site_id
      AND tenant_id = p_tenant_id
      AND date_range = p_date_range;

    -- Previous period clicks (for performance delta)
    SELECT COALESCE(SUM(clicks), 0)
    INTO v_prev_clicks
    FROM gsc_keywords
    WHERE site_id = p_site_id
      AND tenant_id = p_tenant_id
      AND date_range = 'last_28_days_previous';

    -- Quick wins: positions 4-10 with impressions > 100
    SELECT COUNT(*) INTO v_quick_wins_count
    FROM gsc_keywords
    WHERE site_id = p_site_id
      AND tenant_id = p_tenant_id
      AND date_range = p_date_range
      AND position BETWEEN 4 AND 10
      AND impressions > 100;

    -- Low CTR: top 10 positions, CTR < 2%
    SELECT COUNT(*) INTO v_low_ctr_count
    FROM gsc_keywords
    WHERE site_id = p_site_id
      AND tenant_id = p_tenant_id
      AND date_range = p_date_range
      AND position <= 10
      AND ctr < 0.02
      AND impressions > 50;

    -- No clicks: high impressions, zero clicks
    SELECT COUNT(*) INTO v_no_clicks_count
    FROM gsc_keywords
    WHERE site_id = p_site_id
      AND tenant_id = p_tenant_id
      AND date_range = p_date_range
      AND clicks = 0
      AND impressions > 100;

    -- ── 4. SCORING ───────────────────────────────────────────

    -- TECHNIQUE (max 40 pts)
    v_score_technical := 40;

    -- Non-indexed pages ratio
    IF v_total_urls > 0 THEN
        v_not_indexed_pct := v_not_indexed_urls::numeric / v_total_urls;
        IF v_not_indexed_pct > 0.20 THEN
            v_score_technical := v_score_technical - 20;
        ELSIF v_not_indexed_pct > 0.10 THEN
            v_score_technical := v_score_technical - 12;
        ELSIF v_not_indexed_pct > 0.05 THEN
            v_score_technical := v_score_technical - 6;
        END IF;
    END IF;

    -- Crawl errors
    IF v_error_urls > 20 THEN
        v_score_technical := v_score_technical - 10;
    ELSIF v_error_urls > 5 THEN
        v_score_technical := v_score_technical - 5;
    END IF;

    -- Sitemap missing
    IF v_sitemap_count = 0 THEN
        v_score_technical := v_score_technical - 10;
    ELSIF v_sitemap_pages_sub > 0 THEN
        v_index_ratio := v_sitemap_pages_idx::numeric / v_sitemap_pages_sub;
        IF v_index_ratio < 0.50 THEN
            v_score_technical := v_score_technical - 8;
        ELSIF v_index_ratio < 0.80 THEN
            v_score_technical := v_score_technical - 4;
        END IF;
    END IF;

    v_score_technical := GREATEST(0, v_score_technical);

    -- ON-PAGE (max 30 pts)
    v_score_on_page := 30;
    IF v_low_ctr_count > 20 THEN
        v_score_on_page := v_score_on_page - 15;
    ELSIF v_low_ctr_count > 10 THEN
        v_score_on_page := v_score_on_page - 10;
    ELSIF v_low_ctr_count > 5 THEN
        v_score_on_page := v_score_on_page - 5;
    END IF;
    IF v_no_clicks_count > 10 THEN
        v_score_on_page := v_score_on_page - 10;
    ELSIF v_no_clicks_count > 5 THEN
        v_score_on_page := v_score_on_page - 5;
    END IF;
    v_score_on_page := GREATEST(0, v_score_on_page);

    -- QUICK WINS (max 20 pts) — plus d'opps non exploitées = score bas
    IF v_quick_wins_count = 0 THEN
        v_score_quick_wins := 20; -- Aucune opportunité = tout est déjà optimisé
    ELSIF v_quick_wins_count < 5 THEN
        v_score_quick_wins := 16;
    ELSIF v_quick_wins_count < 20 THEN
        v_score_quick_wins := 10;
    ELSE
        v_score_quick_wins := 4;
    END IF;

    -- PERFORMANCE (max 10 pts)
    v_score_performance := 10;
    IF v_avg_ctr < 0.01 THEN
        v_score_performance := v_score_performance - 6;
    ELSIF v_avg_ctr < 0.02 THEN
        v_score_performance := v_score_performance - 3;
    END IF;
    IF v_prev_clicks > 0 AND v_total_clicks < v_prev_clicks * 0.80 THEN
        v_score_performance := v_score_performance - 4;
    END IF;
    v_score_performance := GREATEST(0, v_score_performance);

    v_score_total := v_score_technical + v_score_on_page + v_score_quick_wins + v_score_performance;

    -- ── 5. INSERT AUDIT ─────────────────────────────────────
    INSERT INTO public.seo_audits (
        tenant_id, site_id, score,
        score_technical, score_on_page, score_quick_wins, score_performance,
        summary
    )
    VALUES (
        p_tenant_id, p_site_id, v_score_total,
        v_score_technical, v_score_on_page, v_score_quick_wins, v_score_performance,
        jsonb_build_object(
            'total_urls',         v_total_urls,
            'indexed_urls',       v_indexed_urls,
            'not_indexed_urls',   v_not_indexed_urls,
            'error_urls',         v_error_urls,
            'sitemap_count',      v_sitemap_count,
            'quick_wins_count',   v_quick_wins_count,
            'low_ctr_count',      v_low_ctr_count,
            'no_clicks_count',    v_no_clicks_count,
            'total_clicks',       v_total_clicks,
            'total_impressions',  v_total_impressions,
            'avg_ctr',            v_avg_ctr,
            'avg_position',       v_avg_position,
            'date_range',         p_date_range
        )
    )
    RETURNING id INTO v_audit_id;

    -- ── 6. INSERT ISSUES ────────────────────────────────────

    -- TECHNIQUE: Non-indexed pages
    IF v_not_indexed_pct > 0.10 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'technical', 'critical',
            'Pages non indexées',
            'Plus de 10% de vos pages ne sont pas indexées par Google. Vérifiez les erreurs de crawl et la couverture d''indexation.',
            v_not_indexed_urls);
    ELSIF v_not_indexed_pct > 0.05 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'technical', 'warning',
            'Pages non indexées',
            'Entre 5% et 10% de vos pages ne sont pas indexées. Surveillez l''onglet Indexation pour identifier les causes.',
            v_not_indexed_urls);
    ELSIF v_not_indexed_urls = 0 AND v_total_urls > 0 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'technical', 'ok',
            'Indexation complète',
            'Toutes vos pages soumises sont correctement indexées par Google.',
            v_indexed_urls);
    END IF;

    -- TECHNIQUE: Crawl errors
    IF v_error_urls > 20 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'technical', 'critical',
            'Erreurs de crawl critiques',
            'Plus de 20 pages présentent des erreurs de crawl. Ces pages ne peuvent pas être indexées. Corrigez les erreurs 404 et les redirections cassées.',
            v_error_urls);
    ELSIF v_error_urls > 0 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'technical', 'warning',
            'Erreurs de crawl détectées',
            'Des erreurs de crawl ont été détectées. Consultez l''onglet Indexation pour corriger les URLs concernées.',
            v_error_urls);
    END IF;

    -- TECHNIQUE: Sitemap
    IF v_sitemap_count = 0 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'technical', 'critical',
            'Sitemap absent',
            'Aucun sitemap n''est soumis à Google Search Console. Soumettez un sitemap XML pour améliorer la couverture d''indexation.',
            0);
    ELSIF v_sitemap_pages_sub > 0 AND v_index_ratio < 0.80 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'technical', 'warning',
            'Couverture sitemap insuffisante',
            'Moins de 80% des pages soumises dans votre sitemap sont indexées. Vérifiez que le contenu est accessible et non bloqué par robots.txt.',
            v_sitemap_pages_sub - v_sitemap_pages_idx);
    ELSE
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'technical', 'ok',
            'Sitemap soumis',
            'Votre sitemap est soumis à Google et la couverture est bonne.',
            v_sitemap_count);
    END IF;

    -- ON-PAGE: Low CTR
    IF v_low_ctr_count > 10 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'on_page', 'critical',
            'CTR faible sur les premières positions',
            'Plus de 10 mots-clés en position ≤10 ont un CTR inférieur à 2%. Optimisez vos titres et meta descriptions pour augmenter le taux de clic.',
            v_low_ctr_count);
    ELSIF v_low_ctr_count > 0 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'on_page', 'warning',
            'CTR faible sur quelques pages',
            'Certains mots-clés bien positionnés ont un CTR sous 2%. Améliorez les snippets pour ces pages.',
            v_low_ctr_count);
    END IF;

    -- ON-PAGE: No clicks
    IF v_no_clicks_count > 5 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'on_page', 'warning',
            'Pages visibles mais sans clics',
            'Des pages apparaissent dans les résultats Google mais ne génèrent aucun clic. Retravaillez les titres et descriptions.',
            v_no_clicks_count);
    ELSIF v_no_clicks_count = 0 AND v_total_impressions > 0 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'on_page', 'ok',
            'Engagement correct',
            'Toutes les pages visibles génèrent des clics.',
            0);
    END IF;

    -- QUICK WINS
    IF v_quick_wins_count > 20 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'quick_wins', 'warning',
            'Nombreuses opportunités Quick Wins non exploitées',
            'Plus de 20 mots-clés en position 4-10 avec beaucoup d''impressions. Optimisez ces pages pour passer en top 3 et doubler vos clics.',
            v_quick_wins_count);
    ELSIF v_quick_wins_count > 0 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'quick_wins', 'warning',
            'Opportunités Quick Wins disponibles',
            'Des mots-clés en position 4-10 peuvent facilement passer en top 3. Consultez l''onglet Opportunités pour les identifier.',
            v_quick_wins_count);
    ELSE
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'quick_wins', 'ok',
            'Pas de Quick Wins évidents',
            'Vos positions sont bien optimisées ou le volume de données est insuffisant pour identifier des opportunités.',
            0);
    END IF;

    -- PERFORMANCE: CTR global
    IF v_avg_ctr < 0.01 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'performance', 'critical',
            'CTR global très faible',
            'Votre CTR moyen est inférieur à 1%. Vos snippets n''incitent pas au clic. Travaillez les titres, descriptions et rich snippets.',
            0);
    ELSIF v_avg_ctr < 0.02 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'performance', 'warning',
            'CTR global perfectible',
            'Votre CTR moyen est entre 1% et 2%. Des améliorations sur vos meta descriptions peuvent augmenter votre trafic.',
            0);
    ELSE
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'performance', 'ok',
            'CTR global satisfaisant',
            format('Votre CTR moyen de %.1f%% est dans la normale pour votre secteur.', v_avg_ctr * 100),
            0);
    END IF;

    -- PERFORMANCE: Traffic trend
    IF v_prev_clicks > 0 AND v_total_clicks < v_prev_clicks * 0.80 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'performance', 'critical',
            'Baisse de trafic détectée',
            'Le trafic organique a baissé de plus de 20% par rapport à la période précédente. Identifiez les pages qui ont perdu des positions.',
            0);
    ELSIF v_prev_clicks > 0 AND v_total_clicks > v_prev_clicks * 1.10 THEN
        INSERT INTO public.seo_audit_issues (audit_id, tenant_id, category, severity, title, description, affected_count)
        VALUES (v_audit_id, p_tenant_id, 'performance', 'ok',
            'Trafic en hausse',
            'Le trafic organique a augmenté de plus de 10% par rapport à la période précédente. Bonne tendance !',
            0);
    END IF;

    -- ── 7. RETURN ────────────────────────────────────────────
    RETURN jsonb_build_object(
        'audit_id',           v_audit_id,
        'score',              v_score_total,
        'score_technical',    v_score_technical,
        'score_on_page',      v_score_on_page,
        'score_quick_wins',   v_score_quick_wins,
        'score_performance',  v_score_performance,
        'summary', jsonb_build_object(
            'total_urls',        v_total_urls,
            'indexed_urls',      v_indexed_urls,
            'not_indexed_urls',  v_not_indexed_urls,
            'error_urls',        v_error_urls,
            'sitemap_count',     v_sitemap_count,
            'quick_wins_count',  v_quick_wins_count,
            'low_ctr_count',     v_low_ctr_count,
            'no_clicks_count',   v_no_clicks_count,
            'total_clicks',      v_total_clicks,
            'avg_ctr',           v_avg_ctr,
            'avg_position',      v_avg_position
        )
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.run_seo_audit(uuid, uuid, text) TO authenticated;

-- ── RPC: get_latest_seo_audit ────────────────────────────────
-- Retourne le dernier audit + ses issues pour un site donné.
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_latest_seo_audit(
    p_tenant_id uuid,
    p_site_id   uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_audit record;
    v_issues jsonb;
BEGIN
    SELECT * INTO v_audit
    FROM public.seo_audits
    WHERE tenant_id = p_tenant_id AND site_id = p_site_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'id',            i.id,
            'category',      i.category,
            'severity',      i.severity,
            'title',         i.title,
            'description',   i.description,
            'affected_count',i.affected_count,
            'metadata',      i.metadata
        ) ORDER BY
            CASE i.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
            i.category
    )
    INTO v_issues
    FROM public.seo_audit_issues i
    WHERE i.audit_id = v_audit.id;

    RETURN jsonb_build_object(
        'audit_id',           v_audit.id,
        'score',              v_audit.score,
        'score_technical',    v_audit.score_technical,
        'score_on_page',      v_audit.score_on_page,
        'score_quick_wins',   v_audit.score_quick_wins,
        'score_performance',  v_audit.score_performance,
        'summary',            v_audit.summary,
        'created_at',         v_audit.created_at,
        'issues',             COALESCE(v_issues, '[]'::jsonb)
    );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_latest_seo_audit(uuid, uuid) TO authenticated;
