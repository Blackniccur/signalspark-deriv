CREATE POLICY "Public can read settings"
ON public.app_settings
FOR SELECT
TO anon
USING (true);