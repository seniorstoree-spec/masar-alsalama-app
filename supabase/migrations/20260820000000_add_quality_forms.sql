create type public.quality_form_type as enum (
  'in_process_control',
  'daily_quality_report',
  'baking_temperature',
  'metal_detector',
  'sifting',
  'sensory_evaluation',
  'non_conforming',
  'cleaning',
  'food_safety',
  'final_release',
  'weight_monitoring',
  'additives_weights'
);

create table public.quality_forms (
  id uuid primary key default gen_random_uuid(),
  form_type public.quality_form_type not null,
  form_date date not null,
  supervisor_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table public.quality_form_records (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.quality_forms(id) on delete cascade,
  record_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.quality_forms enable row level security;
alter table public.quality_form_records enable row level security;

-- Policies for quality_forms
create policy "Allow full access to quality_forms for authenticated users"
  on public.quality_forms
  for all
  to authenticated
  using (true)
  with check (true);

-- Policies for quality_form_records
create policy "Allow full access to quality_form_records for authenticated users"
  on public.quality_form_records
  for all
  to authenticated
  using (true)
  with check (true);
