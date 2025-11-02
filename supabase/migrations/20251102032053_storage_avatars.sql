-- 1) Создаём bucket `avatars` (публичный) — идемпотентно
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'avatars',
      'avatars',
      true,                                   -- публичный: нужен getPublicUrl + внешняя раздача
      5*1024*1024,                            -- лимит 5MB (можно поменять)
      ARRAY['image/jpeg','image/png','image/webp']
    );
  ELSE
    -- Если bucket уже есть, просто синхронизируем ключевые поля (безопасно)
    UPDATE storage.buckets
       SET public = true,
           file_size_limit = COALESCE(file_size_limit, 5*1024*1024),
           allowed_mime_types = COALESCE(allowed_mime_types, ARRAY['image/jpeg','image/png','image/webp'])
     WHERE id = 'avatars';
  END IF;
END
$$;

-- 2) Убедимся, что RLS включён на таблице объектов (обычно уже включён в Supabase)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3) Политики для bucket `avatars`

-- 3.1) Публичное чтение (и anon, и authenticated могут читать из avatars)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'storage' AND tablename = 'objects'
       AND policyname = 'avatars_public_read'
  ) THEN
    CREATE POLICY "avatars_public_read"
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'avatars');
  END IF;
END
$$;

-- 3.2) Загрузка только в свою папку: avatars/users/{auth.uid()}/...
-- Разрешаем INSERT аутентифицированным, причём путь должен начинаться с users/<uid>/
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'storage' AND tablename = 'objects'
       AND policyname = 'avatars_user_insert_own_folder'
  ) THEN
    CREATE POLICY "avatars_user_insert_own_folder"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'avatars'
        AND name LIKE ('users/' || auth.uid()::text || '/%')
      );
  END IF;
END
$$;

-- 3.3) Обновление своих файлов в своей папке
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'storage' AND tablename = 'objects'
       AND policyname = 'avatars_user_update_own'
  ) THEN
    CREATE POLICY "avatars_user_update_own"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'avatars'
        AND name LIKE ('users/' || auth.uid()::text || '/%')
      )
      WITH CHECK (
        bucket_id = 'avatars'
        AND name LIKE ('users/' || auth.uid()::text || '/%')
      );
  END IF;
END
$$;

-- 3.4) Удаление своих файлов в своей папке
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'storage' AND tablename = 'objects'
       AND policyname = 'avatars_user_delete_own'
  ) THEN
    CREATE POLICY "avatars_user_delete_own"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'avatars'
        AND name LIKE ('users/' || auth.uid()::text || '/%')
      );
  END IF;
END
$$;

-- (Не меняем GRANT'ы: у Supabase они уже проставлены для anon/authenticated на storage.objects.)
