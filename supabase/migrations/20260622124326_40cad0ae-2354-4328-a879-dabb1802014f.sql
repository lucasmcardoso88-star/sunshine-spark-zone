
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
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1));

  IF v_is_first THEN
    INSERT INTO public.companies (name, status) VALUES ('Minha Agência', 'active') RETURNING id INTO v_company_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    SELECT id INTO v_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'viewer') ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.users_profiles (user_id, full_name, company_id)
  VALUES (NEW.id, v_full_name, v_company_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
