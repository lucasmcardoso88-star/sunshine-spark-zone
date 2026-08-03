CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
  v_full_name text;
BEGIN
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  SELECT id INTO v_company_id FROM public.companies ORDER BY created_at ASC LIMIT 1;

  IF v_company_id IS NULL THEN
    INSERT INTO public.companies (name, status)
    VALUES ('Minha Agência', 'active')
    RETURNING id INTO v_company_id;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.users_profiles (user_id, full_name, company_id, role)
  VALUES (NEW.id, v_full_name, v_company_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      role = 'admin',
      company_id = COALESCE(public.users_profiles.company_id, EXCLUDED.company_id),
      updated_at = now();

  RETURN NEW;
END;
$function$;