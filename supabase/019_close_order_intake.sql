DO $fix$
DECLARE d text;
BEGIN
IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='public.lm_submit_order(jsonb)'::regprocedure) <> '2bbef6c632aff3bbbaacc442b95363d3' THEN RAISE EXCEPTION 'Unexpected checkout revision'; END IF;
SELECT pg_get_functiondef('public.lm_submit_order(jsonb)'::regprocedure) INTO d;
d:=regexp_replace(d,E'\nBEGIN\n',E'\nBEGIN\n RAISE EXCEPTION ''LM_INTAKE_CLOSED: La recepcion de pedidos esta cerrada'';\n');
IF position('LM_INTAKE_CLOSED' in d)=0 THEN RAISE EXCEPTION 'Guard insertion failed'; END IF;
EXECUTE d;
END $fix$;
