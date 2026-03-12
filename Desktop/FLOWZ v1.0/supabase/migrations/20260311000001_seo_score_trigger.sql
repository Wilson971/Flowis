-- ============================================================================
-- Trigger: auto-compute seo_score + seo_breakdown on product INSERT/UPDATE
-- Fires only when working_content or metadata changes.
-- Ports the basic scorer logic from supabase/functions/_shared/seo-scorer.ts
-- ============================================================================

-- ── Helper: strip HTML tags ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.strip_html(html text)
RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
AS $$
    SELECT COALESCE(regexp_replace(html, '<[^>]*>', '', 'g'), '');
$$;

-- ── Helper: score by character length (graduated curve) ─────────────────────
CREATE OR REPLACE FUNCTION public.seo_score_by_length(
    txt text,
    p_min int, p_ideal_min int, p_ideal_max int, p_max int
)
RETURNS int
LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE
AS $$
DECLARE
    clean text := trim(public.strip_html(COALESCE(txt, '')));
    len int := char_length(clean);
    buffer numeric;
BEGIN
    IF len = 0 THEN RETURN 0; END IF;
    IF len < p_min THEN RETURN round((len::numeric / p_min) * 40)::int; END IF;
    IF len >= p_ideal_min AND len <= p_ideal_max THEN RETURN 100; END IF;
    IF len >= p_min AND len < p_ideal_min THEN
        RETURN round(40 + ((len - p_min)::numeric / (p_ideal_min - p_min)) * 60)::int;
    END IF;
    IF len > p_ideal_max AND len <= p_max THEN
        RETURN round(100 - ((len - p_ideal_max)::numeric / (p_max - p_ideal_max)) * 30)::int;
    END IF;
    -- len > max
    buffer := p_max * 0.5;
    RETURN GREATEST(0, round(70 - ((len - p_max)::numeric / buffer) * 70)::int);
END;
$$;

-- ── Main trigger function ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_product_seo_score()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    wc jsonb;
    meta jsonb;
    v_title text;
    v_short_desc text;
    v_description text;
    v_meta_title text;
    v_meta_desc text;
    v_slug text;
    v_images jsonb;
    v_img_count int;
    v_alt_count int;
    -- Per-field scores (0-100)
    s_meta_title int;
    s_meta_desc int;
    s_title int;
    s_short_desc int;
    s_description int;
    s_slug int;
    s_images int;
    s_alt_text int;
    -- Slug helpers
    slug_words int;
    -- Weighted score
    weighted_sum numeric := 0;
    total_weight numeric := 13.0;  -- sum of all weights
    v_score int;
    -- Breakdown categories (/25 each)
    bd_titles numeric;
    bd_descriptions numeric;
    bd_images numeric;
    bd_technical numeric;
    v_breakdown jsonb;
