-- =============================================================
-- Storage: bucket privado para arquivos de obras
-- Convenção de path: {org_id}/{work_id}/{uuid}-{filename}
-- =============================================================

insert into storage.buckets (id, name, public)
values ('work-files', 'work-files', false)
on conflict (id) do nothing;

-- Acesso restrito a membros da organização dona do arquivo.
-- O primeiro segmento do path é o org_id.
create policy "work_files_select"
  on storage.objects for select
  using (
    bucket_id = 'work-files'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "work_files_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'work-files'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "work_files_update"
  on storage.objects for update
  using (
    bucket_id = 'work-files'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );

create policy "work_files_delete"
  on storage.objects for delete
  using (
    bucket_id = 'work-files'
    and public.is_org_member((storage.foldername(name))[1]::uuid)
  );
