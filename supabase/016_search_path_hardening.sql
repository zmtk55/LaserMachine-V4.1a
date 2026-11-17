BEGIN;
-- Hardening: pin search_path on public-projection helpers (Supabase advisor "Function Search Path Mutable").
-- Read-only helper functions; behaviour unchanged. Apply only with owner approval.
ALTER FUNCTION public.lm_store_base(jsonb) SET search_path=public;
ALTER FUNCTION public.lm_store_assets(jsonb) SET search_path=public;
ALTER FUNCTION public.lm_assets(jsonb) SET search_path=public;
ALTER FUNCTION public.lm_colors(jsonb) SET search_path=public;
ALTER FUNCTION public.lm_templates(jsonb) SET search_path=public;
ALTER FUNCTION public.lm_template(jsonb) SET search_path=public;
ALTER FUNCTION public.lm_template_texts(jsonb) SET search_path=public;
ALTER FUNCTION public.lm_content_active(jsonb) SET search_path=public;
ALTER FUNCTION public.lm_content_item(jsonb) SET search_path=public;
ALTER FUNCTION public.lm_content_list(jsonb) SET search_path=public;
ALTER FUNCTION public.lm_order_base(jsonb) SET search_path=public;
ALTER FUNCTION public.lm_order_item(jsonb) SET search_path=public;
COMMIT;