BEGIN
    wc := COALESCE(NEW.working_content, '{}'::jsonb);
    meta := COALESCE(NEW.metadata, '{}'::jsonb);

    -- Resolve fields with fallback chain
    v_title      := COALESCE(wc->>'title', NEW.title, '');
    v_short_desc := COALESCE(wc->>'short_description', meta->>'short_description', '');
    v_description:= COALESCE(wc->>'description', meta->>'description', '');
    v_meta_title := COALESCE(wc->>'meta_title', meta->>'meta_title', '');
    v_meta_desc  := COALESCE(wc->>'meta_description', meta->>'meta_description', '');
    v_slug       := COALESCE(wc->>'slug', meta->>'slug', wc->>'permalink', '');
    v_images     := COALESCE(wc->'images', meta->'images', '[]'::jsonb);

    -- ── Score text fields ──────────────────────────────────────────
    s_meta_title  := public.seo_score_by_length(v_meta_title,  30, 50, 60, 70);
    s_meta_desc   := public.seo_score_by_length(v_meta_desc,   80, 130, 160, 170);
    s_title       := public.seo_score_by_length(v_title,       10, 30, 60, 80);
    s_short_desc  := public.seo_score_by_length(v_short_desc,  50, 100, 200, 300);
    s_description := public.seo_score_by_length(v_description, 200, 400, 800, 5000);

    -- ── Score slug (word count) ────────────────────────────────────
    IF v_slug = '' THEN
        s_slug := 0;
    ELSE
        slug_words := array_length(string_to_array(v_slug, '-'), 1);
        IF slug_words IS NULL THEN slug_words := 0; END IF;
        IF slug_words < 2 THEN
            s_slug := round((slug_words::numeric / 2) * 40)::int;
        ELSIF slug_words >= 3 AND slug_words <= 5 THEN
            s_slug := 100;
        ELSIF slug_words >= 2 AND slug_words < 3 THEN
            s_slug := round(40 + ((slug_words - 2)::numeric / 1) * 60)::int;
        ELSIF slug_words > 5 AND slug_words <= 8 THEN
            s_slug := round(100 - ((slug_words - 5)::numeric / 3) * 30)::int;
        ELSE
            s_slug := 30;
        END IF;
    END IF;

    -- ── Score images ───────────────────────────────────────────────
    v_img_count := jsonb_array_length(v_images);
    IF v_img_count = 0 THEN s_images := 0;
    ELSIF v_img_count = 1 THEN s_images := 50;
    ELSIF v_img_count = 2 THEN s_images := 75;
    ELSE s_images := 100;
    END IF;

    -- ── Score alt text ─────────────────────────────────────────────
    IF v_img_count = 0 THEN
        s_alt_text := 0;
    ELSE
        SELECT COUNT(*) INTO v_alt_count
        FROM jsonb_array_elements(v_images) elem
        WHERE trim(COALESCE(elem->>'alt', '')) <> '';
        s_alt_text := round((v_alt_count::numeric / v_img_count) * 100)::int;
    END IF;

    -- ── Weighted average (matches TypeScript weights) ──────────────
    weighted_sum := s_meta_title * 2.5
                  + s_meta_desc  * 2.5
                  + s_title      * 2.0
                  + s_short_desc * 1.5
                  + s_description* 1.5
                  + s_slug       * 1.0
                  + s_images     * 1.0
                  + s_alt_text   * 1.0;
    v_score := round(weighted_sum / total_weight)::int;

    -- ── Breakdown (4 categories /25 + 6 per-field f_*) ─────────────
    bd_titles       := round(((s_meta_title + s_title)::numeric / 2) / 100 * 25, 1);
    bd_descriptions := round(((s_meta_desc + s_short_desc + s_description)::numeric / 3) / 100 * 25, 1);
    bd_images       := round(((s_images + s_alt_text)::numeric / 2) / 100 * 25, 1);
    bd_technical    := round(s_slug::numeric / 100 * 25, 1);

    v_breakdown := jsonb_build_object(
        'titles', bd_titles,
        'descriptions', bd_descriptions,
        'images', bd_images,
        'technical', bd_technical,
        'f_meta_title', s_meta_title,
        'f_title', s_title,
        'f_meta_description', s_meta_desc,
        'f_description', round(((s_short_desc + s_description)::numeric / 2))::int,
        'f_images', round(((s_images + s_alt_text)::numeric / 2))::int,
        'f_slug', s_slug
    );

    -- Write directly into the NEW row (before-trigger style via column assignment)
    NEW.seo_score := v_score;
    NEW.seo_breakdown := v_breakdown;

    RETURN NEW;
END;
$$;

-- ── Trigger (BEFORE so we can mutate NEW directly) ──────────────────────────
DROP TRIGGER IF EXISTS trg_compute_seo_score ON products;

-- INSERT trigger: always compute
CREATE TRIGGER trg_compute_seo_score_insert
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION public.compute_product_seo_score();

-- UPDATE trigger: only when SEO-relevant columns change
CREATE TRIGGER trg_compute_seo_score_update
    BEFORE UPDATE ON products
    FOR EACH ROW
    WHEN (
        NEW.working_content IS DISTINCT FROM OLD.working_content
        OR NEW.metadata IS DISTINCT FROM OLD.metadata
    )
    EXECUTE FUNCTION public.compute_product_seo_score();
