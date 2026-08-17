ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS sub_section text,
  ADD COLUMN IF NOT EXISTS national_id text,
  ADD COLUMN IF NOT EXISTS category text;

CREATE UNIQUE INDEX IF NOT EXISTS employees_code_unique ON public.employees(code);
CREATE INDEX IF NOT EXISTS employees_name_idx ON public.employees(name);
CREATE INDEX IF NOT EXISTS employees_job_title_idx ON public.employees(job_title);