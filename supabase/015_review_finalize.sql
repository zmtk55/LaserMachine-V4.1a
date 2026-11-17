BEGIN;
CREATE FUNCTION public.lm_finalize_order_review(order_id text,confirmed_total numeric,review_note text) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE row public.lm_orders;item jsonb;product public.lm_products;color jsonb;idx integer;qty integer;stamp text:=to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
BEGIN
 IF NOT public.lm_is_admin() THEN RAISE EXCEPTION 'Admin review required';END IF;
 IF confirmed_total IS NULL OR confirmed_total<0 OR confirmed_total::text IN ('NaN','Infinity','-Infinity') OR round(confirmed_total,2)<>confirmed_total OR length(trim(coalesce(review_note,''))) NOT BETWEEN 3 AND 2000 THEN RAISE EXCEPTION 'Explicit total and review note required';END IF;
 SELECT * INTO row FROM public.lm_orders WHERE id=order_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Order unavailable';END IF;
 IF NOT coalesce((row.data->>'reviewRequired')::boolean,false) THEN RAISE EXCEPTION 'Not a review request';END IF;
 IF coalesce((row.data->>'totalConfirmed')::boolean,false) THEN
  IF (row.data->>'total')::numeric=confirmed_total AND row.data->>'reviewNote'=review_note THEN RETURN row.data;END IF;
  RAISE EXCEPTION 'Review already finalized differently';
 END IF;
 IF row.data->>'paymentStatus'<>'PENDIENTE' OR coalesce((row.data->>'amountPaid')::numeric,0)<>0 THEN RAISE EXCEPTION 'Review requires unpaid request';END IF;
 -- Manual review does not redeem requested points or consume a personal coupon.
 -- Total and explanation are explicitly entered by the operator, not inferred.
 IF NOT coalesce((row.data->>'stockReserved')::boolean,false) THEN
  FOR item IN SELECT value FROM jsonb_array_elements(row.data->'items') ORDER BY value->>'productId' LOOP
   IF coalesce((item->>'isClientItem')::boolean,false) THEN CONTINUE;END IF;
   SELECT * INTO product FROM public.lm_products WHERE id=item->>'productId' FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'Product unavailable';END IF;
   SELECT value,ordinality::integer-1 INTO color,idx FROM jsonb_array_elements(product.data->'colors') WITH ORDINALITY WHERE value->>'name'=item->>'colorName';
   qty:=(item->>'quantity')::integer;
   IF color IS NULL OR qty<1 OR coalesce((color->>'stock')::integer,0)<qty THEN RAISE EXCEPTION 'Insufficient stock for reviewed order';END IF;
   UPDATE public.lm_products SET revision=revision+1,data=jsonb_set(data,ARRAY['colors',idx::text,'stock'],to_jsonb((color->>'stock')::integer-qty)),updated_at=now() WHERE id=product.id;
  END LOOP;
 END IF;
 row.data:=row.data||jsonb_build_object('total',confirmed_total,'totalConfirmed',true,'stockReserved',true,'reviewNote',review_note,'reviewedBy',auth.uid(),'reviewedAt',stamp);
 row.data:=jsonb_set(row.data,'{history}',coalesce(row.data->'history','[]')||jsonb_build_array(jsonb_build_object('timestamp',stamp,'status',row.data->>'status','operator','ADMIN_REVIEW')));
 UPDATE public.lm_orders SET data=row.data,revision=revision+1,updated_at=now() WHERE id=order_id RETURNING data INTO row.data;
 RETURN row.data;
END;$$;
REVOKE ALL ON FUNCTION public.lm_finalize_order_review(text,numeric,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.lm_finalize_order_review(text,numeric,text) TO authenticated;
COMMIT;
