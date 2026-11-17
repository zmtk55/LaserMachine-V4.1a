-- LOCAL PREPARATION. Add only the public visual background fields, no private config.
BEGIN;
CREATE OR REPLACE VIEW public.lm_storefront AS SELECT id,revision,public.lm_store_base(data)||public.lm_store_assets(data)||public.lm_pick(data,'backgroundUrl backgroundPatternOn') AS data FROM public.lm_store_private WHERE id='main';
COMMIT;
