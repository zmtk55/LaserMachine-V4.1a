-- Approved private test only. Collision aborts; no browser insert/update/delete.
BEGIN;
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types) VALUES('lm-private-designs','lm-private-designs',false,5000000,ARRAY['image/svg+xml','image/png','image/jpeg','image/webp']);
-- Original and preview downloads only by exact owner verified registry reference.
CREATE POLICY lm_private_asset_read ON storage.objects FOR SELECT TO authenticated USING(bucket_id='lm-private-designs' AND EXISTS(SELECT 1 FROM public.lm_verified_assets a WHERE a.owner_id=auth.uid() AND a.status='verified' AND storage.objects.name IN(a.original_path,a.preview_path)));
COMMIT;
