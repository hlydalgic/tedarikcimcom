-- Fix missing grants on category_system_filters for service_role (admin queries)

GRANT ALL ON public.category_system_filters TO service_role;

GRANT SELECT ON public.category_system_filters TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.category_system_filters TO authenticated;
