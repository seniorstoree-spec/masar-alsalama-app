
-- Employees
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  department TEXT,
  job_title TEXT,
  employee_type TEXT NOT NULL DEFAULT 'دائم' CHECK (employee_type IN ('دائم','يومي')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth full access employees" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Violation Types
CREATE TABLE public.violation_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.violation_types TO authenticated;
GRANT ALL ON public.violation_types TO service_role;
ALTER TABLE public.violation_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth full access violation_types" ON public.violation_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Violations
CREATE TABLE public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  violation_type_id UUID REFERENCES public.violation_types(id) ON DELETE SET NULL,
  severity TEXT NOT NULL DEFAULT 'متوسط' CHECK (severity IN ('منخفض','متوسط','عالي','حرج')),
  inspector_name TEXT,
  notes TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'مفتوحة' CHECK (status IN ('مفتوحة','مغلقة','قيد المراجعة')),
  violation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.violations TO authenticated;
GRANT ALL ON public.violations TO service_role;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth full access violations" ON public.violations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX violations_employee_idx ON public.violations(employee_id);
CREATE INDEX violations_type_idx ON public.violations(violation_type_id);
CREATE INDEX violations_date_idx ON public.violations(violation_date);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_violations_updated BEFORE UPDATE ON public.violations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed common violation types
INSERT INTO public.violation_types (name, description) VALUES
  ('عدم ارتداء القفازات','عدم ارتداء قفازات أثناء التعامل مع الغذاء'),
  ('سوء النظافة الشخصية','عدم الالتزام بمعايير النظافة'),
  ('التلوث المتبادل','نقل ملوثات بين أغذية مختلفة'),
  ('عدم ارتداء غطاء الرأس','مخالفة لوائح الزي'),
  ('تخزين غير صحيح','تخزين أغذية في درجات حرارة غير مناسبة');
