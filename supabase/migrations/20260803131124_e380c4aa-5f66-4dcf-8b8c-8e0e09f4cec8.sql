CREATE TABLE public.convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  email text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.convites TO authenticated;
GRANT ALL ON public.convites TO service_role;

ALTER TABLE public.convites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view invites" ON public.convites
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create invites" ON public.convites
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());

CREATE TRIGGER trg_convites_updated BEFORE UPDATE ON public.convites
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bloqueia cadastro sem convite válido e consome o convite
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_company_id uuid;
  v_full_name text;
  v_token text;
  v_invite public.convites;
BEGIN
  v_token := NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'invite_token', '')), '');

  IF v_token IS NULL THEN
    RAISE EXCEPTION 'Cadastro permitido somente por link de convite valido';
  END IF;

  SELECT * INTO v_invite FROM public.convites
  WHERE token = v_token FOR UPDATE;

  IF v_invite.id IS NULL OR v_invite.used_at IS NOT NULL OR v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Convite invalido, ja utilizado ou expirado';
  END IF;

  IF v_invite.email IS NOT NULL AND lower(v_invite.email) <> lower(NEW.email) THEN
    RAISE EXCEPTION 'Este convite e restrito a outro e-mail';
  END IF;

  UPDATE public.convites
  SET used_at = now(), used_by = NEW.id
  WHERE id = v_invite.id;

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

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Validação pública (somente diz se o token serve), sem expor dados
CREATE OR REPLACE FUNCTION public.invite_is_valid(_token text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.convites
    WHERE token = _token AND used_at IS NULL AND expires_at > now()
  )
$function$;

REVOKE ALL ON FUNCTION public.invite_is_valid(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.invite_is_valid(text) TO anon, authenticated;