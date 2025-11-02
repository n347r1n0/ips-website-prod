-- 20251102032053_storage_avatars.sql
-- Create public bucket "avatars" + RLS policies on storage.objects
-- No ALTER TABLE, no SET ROLE. Idempotent.

begin;

-- 1) Ensure bucket exists (public)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  null,  -- при желании поставь лимит (байты), напр. 5242880
  array['image/jpeg','image/png','image/webp']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      allowed_mime_types = coalesce(excluded.allowed_mime_types, storage.buckets.allowed_mime_types),
      file_size_limit   = coalesce(excluded.file_size_limit,   storage.buckets.file_size_limit);

-- 2) Policies on storage.objects (create-if-not-exists)

do $$
begin
  -- public read
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='avatars public read'
  ) then
    create policy "avatars public read"
      on storage.objects
      for select
      to public
      using (bucket_id = 'avatars');
  end if;

  -- authenticated insert (allow create in avatars; owner проставится триггером)
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='avatars user insert'
  ) then
    create policy "avatars user insert"
      on storage.objects
      for insert
      to authenticated
      with check (bucket_id = 'avatars');
  end if;

  -- authenticated update/delete (only owner)
  if not exists (
    select 1 from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname='avatars owner write'
  ) then
    create policy "avatars owner write"
      on storage.objects
      for all
      to authenticated
      using  (bucket_id = 'avatars' and owner = auth.uid())
      with check (bucket_id = 'avatars' and owner = auth.uid());
  end if;
end $$;

commit;
