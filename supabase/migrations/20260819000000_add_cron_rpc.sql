CREATE OR REPLACE FUNCTION get_recent_violations(hours_offset int DEFAULT 48)
RETURNS SETOF public.violations
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.violations WHERE created_at >= (now() - (hours_offset || ' hours')::interval) ORDER BY created_at DESC;
$$;