CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_id uuid;
  v_is_first boolean;
  v_full_name text;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.users_profiles) INTO v_is_first;
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  IF v_is_first THEN
    INSERT INTO public.companies (name, status)
    VALUES ('Minha Agência', 'active')
    RETURNING id INTO v_company_id;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    SELECT id INTO v_company_id
    FROM public.companies
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_company_id IS NULL THEN
      INSERT INTO public.companies (name, status)
      VALUES ('Minha Agência', 'active')
      RETURNING id INTO v_company_id;
    END IF;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'viewer')
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.users_profiles (user_id, full_name, company_id)
  VALUES (NEW.id, v_full_name, v_company_id)
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      company_id = COALESCE(public.users_profiles.company_id, EXCLUDED.company_id),
      updated_at = now();

  RETURN NEW;
END;
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.users_profiles TO authenticated;
GRANT ALL ON public.users_profiles TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;