-- LOCAL PREPARATION ONLY. Apply only after 005+006 and trusted upload deployment.
-- Does not replace original SVG bytes with raster; order stores verified owner asset refs.
BEGIN;
CREATE FUNCTION public.lm_checkout_asset_item(item jsonb) RETURNS jsonb LANGUAGE plpgsql SET search_path=public AS $$
DECLARE side text; layer jsonb; layers jsonb; record public.lm_verified_assets;
BEGIN
 FOR side IN SELECT unnest(ARRAY['front','back']) LOOP
  IF jsonb_typeof(item->(side||'Logos')) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Logo array required'; END IF;
  layers:='[]';
  FOR layer IN SELECT value FROM jsonb_array_elements(item->(side||'Logos')) LOOP
   IF coalesce(layer->>'assetId','') !~ '^[a-f0-9-]{36}$' THEN RAISE EXCEPTION 'Upload original before checkout'; END IF;
   SELECT * INTO record FROM public.lm_verified_assets WHERE id=(layer->>'assetId')::uuid AND owner_id=auth.uid() AND status='verified';
   IF NOT FOUND THEN RAISE EXCEPTION 'Asset unavailable to caller'; END IF;
   layers:=layers||jsonb_build_array(jsonb_build_object('id',layer->'id','assetId',record.id,'sha256',record.sha256,'mimeType',record.mime_type,'state',layer->'state'));
  END LOOP;
  item:=jsonb_set(item,ARRAY[side||'Logos'],layers);
 END LOOP;
 RETURN item;
END;$$;
REVOKE ALL ON FUNCTION public.lm_checkout_asset_item(jsonb) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.lm_validate_design(item jsonb) RETURNS void LANGUAGE plpgsql SET search_path=public AS $$
DECLARE side text; key text; layer jsonb; placement jsonb; n numeric; font_id text;
BEGIN
 FOR side IN SELECT unnest(ARRAY['front','back']) LOOP
  FOREACH key IN ARRAY ARRAY[side||'Text',side||'Text2'] LOOP
   IF item ? key AND jsonb_typeof(item->key) NOT IN ('string','null') THEN RAISE EXCEPTION 'Invalid text'; END IF;
   IF length(coalesce(item->>key,''))>2000 THEN RAISE EXCEPTION 'Text too long'; END IF;
   IF coalesce(item->>key,'')<>'' THEN
    font_id:=item->>(CASE WHEN key=side||'Text2' THEN side||'FontId2' ELSE side||'FontId' END);
    IF NOT EXISTS(SELECT 1 FROM public.lm_fonts WHERE data->>'id'=font_id AND coalesce(data->>'active','true')='true') THEN RAISE EXCEPTION 'Selected font unavailable'; END IF;
   END IF;
  END LOOP;
  FOREACH key IN ARRAY ARRAY[side||'DesignState',side||'DesignState2'] LOOP
   placement:=item->key;
   IF placement IS NOT NULL AND placement<>'null'::jsonb THEN
    IF jsonb_typeof(placement)<>'object' OR NOT(placement ?& ARRAY['x','y','scale','rotate']) THEN RAISE EXCEPTION 'Invalid placement'; END IF;
    FOR layer IN SELECT value FROM jsonb_each(placement) LOOP
     IF jsonb_typeof(layer)<>'number' OR layer::text IN ('NaN','Infinity','-Infinity') THEN RAISE EXCEPTION 'Invalid placement number'; END IF;
    END LOOP;
    IF (placement->>'x')::numeric NOT BETWEEN -200 AND 300 OR (placement->>'y')::numeric NOT BETWEEN -200 AND 300 OR (placement->>'scale')::numeric NOT BETWEEN 0.01 AND 20 OR (placement->>'rotate')::numeric NOT BETWEEN -3600 AND 3600 THEN RAISE EXCEPTION 'Placement out of range'; END IF;
   END IF;
  END LOOP;
  IF jsonb_typeof(item->(side||'Logos')) IS DISTINCT FROM 'array' OR jsonb_array_length(item->(side||'Logos'))>20 THEN RAISE EXCEPTION 'Invalid logos'; END IF;
  FOR layer IN SELECT value FROM jsonb_array_elements(item->(side||'Logos')) LOOP
   IF jsonb_typeof(layer)<>'object' OR coalesce(layer->>'assetId','') !~ '^[a-f0-9-]{36}$' OR layer ?| ARRAY['url','originalUrl'] THEN RAISE EXCEPTION 'Verified asset reference required'; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.lm_verified_assets WHERE id=(layer->>'assetId')::uuid AND owner_id=auth.uid() AND status='verified' AND sha256=layer->>'sha256' AND mime_type=layer->>'mimeType') THEN RAISE EXCEPTION 'Asset unavailable to caller'; END IF;
   placement:=layer->'state';
   IF jsonb_typeof(placement) IS DISTINCT FROM 'object' OR NOT(placement ?& ARRAY['x','y','scale','rotate']) THEN RAISE EXCEPTION 'Invalid logo placement'; END IF;
   IF jsonb_typeof(placement->'x') IS DISTINCT FROM 'number' OR jsonb_typeof(placement->'y') IS DISTINCT FROM 'number' OR jsonb_typeof(placement->'scale') IS DISTINCT FROM 'number' OR jsonb_typeof(placement->'rotate') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid logo placement number'; END IF;
   IF (placement->>'x')::numeric NOT BETWEEN -200 AND 300 OR (placement->>'y')::numeric NOT BETWEEN -200 AND 300 OR (placement->>'scale')::numeric NOT BETWEEN 0.01 AND 20 OR (placement->>'rotate')::numeric NOT BETWEEN -3600 AND 3600 THEN RAISE EXCEPTION 'Logo placement out of range'; END IF;
  END LOOP;
 END LOOP;
