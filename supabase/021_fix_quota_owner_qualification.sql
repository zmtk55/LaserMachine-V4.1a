DO $fix$ DECLARE d text; BEGIN
 IF (SELECT md5(prosrc) FROM pg_proc WHERE oid='lm_manage_upload_reservation(text,uuid,uuid)'::regprocedure)<>'f91952470b5d5bf66fdd2cf1d222c3f4' THEN RAISE EXCEPTION 'Unexpected quota revision';END IF;
 SELECT pg_get_functiondef('lm_manage_upload_reservation(text,uuid,uuid)'::regprocedure) INTO d;
 d:=replace(d,'owner::text','lm_manage_upload_reservation.owner::text');
 EXECUTE d;
END $fix$;
