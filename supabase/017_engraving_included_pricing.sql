-- 017: pricing para productos con grabado incluido (tarifa confirmada por el dueño 2026-11-09).
-- PREPARADA, NO APLICADA hasta autorización. Autorizada por Julian 2026-11-09 21:58 ("Si" al alcance
-- guardar catálogo/precios/contacto/bancarios + corrección cálculo backend 350/400, sin publicación).
-- Incluye: rama engravingIncluded en lm_submit_order (espejo de services/orderPricing.ts) y
-- proyección de los flags engravingIncluded/illustrativeImage en la vista pública lm_catalog
-- (sin ellos el cliente calcularía con la fórmula anterior y el RPC rechazaría el pedido).
-- No depende de 016. Combos sin tarifa: RECHAZO (la UX aprobada los guarda sólo como borrador).
BEGIN;
CREATE OR REPLACE VIEW public.lm_catalog AS SELECT id,revision,jsonb_build_object('id',data->'id','name',data->'name','brand',data->'brand','category',data->'category','price',data->'price','imageUrl',data->'imageUrl','engravingIncluded',data->'engravingIncluded','illustrativeImage',data->'illustrativeImage','colors',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',c->'id','name',c->'name','hex',c->'hex','imageUrl',c->'imageUrl','stock',CASE WHEN (c->>'stock')::numeric>0 THEN 1 ELSE 0 END)),'[]') FROM jsonb_array_elements(data->'colors') c)) AS data FROM public.lm_products;
CREATE OR REPLACE FUNCTION public.lm_submit_order(payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
 uid uuid:=auth.uid(); rid text:=payload->>'requestId'; receipt jsonb; prior_payload jsonb; item jsonb; product_row public.lm_products; pricing jsonb; config jsonb; customer jsonb:=payload->'customer';
 items jsonb:='[]'; colors jsonb; color jsonb; coupon jsonb; coupons jsonb; coupon_code text:=upper(trim(coalesce(payload->>'couponCode','')));
 review boolean:=false; own_item boolean; qty integer; idx integer; stock integer; unit numeric; subtotal numeric:=0; total numeric; discount numeric:=0; method text:=payload->>'paymentMethod'; oid text; stamp text:=to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF rid IS NULL OR rid !~ '^[A-Za-z0-9_-]{16,100}$' THEN RAISE EXCEPTION 'Invalid request reference'; END IF;
 -- Serialize the same request before checking for an existing receipt.
 PERFORM pg_advisory_xact_lock(hashtextextended(uid::text||':'||rid,0));
 SELECT r.receipt,r.request_payload INTO receipt,prior_payload FROM public.lm_checkout_requests r WHERE user_id=uid AND request_id=rid;
 IF FOUND THEN IF prior_payload<>payload THEN RAISE EXCEPTION 'Request reference already used for different content'; END IF; RETURN receipt; END IF;
 IF octet_length(payload::text)>10000000 THEN RAISE EXCEPTION 'Request too large'; END IF;
 IF jsonb_typeof(payload->'expectedTotal') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid expected total'; END IF;
 IF method NOT IN ('EFECTIVO','TRANSFERENCIA') OR method IS NULL THEN RAISE EXCEPTION 'Unsupported manual payment'; END IF;
 IF coalesce((payload->>'pointsRedeemed')::numeric,0)<0 THEN RAISE EXCEPTION 'Invalid points request'; END IF;
 review:=coalesce((payload->>'pointsRedeemed')::numeric,0)>0;
 IF coalesce(trim(customer->>'name'),'')='' OR coalesce(trim(customer->>'phone'),'')='' OR length(customer->>'name')>160 OR length(customer->>'phone')>40 OR length(coalesce(customer->>'email',''))>254 THEN RAISE EXCEPTION 'Invalid customer'; END IF;
 IF jsonb_typeof(payload->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'items') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid items'; END IF;
 IF coalesce(payload->>'deliveryMethod','RECOLECCIÓN_TIENDA') NOT IN ('RECOLECCIÓN_TIENDA','ENVÍO_DOMICILIO') THEN RAISE EXCEPTION 'Invalid delivery method'; END IF;
 review:=review OR coalesce(payload->>'deliveryMethod','RECOLECCIÓN_TIENDA')<>'RECOLECCIÓN_TIENDA';
 -- Stable lock order serializes stock, coupon and pricing changes.
 SELECT data INTO config FROM public.lm_store_private WHERE id='main' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Store configuration required'; END IF;
 SELECT data INTO pricing FROM public.lm_pricing WHERE id='main' FOR SHARE;
 IF NOT FOUND OR NOT(pricing ?& ARRAY['baseEngravingPrice','extraSidePrice','logoSurcharge']) THEN RAISE EXCEPTION 'Pricing required'; END IF;
 IF jsonb_typeof(pricing->'baseEngravingPrice') IS DISTINCT FROM 'number' OR jsonb_typeof(pricing->'extraSidePrice') IS DISTINCT FROM 'number' OR jsonb_typeof(pricing->'logoSurcharge') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid price types'; END IF;
 IF (pricing->>'baseEngravingPrice')::numeric<0 OR (pricing->>'extraSidePrice')::numeric<0 OR (pricing->>'logoSurcharge')::numeric<0 THEN RAISE EXCEPTION 'Invalid pricing'; END IF;
 IF coupon_code<>'' THEN SELECT value INTO coupon FROM jsonb_array_elements(coalesce(config->'coupons','[]')) WHERE value->>'code'=coupon_code;review:=review OR coalesce(coupon->>'assignedToPhone','')<>'' OR coalesce(coupon->>'referrerUserId','')<>'';END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(payload->'items') LOOP
   qty:=(item->>'quantity')::integer;
   IF qty IS NULL OR qty<1 OR qty>1000 OR qty::text<>item->>'quantity' THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
   IF octet_length(item::text)>5000000 THEN RAISE EXCEPTION 'Design too large'; END IF;
   own_item:=coalesce((item->>'isClientItem')::boolean,false);
   SELECT * INTO product_row FROM public.lm_products WHERE id=item->>'productId' FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Product unavailable'; END IF;
   IF NOT own_item THEN
   IF (SELECT count(*) FROM jsonb_array_elements(product_row.data->'colors') WHERE value->>'name'=item->>'colorName')<>1 THEN RAISE EXCEPTION 'Ambiguous color'; END IF;
   SELECT value,ordinality::integer-1 INTO color,idx FROM jsonb_array_elements(product_row.data->'colors') WITH ORDINALITY WHERE value->>'name'=item->>'colorName';
   IF color IS NULL THEN RAISE EXCEPTION 'Color unavailable'; END IF;
   stock:=(color->>'stock')::integer;
   IF NOT review AND (stock IS NULL OR stock<qty) THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
   END IF;
   IF jsonb_typeof(item->'frontLogos') IS DISTINCT FROM 'array' OR jsonb_typeof(item->'backLogos') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid design layers'; END IF;
   IF (coalesce(item->>'frontText','')<>'' AND NOT EXISTS(SELECT 1 FROM public.lm_fonts WHERE data->>'id'=item->>'frontFontId' AND coalesce(data->>'active','true')='true')) OR
      (coalesce(item->>'backText','')<>'' AND NOT EXISTS(SELECT 1 FROM public.lm_fonts WHERE data->>'id'=item->>'backFontId' AND coalesce(data->>'active','true')='true')) THEN RAISE EXCEPTION 'Selected font unavailable'; END IF;
   IF jsonb_array_length(item->'frontLogos')>20 OR jsonb_array_length(item->'backLogos')>20 OR length(coalesce(item->>'frontText',''))>2000 OR length(coalesce(item->>'backText',''))>2000 THEN RAISE EXCEPTION 'Invalid design size'; END IF;
   item:=public.lm_checkout_asset_item(item);
   PERFORM public.lm_validate_design(item);
   unit:=CASE WHEN own_item THEN 0 ELSE (product_row.data->>'price')::numeric END;
   IF unit IS NULL OR unit::text IN ('NaN','Infinity','-Infinity') OR unit<0 THEN RAISE EXCEPTION 'Invalid product price'; END IF;
   IF coalesce((product_row.data->>'engravingIncluded')::boolean,false) AND NOT own_item THEN
   -- Tarifa confirmada por el dueño 2026-11-09: nombre al frente incluido en el precio; logo/dibujo al reverso +extraSidePrice en total (sin surcharge por logo).
   -- Combinaciones sin tarifa publicada (logo al frente, texto al reverso, varios logos al reverso) se RECHAZAN: la UX aprobada las guarda sólo como borrador, nunca como pedido. Sin cargo inventado ni pedido a cotizar por la vía del backend.
   IF jsonb_array_length(item->'frontLogos')>0 OR coalesce(item->>'backText','')<>'' OR coalesce(item->>'backText2','')<>'' OR jsonb_array_length(item->'backLogos')>1 THEN RAISE EXCEPTION 'Combination requires a quote. Save the design as a draft instead of ordering'; END IF;
   IF jsonb_array_length(item->'backLogos')=1 THEN unit:=unit+(pricing->>'extraSidePrice')::numeric; END IF;
   ELSE
   IF coalesce(item->>'frontText','')<>'' OR coalesce(item->>'frontText2','')<>'' OR jsonb_array_length(item->'frontLogos')>0 THEN unit:=unit+(pricing->>'baseEngravingPrice')::numeric; END IF;
   IF coalesce(item->>'backText','')<>'' OR coalesce(item->>'backText2','')<>'' OR jsonb_array_length(item->'backLogos')>0 THEN unit:=unit+(pricing->>'extraSidePrice')::numeric; END IF;
   unit:=round(unit+(jsonb_array_length(item->'frontLogos')+jsonb_array_length(item->'backLogos'))*(pricing->>'logoSurcharge')::numeric,2);
   END IF;
   subtotal:=subtotal+unit*qty;
   items:=items||jsonb_build_array(public.lm_order_item(item)||public.lm_pick(item,'isClientItem clientItemBrand clientItemColor backgroundAssetId')||jsonb_build_object('unitPrice',unit,'totalPrice',unit*qty));
   IF NOT own_item AND NOT review THEN
   colors:=jsonb_set(product_row.data->'colors',ARRAY[idx::text,'stock'],to_jsonb(stock-qty));
   UPDATE public.lm_products SET revision=revision+1,data=jsonb_set(data,'{colors}',colors),updated_at=now() WHERE id=product_row.id;
   END IF;
 END LOOP;
 IF coupon_code<>'' AND NOT review THEN
   IF (SELECT count(*) FROM jsonb_array_elements(coalesce(config->'coupons','[]')) WHERE value->>'code'=coupon_code)<>1 THEN RAISE EXCEPTION 'Ambiguous coupon'; END IF;
   SELECT value INTO coupon FROM jsonb_array_elements(coalesce(config->'coupons','[]')) WHERE value->>'code'=coupon_code;
   IF coupon IS NULL OR coupon->>'active' IS DISTINCT FROM 'true' OR coalesce(coupon->>'assignedToPhone','')<>'' OR coalesce(coupon->>'referrerUserId','')<>'' THEN RAISE EXCEPTION 'Coupon unavailable'; END IF;
   IF coalesce(coupon->>'expiryDate','')<>'' AND (coupon->>'expiryDate')::timestamptz<now() THEN RAISE EXCEPTION 'Coupon expired'; END IF;
   IF coalesce((coupon->>'maxUses')::integer,1)<>-1 AND coalesce((coupon->>'usedCount')::integer,0)>=coalesce((coupon->>'maxUses')::integer,1) THEN RAISE EXCEPTION 'Coupon used up'; END IF;
   discount:=(coupon->>'discountPercent')::numeric;
   IF discount IS NULL OR discount<0 OR discount>100 THEN RAISE EXCEPTION 'Invalid coupon'; END IF;
   SELECT jsonb_agg(CASE WHEN value->>'code'=coupon_code THEN jsonb_set(value,'{usedCount}',to_jsonb(coalesce((value->>'usedCount')::integer,0)+1)) ELSE value END) INTO coupons FROM jsonb_array_elements(config->'coupons');
   UPDATE public.lm_store_private SET revision=revision+1,data=jsonb_set(data,'{coupons}',coupons),updated_at=now() WHERE id='main';
 END IF;
 total:=round(subtotal*(1-discount/100),2);
 IF NOT review AND (payload->>'expectedTotal' IS NULL OR total<>(payload->>'expectedTotal')::numeric) THEN RAISE EXCEPTION 'Price changed. Review total before retrying'; END IF;
 LOOP oid:='LM-'||nextval('public.lm_order_number')::text; EXIT WHEN NOT EXISTS(SELECT 1 FROM public.lm_orders WHERE id=oid); END LOOP;
 INSERT INTO public.lm_orders(id,revision,data) VALUES(oid,1,jsonb_build_object('id',oid,'userId',uid,'customerName',customer->>'name','customerPhone',customer->>'phone','customerEmail',customer->>'email','items',items,'total',total,'paymentStatus','PENDIENTE','paymentMethod',method,'amountPaid',0,'pointsRedeemed',0,'pointsEarned',0,'reviewRequired',review,'totalConfirmed',NOT review,'requestedPoints',coalesce((payload->>'pointsRedeemed')::numeric,0),'requestedCoupon',nullif(coupon_code,''),'stockReserved',NOT review,'couponUsed',CASE WHEN review THEN NULL ELSE nullif(coupon_code,'') END,'discountAmount',round(subtotal-total,2),'status','RECIBIDO','deliveryMethod',coalesce(payload->>'deliveryMethod','RECOLECCIÓN_TIENDA'),'shippingAddress',left(coalesce(payload->>'notes',''),2000),'createdAt',stamp,'history',jsonb_build_array(jsonb_build_object('timestamp',stamp,'status','RECIBIDO','operator','CUSTOMER'))));
 receipt:=jsonb_build_object('requestId',rid,'orderId',oid,'receivedAt',stamp,'paymentStatus','PENDIENTE','total',total,'reviewRequired',review,'totalConfirmed',NOT review);
 INSERT INTO public.lm_checkout_requests VALUES(uid,rid,payload,receipt);
 RETURN receipt;
END;$$;


REVOKE ALL ON FUNCTION public.lm_submit_order(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lm_submit_order(jsonb) TO authenticated;
COMMIT;
