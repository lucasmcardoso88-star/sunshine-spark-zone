
-- Catalog tables to support dashboard integration

-- categorias
CREATE TABLE IF NOT EXISTS public.categorias (
  id text PRIMARY KEY,
  nome text NOT NULL,
  tipo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read categorias" ON public.categorias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage categorias" ON public.categorias FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- centros_de_custo
CREATE TABLE IF NOT EXISTS public.centros_de_custo (
  id text PRIMARY KEY,
  nome text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.centros_de_custo TO authenticated;
GRANT ALL ON public.centros_de_custo TO service_role;
ALTER TABLE public.centros_de_custo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read centros_de_custo" ON public.centros_de_custo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage centros_de_custo" ON public.centros_de_custo FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_centros_de_custo_updated_at BEFORE UPDATE ON public.centros_de_custo FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- pessoas (clientes/fornecedores)
CREATE TABLE IF NOT EXISTS public.pessoas (
  id text PRIMARY KEY,
  nome text NOT NULL,
  cpf_cnpj text,
  email text,
  telefone text,
  tipo text, -- CUSTOMER | SUPPLIER
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pessoas TO authenticated;
GRANT ALL ON public.pessoas TO service_role;
ALTER TABLE public.pessoas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read pessoas" ON public.pessoas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage pessoas" ON public.pessoas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_pessoas_updated_at BEFORE UPDATE ON public.pessoas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- contratos
CREATE TABLE IF NOT EXISTS public.contratos (
  id text PRIMARY KEY,
  numero text,
  descricao text,
  cliente_id text REFERENCES public.pessoas(id) ON DELETE SET NULL,
  cliente_nome text,
  categoria_id text REFERENCES public.categorias(id) ON DELETE SET NULL,
  centro_custo_id text REFERENCES public.centros_de_custo(id) ON DELETE SET NULL,
  valor numeric(14,2) NOT NULL DEFAULT 0,
  data_inicio date,
  data_fim date,
  status text NOT NULL DEFAULT 'ativo',
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contratos TO authenticated;
GRANT ALL ON public.contratos TO service_role;
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read contratos" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage contratos" ON public.contratos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_contratos_updated_at BEFORE UPDATE ON public.contratos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- bem (patrimônio / bens)
CREATE TABLE IF NOT EXISTS public.bem (
  id text PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  categoria_id text REFERENCES public.categorias(id) ON DELETE SET NULL,
  centro_custo_id text REFERENCES public.centros_de_custo(id) ON DELETE SET NULL,
  valor_aquisicao numeric(14,2) NOT NULL DEFAULT 0,
  data_aquisicao date,
  status text NOT NULL DEFAULT 'ativo',
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bem TO authenticated;
GRANT ALL ON public.bem TO service_role;
ALTER TABLE public.bem ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read bem" ON public.bem FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage bem" ON public.bem FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_bem_updated_at BEFORE UPDATE ON public.bem FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.categorias;
ALTER PUBLICATION supabase_realtime ADD TABLE public.centros_de_custo;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pessoas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contratos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bem;
