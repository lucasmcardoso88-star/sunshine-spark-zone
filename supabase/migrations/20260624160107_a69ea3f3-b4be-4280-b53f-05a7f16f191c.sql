
-- Lock down SECURITY DEFINER functions exposed via the public schema.
-- Trigger functions must never be callable directly by API roles.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

-- has_role and user_has_company_access are used inside RLS policies on
-- authenticated queries. Revoke from PUBLIC/anon; keep EXECUTE for authenticated
-- so RLS policies that reference them continue to evaluate.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.user_has_company_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_company_access(uuid, uuid) TO authenticated;
