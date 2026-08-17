
CREATE TABLE IF NOT EXISTS public.production_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_sections TO authenticated;
GRANT ALL ON public.production_sections TO service_role;

ALTER TABLE public.production_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth full access production_sections"
  ON public.production_sections FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER set_updated_at_production_sections
  BEFORE UPDATE ON public.production_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.violations ADD COLUMN IF NOT EXISTS production_section text;
