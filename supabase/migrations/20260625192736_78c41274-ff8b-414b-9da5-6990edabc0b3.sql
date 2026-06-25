-- =========================================
-- DESPESAS (contas a pagar)
-- =========================================
CREATE TABLE public.despesas (
  id text PRIMARY KEY,
  descricao text,
  fornecedor text,
  categoria text,
  centro_custo text,
  valor numeric(14,2) NOT NULL DEFAULT 0,
  data_vencimento date,
  data_pagamento date,
  status text NOT NULL DEFAULT 'pending',
  conta_azul_event text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.despesas TO authenticated;
GRANT ALL ON public.despesas TO service_role;

ALTER TABLE public.despesas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view despesas"
  ON public.despesas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage despesas"
  ON public.despesas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_despesas_updated_at
  BEFORE UPDATE ON public.despesas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_despesas_vencimento ON public.despesas (data_vencimento);
CREATE INDEX idx_despesas_status ON public.despesas (status);

-- =========================================
-- RECEITAS (contas a receber)
-- =========================================
CREATE TABLE public.receitas (
  id text PRIMARY KEY,
  descricao text,
  cliente text,
  categoria text,
  centro_custo text,
  valor numeric(14,2) NOT NULL DEFAULT 0,
  data_vencimento date,
  data_pagamento date,
  status text NOT NULL DEFAULT 'pending',
  conta_azul_event text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.receitas TO authenticated;
GRANT ALL ON public.receitas TO service_role;

ALTER TABLE public.receitas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view receitas"
  ON public.receitas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage receitas"
  ON public.receitas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_receitas_updated_at
  BEFORE UPDATE ON public.receitas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_receitas_vencimento ON public.receitas (data_vencimento);
CREATE INDEX idx_receitas_status ON public.receitas (status);

-- =========================================
-- VENDAS
-- =========================================
CREATE TABLE public.vendas (
  id text PRIMARY KEY,
  numero text,
  cliente text,
  descricao text,
  valor numeric(14,2) NOT NULL DEFAULT 0,
  data date,
  status text NOT NULL DEFAULT 'pending',
  conta_azul_event text,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vendas TO authenticated;
GRANT ALL ON public.vendas TO service_role;

ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view vendas"
  ON public.vendas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage vendas"
  ON public.vendas FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_vendas_updated_at
  BEFORE UPDATE ON public.vendas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_vendas_data ON public.vendas (data);

-- =========================================
-- SYNC_LOG
-- =========================================
CREATE TABLE public.sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  executado_em timestamptz NOT NULL DEFAULT now(),
  tabela text NOT NULL,
  evento text NOT NULL,
  registro_id text,
  status text NOT NULL,
  mensagem text
);

GRANT SELECT ON public.sync_log TO authenticated;
GRANT ALL ON public.sync_log TO service_role;

ALTER TABLE public.sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view sync_log"
  ON public.sync_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_sync_log_executado ON public.sync_log (executado_em DESC);

-- =========================================
-- REALTIME
-- =========================================
ALTER TABLE public.despesas REPLICA IDENTITY FULL;
ALTER TABLE public.receitas REPLICA IDENTITY FULL;
ALTER TABLE public.vendas   REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.despesas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receitas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vendas;
