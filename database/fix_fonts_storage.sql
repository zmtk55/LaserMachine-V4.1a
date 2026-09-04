-- Migration: extend fonts table to support custom font file uploads
-- Adds: file_data (base64 .ttf/.otf), is_custom (boolean), categories (text array)
-- Idempotent: safe to run multiple times
--
-- The base schema.sql only has: id, name, css_family, category, preview_url, is_active, created_at
-- The app (FontFormModal.handleSave) writes:
--   { id, name, cssFamily, categories[], fileData, isCustom, active }
-- Without these columns, uploads silently fail (cannot persist .ttf file)

ALTER TABLE fonts
  ADD COLUMN IF NOT EXISTS file_data TEXT,
  ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Existing RLS policy already allows public read (public_read_fonts).
-- Add public write for admin uploads (anon role).
-- This matches the pattern used for other tables in supabase_migration.sql.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fonts' AND policyname = 'public_insert_fonts'
  ) THEN
    CREATE POLICY "public_insert_fonts" ON fonts FOR INSERT TO anon, authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fonts' AND policyname = 'public_update_fonts'
  ) THEN
    CREATE POLICY "public_update_fonts" ON fonts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'fonts' AND policyname = 'public_delete_fonts'
  ) THEN
    CREATE POLICY "public_delete_fonts" ON fonts FOR DELETE TO anon, authenticated USING (true);
  END IF;
END $$;

COMMENT ON COLUMN fonts.file_data IS 'Base64 data URL of uploaded .ttf/.otf font file (data:font/ttf;base64,...)';
COMMENT ON COLUMN fonts.is_custom IS 'True if uploaded by admin (has file_data), false if system font';
COMMENT ON COLUMN fonts.categories IS 'Array of category tags: BASICAS, CURSIVA, DEPORTE, KIDS, FONTS 2026';