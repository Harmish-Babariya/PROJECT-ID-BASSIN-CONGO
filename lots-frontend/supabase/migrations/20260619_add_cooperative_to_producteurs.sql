-- Add a free-text "cooperative / producer association" field to producers.
-- Producers are often grouped into cooperatives; this records the name so it can
-- be shown on the producer page, in the DDS statement, and used as a map filter.
alter table public.producteurs
  add column if not exists cooperative text;
