BEGIN;
CREATE TABLE public.lm_points_ledger(
 order_id text PRIMARY KEY REFERENCES public.lm_orders(id),
 owner_id uuid NOT NULL REFERENCES auth.users(id),
 points integer NOT NULL CHECK(points>=0),
 rate numeric NOT NULL CHECK(rate BETWEEN 0 AND 100),
 paid_total numeric NOT NULL CHECK(paid_total>=0),
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lm_points_ledger ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lm_points_ledger FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lm_points_ledger TO authenticated;
CREATE POLICY owner_points_read ON public.lm_points_ledger FOR SELECT TO authenticated USING(owner_id=auth.uid());
CREATE TABLE public.lm_points_events(id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,order_id text NOT NULL,owner_id uuid NOT NULL,delta integer NOT NULL,reason text NOT NULL,operator_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.lm_points_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lm_points_events FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.lm_points_events TO authenticated;
CREATE POLICY owner_points_events ON public.lm_points_events FOR SELECT TO authenticated USING(owner_id=auth.uid());
CREATE FUNCTION public.lm_credit_paid_points() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid; rate numeric; total numeric; earned integer; prior public.lm_points_ledger;
BEGIN
 IF NEW.data->>'paymentStatus'='PAGADO' THEN
  IF NOT public.lm_is_admin() THEN RAISE EXCEPTION 'Manual admin payment confirmation required';END IF;
  IF coalesce((NEW.data->>'reviewRequired')::boolean,false) AND NOT coalesce((NEW.data->>'totalConfirmed')::boolean,false) THEN RAISE EXCEPTION 'Confirm review total before marking paid';END IF;
  total:=(NEW.data->>'total')::numeric;
  IF total IS NULL OR total<0 OR coalesce((NEW.data->>'amountPaid')::numeric,-1)<>total THEN RAISE EXCEPTION 'Payment amount must match confirmed total';END IF;
  uid:=nullif(NEW.data->>'userId','')::uuid;
  IF uid IS NULL OR NOT EXISTS(SELECT 1 FROM auth.users WHERE id=uid) THEN RAISE EXCEPTION 'Authenticated customer required for points';END IF;
  SELECT (data->>'pointsPercentage')::numeric INTO rate FROM public.lm_store_private WHERE id='main';
  IF rate IS NULL OR rate NOT BETWEEN 0 AND 100 THEN RAISE EXCEPTION 'Configure points percentage before confirming payment';END IF;
  earned:=floor(total*rate/100);
  SELECT * INTO prior FROM public.lm_points_ledger WHERE order_id=NEW.id FOR UPDATE;
  INSERT INTO public.lm_points_ledger(order_id,owner_id,points,rate,paid_total) VALUES(NEW.id,uid,earned,rate,total) ON CONFLICT(order_id) DO NOTHING;
  IF EXISTS(SELECT 1 FROM public.lm_points_ledger WHERE order_id=NEW.id AND (owner_id<>uid OR paid_total<>total)) THEN RAISE EXCEPTION 'Paid points need explicit adjustment, not silent reassignment';END IF;
  IF prior.order_id IS NULL THEN
   INSERT INTO public.lm_points_events(order_id,owner_id,delta,reason,operator_id) VALUES(NEW.id,uid,earned,'PAYMENT_CONFIRMED',auth.uid());
  ELSIF prior.points=0 THEN
   earned:=floor(prior.paid_total*prior.rate/100);UPDATE public.lm_points_ledger SET points=earned WHERE order_id=NEW.id;
   INSERT INTO public.lm_points_events(order_id,owner_id,delta,reason,operator_id) VALUES(NEW.id,uid,earned,'PAYMENT_RECONFIRMED',auth.uid());
  END IF;
  SELECT points INTO earned FROM public.lm_points_ledger WHERE order_id=NEW.id;
  NEW.data:=jsonb_set(NEW.data,'{pointsEarned}',to_jsonb(earned));
 ELSE
  SELECT * INTO prior FROM public.lm_points_ledger WHERE order_id=NEW.id FOR UPDATE;
  IF prior.order_id IS NOT NULL AND prior.points<>0 THEN
   IF NOT public.lm_is_admin() THEN RAISE EXCEPTION 'Admin payment reversal required';END IF;
   UPDATE public.lm_points_ledger SET points=0 WHERE order_id=NEW.id;
   INSERT INTO public.lm_points_events(order_id,owner_id,delta,reason,operator_id) VALUES(NEW.id,prior.owner_id,-prior.points,'PAYMENT_REVERSED',auth.uid());
  END IF;
  NEW.data:=jsonb_set(NEW.data,'{pointsEarned}','0');
 END IF;
 RETURN NEW;
END;$$;
REVOKE ALL ON FUNCTION public.lm_credit_paid_points() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER lm_paid_points BEFORE INSERT OR UPDATE ON public.lm_orders FOR EACH ROW EXECUTE FUNCTION public.lm_credit_paid_points();
COMMIT;
