-- Enable RLS on storage.buckets and storage.objects (usually enabled by default)

-- 1. Allow authenticated users (Teachers) to upload to 'assessments' bucket
create policy "Allow Authenticated Uploads"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'assessments' );

-- 2. Allow authenticated users to viewing files (already Public, but good to have)
create policy "Allow Authenticated Select"
on storage.objects for select
to authenticated
using ( bucket_id = 'assessments' );

-- 3. Allow users to update/delete their own files (Optional, assuming path contains user ID or similar, but for now open to auth)
-- For now, just Insert and Select is enough for the feature.
