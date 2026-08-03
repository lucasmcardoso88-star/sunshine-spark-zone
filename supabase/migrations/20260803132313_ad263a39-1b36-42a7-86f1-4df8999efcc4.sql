GRANT SELECT, INSERT ON public.convites TO authenticated;
GRANT ALL ON public.convites TO service_role;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;