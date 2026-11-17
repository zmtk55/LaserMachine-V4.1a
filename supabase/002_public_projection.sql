BEGIN;
CREATE OR REPLACE VIEW public.lm_catalog AS SELECT id,revision,jsonb_build_object('id',data->'id','name',data->'name','brand',data->'brand','category',data->'category','price',data->'price','imageUrl',data->'imageUrl','colors',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',c->'id','name',c->'name','hex',c->'hex','imageUrl',c->'imageUrl','stock',CASE WHEN (c->>'stock')::numeric>0 THEN 1 ELSE 0 END)),'[]') FROM jsonb_array_elements(data->'colors') c)) AS data FROM public.lm_products;
CREATE OR REPLACE VIEW public.lm_font_catalog AS SELECT id,revision,jsonb_build_object('id',data->'id','name',data->'name','cssFamily',data->'cssFamily','category',data->'category','categories',data->'categories','isCustom',data->'isCustom','fileData',data->'fileData','active',data->'active') AS data FROM public.lm_fonts WHERE coalesce((data->>'active')::boolean,true);
GRANT SELECT ON public.lm_catalog,public.lm_font_catalog TO anon,authenticated;
INSERT INTO public.lm_admins(user_id) SELECT id FROM auth.users WHERE id='f9844650-d560-4517-85d8-97f2772b4627' AND email='julian.insignia@gmail.com';
COMMIT;