END;$$;
CREATE OR REPLACE FUNCTION public.lm_submit_order(payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
 uid uuid:=auth.uid(); rid text:=payload->>'requestId'; receipt jsonb; prior_payload jsonb; item jsonb; product_row public.lm_products; pricing jsonb; config jsonb; customer jsonb:=payload->'customer';
 items jsonb:='[]'; colors jsonb; color jsonb; coupon jsonb; coupons jsonb; coupon_code text:=upper(trim(coalesce(payload->>'couponCode','')));
 qty integer; idx integer; stock integer; unit numeric; subtotal numeric:=0; total numeric; discount numeric:=0; method text:=payload->>'paymentMethod'; oid text; stamp text:=to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
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
 IF coalesce((payload->>'pointsRedeemed')::numeric,0)<>0 THEN RAISE EXCEPTION 'Points require a verified ledger'; END IF;
 IF coalesce(trim(customer->>'name'),'')='' OR coalesce(trim(customer->>'phone'),'')='' OR length(customer->>'name')>160 OR length(customer->>'phone')>40 OR length(coalesce(customer->>'email',''))>254 THEN RAISE EXCEPTION 'Invalid customer'; END IF;
 IF jsonb_typeof(payload->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'items') NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Invalid items'; END IF;
 IF coalesce(payload->>'deliveryMethod','RECOLECCIÓN_TIENDA')<>'RECOLECCIÓN_TIENDA' THEN RAISE EXCEPTION 'Shipping quote required'; END IF;
 -- Stable lock order serializes stock, coupon and pricing changes.
 SELECT data INTO config FROM public.lm_store_private WHERE id='main' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Store configuration required'; END IF;
 SELECT data INTO pricing FROM public.lm_pricing WHERE id='main' FOR SHARE;
 IF NOT FOUND OR NOT(pricing ?& ARRAY['baseEngravingPrice','extraSidePrice','logoSurcharge']) THEN RAISE EXCEPTION 'Pricing required'; END IF;
 IF jsonb_typeof(pricing->'baseEngravingPrice') IS DISTINCT FROM 'number' OR jsonb_typeof(pricing->'extraSidePrice') IS DISTINCT FROM 'number' OR jsonb_typeof(pricing->'logoSurcharge') IS DISTINCT FROM 'number' THEN RAISE EXCEPTION 'Invalid price types'; END IF;
 IF (pricing->>'baseEngravingPrice')::numeric<0 OR (pricing->>'extraSidePrice')::numeric<0 OR (pricing->>'logoSurcharge')::numeric<0 THEN RAISE EXCEPTION 'Invalid pricing'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(payload->'items') LOOP
   qty:=(item->>'quantity')::integer;
   IF qty IS NULL OR qty<1 OR qty>1000 OR qty::text<>item->>'quantity' THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
   IF octet_length(item::text)>5000000 THEN RAISE EXCEPTION 'Design too large'; END IF;
   IF coalesce((item->>'isClientItem')::boolean,false) THEN RAISE EXCEPTION 'Own item requires workshop review'; END IF;
   SELECT * INTO product_row FROM public.lm_products WHERE id=item->>'productId' FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Product unavailable'; END IF;
   IF (SELECT count(*) FROM jsonb_array_elements(product_row.data->'colors') WHERE value->>'name'=item->>'colorName')<>1 THEN RAISE EXCEPTION 'Ambiguous color'; END IF;
   SELECT value,ordinality::integer-1 INTO color,idx FROM jsonb_array_elements(product_row.data->'colors') WITH ORDINALITY WHERE value->>'name'=item->>'colorName';
   IF color IS NULL THEN RAISE EXCEPTION 'Color unavailable'; END IF;
   stock:=(color->>'stock')::integer;
   IF stock IS NULL OR stock<qty THEN RAISE EXCEPTION 'Insufficient stock'; END IF;
   IF jsonb_typeof(item->'frontLogos') IS DISTINCT FROM 'array' OR jsonb_typeof(item->'backLogos') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid design layers'; END IF;
   IF (coalesce(item->>'frontText','')<>'' AND NOT EXISTS(SELECT 1 FROM public.lm_fonts WHERE data->>'id'=item->>'frontFontId' AND coalesce(data->>'active','true')='true')) OR
      (coalesce(item->>'backText','')<>'' AND NOT EXISTS(SELECT 1 FROM public.lm_fonts WHERE data->>'id'=item->>'backFontId' AND coalesce(data->>'active','true')='true')) THEN RAISE EXCEPTION 'Selected font unavailable'; END IF;
   IF jsonb_array_length(item->'frontLogos')>20 OR jsonb_array_length(item->'backLogos')>20 OR length(coalesce(item->>'frontText',''))>2000 OR length(coalesce(item->>'backText',''))>2000 THEN RAISE EXCEPTION 'Invalid design size'; END IF;
   item:=public.lm_checkout_asset_item(item);
   PERFORM public.lm_validate_design(item);
   unit:=(product_row.data->>'price')::numeric;
   IF unit IS NULL OR unit::text IN ('NaN','Infinity','-Infinity') OR unit<0 THEN RAISE EXCEPTION 'Invalid product price'; END IF;
   IF coalesce(item->>'frontText','')<>'' OR coalesce(item->>'frontText2','')<>'' OR jsonb_array_length(item->'frontLogos')>0 THEN unit:=unit+(pricing->>'baseEngravingPrice')::numeric; END IF;
   IF coalesce(item->>'backText','')<>'' OR coalesce(item->>'backText2','')<>'' OR jsonb_array_length(item->'backLogos')>0 THEN unit:=unit+(pricing->>'extraSidePrice')::numeric; END IF;
   unit:=round(unit+(jsonb_array_length(item->'frontLogos')+jsonb_array_length(item->'backLogos'))*(pricing->>'logoSurcharge')::numeric,2);
   subtotal:=subtotal+unit*qty;
   items:=items||jsonb_build_array(public.lm_order_item(item)||jsonb_build_object('unitPrice',unit,'totalPrice',unit*qty));
   colors:=jsonb_set(product_row.data->'colors',ARRAY[idx::text,'stock'],to_jsonb(stock-qty));
   UPDATE public.lm_products SET revision=revision+1,data=jsonb_set(data,'{colors}',colors),updated_at=now() WHERE id=product_row.id;
 END LOOP;
 IF coupon_code<>'' THEN
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
 IF payload->>'expectedTotal' IS NULL OR total<>(payload->>'expectedTotal')::numeric THEN RAISE EXCEPTION 'Price changed. Review total before retrying'; END IF;
 LOOP oid:='LM-'||nextval('public.lm_order_number')::text; EXIT WHEN NOT EXISTS(SELECT 1 FROM public.lm_orders WHERE id=oid); END LOOP;
 INSERT INTO public.lm_orders(id,revision,data) VALUES(oid,1,jsonb_build_object('id',oid,'userId',uid,'customerName',customer->>'name','customerPhone',customer->>'phone','customerEmail',customer->>'email','items',items,'total',total,'paymentStatus','PENDIENTE','paymentMethod',method,'amountPaid',0,'pointsRedeemed',0,'pointsEarned',0,'couponUsed',nullif(coupon_code,''),'discountAmount',round(subtotal-total,2),'status','RECIBIDO','deliveryMethod','RECOLECCIÓN_TIENDA','createdAt',stamp,'history',jsonb_build_array(jsonb_build_object('timestamp',stamp,'status','RECIBIDO','operator','CUSTOMER'))));
 receipt:=jsonb_build_object('requestId',rid,'orderId',oid,'receivedAt',stamp,'paymentStatus','PENDIENTE','total',total);
 INSERT INTO public.lm_checkout_requests VALUES(uid,rid,payload,receipt);
 RETURN receipt;
END;$$;
REVOKE ALL ON FUNCTION public.lm_submit_order(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lm_submit_order(jsonb) TO authenticated;
COMMIT;
