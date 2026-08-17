ALTER TABLE public.violations
  ADD COLUMN IF NOT EXISTS employee_name text,
  ADD COLUMN IF NOT EXISTS employee_code text,
  ADD COLUMN IF NOT EXISTS employee_job_title text,
  ADD COLUMN IF NOT EXISTS employee_department text;