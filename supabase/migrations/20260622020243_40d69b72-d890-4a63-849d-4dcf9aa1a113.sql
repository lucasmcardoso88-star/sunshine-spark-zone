
-- ============== ENUMS ==============
CREATE TYPE public.app_role AS ENUM ('admin', 'controller', 'viewer');
CREATE TYPE public.transaction_type AS ENUM ('revenue','expense','tax','transfer','financial_income','financial_expense');
CREATE TYPE public.accounting_basis AS ENUM ('cash','accrual');
CREATE TYPE public.transaction_status AS ENUM ('pending','paid','overdue','canceled');
CREATE TYPE public.alert_severity AS ENUM ('low','medium','high','critical');
CREATE TYPE public.alert_status AS ENUM ('open','in_review','resolved');
CREATE TYPE public.connection_status AS ENUM ('disconnected','connected','expired','error');
CREATE TYPE public.report_status AS ENUM ('pending','generated','sent','failed');

-- ============== updated_at trigger ==============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============== companies ==============
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============== user_roles (separate table — security) ==============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============== users_profiles ==============
CREATE TABLE public.users_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role text,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users_profiles TO authenticated;
GRANT ALL ON public.users_profiles TO service_role;
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_users_profiles_updated BEFORE UPDATE ON public.users_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "profile self read" ON public.users_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profile self upsert" ON public.users_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profile self update" ON public.users_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============== helper: user has access to company ==============
CREATE OR REPLACE FUNCTION public.user_has_company_access(_user_id uuid, _company_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id,'admin')
      OR EXISTS (SELECT 1 FROM public.users_profiles p WHERE p.user_id = _user_id AND p.company_id = _company_id);
$$;

-- companies RLS (after helper exists)
CREATE POLICY "company members read" ON public.companies
  FOR SELECT TO authenticated USING (public.user_has_company_access(auth.uid(), id));
CREATE POLICY "admin manage companies" ON public.companies
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============== conta_azul_connections ==============
-- Tokens are encrypted-at-rest fields and NEVER exposed to the client.
CREATE TABLE public.conta_azul_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  connection_status public.connection_status NOT NULL DEFAULT 'disconnected',
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- DO NOT grant SELECT on token columns to authenticated; use a view instead.
GRANT INSERT, UPDATE, DELETE ON public.conta_azul_connections TO authenticated;
GRANT ALL ON public.conta_azul_connections TO service_role;
ALTER TABLE public.conta_azul_connections ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_caz_updated BEFORE UPDATE ON public.conta_azul_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "caz admin manage" ON public.conta_azul_connections
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') AND public.user_has_company_access(auth.uid(), company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') AND public.user_has_company_access(auth.uid(), company_id));

-- Safe view: hides token columns
CREATE OR REPLACE VIEW public.conta_azul_connections_safe AS
  SELECT id, company_id, connection_status, token_expires_at, last_sync_at, created_at, updated_at
  FROM public.conta_azul_connections;
GRANT SELECT ON public.conta_azul_connections_safe TO authenticated;

-- ============== financial_transactions_raw ==============
CREATE TABLE public.financial_transactions_raw (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  external_id text,
  source text NOT NULL DEFAULT 'conta_azul',
  raw_payload jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions_raw TO authenticated;
GRANT ALL ON public.financial_transactions_raw TO service_role;
ALTER TABLE public.financial_transactions_raw ENABLE ROW LEVEL SECURITY;
CREATE POLICY "raw company access" ON public.financial_transactions_raw
  FOR SELECT TO authenticated USING (public.user_has_company_access(auth.uid(), company_id));
CREATE POLICY "raw admin write" ON public.financial_transactions_raw
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============== financial_transactions ==============
CREATE TABLE public.financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  external_id text,
  transaction_type public.transaction_type NOT NULL,
  accounting_basis public.accounting_basis NOT NULL DEFAULT 'accrual',
  description text NOT NULL,
  customer_or_supplier_name text,
  category_name text,
  cost_center_name text,
  amount numeric(14,2) NOT NULL,
  due_date date,
  payment_date date,
  competence_date date NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ft_company_competence ON public.financial_transactions(company_id, competence_date);
CREATE INDEX idx_ft_company_type ON public.financial_transactions(company_id, transaction_type);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_ft_updated BEFORE UPDATE ON public.financial_transactions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "ft company read" ON public.financial_transactions
  FOR SELECT TO authenticated USING (public.user_has_company_access(auth.uid(), company_id));
CREATE POLICY "ft controller write" ON public.financial_transactions
  FOR ALL TO authenticated
  USING ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'controller')) AND public.user_has_company_access(auth.uid(), company_id))
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'controller')) AND public.user_has_company_access(auth.uid(), company_id));

-- ============== budget_targets ==============
CREATE TABLE public.budget_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  category_name text NOT NULL,
  cost_center_name text,
  planned_revenue numeric(14,2) NOT NULL DEFAULT 0,
  planned_expense numeric(14,2) NOT NULL DEFAULT 0,
  planned_profit numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_targets TO authenticated;
GRANT ALL ON public.budget_targets TO service_role;
ALTER TABLE public.budget_targets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_bt_updated BEFORE UPDATE ON public.budget_targets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "bt company read" ON public.budget_targets
  FOR SELECT TO authenticated USING (public.user_has_company_access(auth.uid(), company_id));
CREATE POLICY "bt controller write" ON public.budget_targets
  FOR ALL TO authenticated
  USING ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'controller')) AND public.user_has_company_access(auth.uid(), company_id))
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'controller')) AND public.user_has_company_access(auth.uid(), company_id));

-- ============== kpi_snapshots ==============
CREATE TABLE public.kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  year int NOT NULL,
  month int NOT NULL CHECK (month BETWEEN 1 AND 12),
  accounting_basis public.accounting_basis NOT NULL DEFAULT 'accrual',
  gross_revenue numeric(14,2) NOT NULL DEFAULT 0,
  net_revenue numeric(14,2) NOT NULL DEFAULT 0,
  operational_costs numeric(14,2) NOT NULL DEFAULT 0,
  operational_expenses numeric(14,2) NOT NULL DEFAULT 0,
  ebitda numeric(14,2) NOT NULL DEFAULT 0,
  net_profit numeric(14,2) NOT NULL DEFAULT 0,
  cash_balance numeric(14,2) NOT NULL DEFAULT 0,
  accounts_receivable numeric(14,2) NOT NULL DEFAULT 0,
  accounts_payable numeric(14,2) NOT NULL DEFAULT 0,
  gross_margin numeric(8,4) NOT NULL DEFAULT 0,
  net_margin numeric(8,4) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kpi_snapshots TO authenticated;
GRANT ALL ON public.kpi_snapshots TO service_role;
ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_kpi_updated BEFORE UPDATE ON public.kpi_snapshots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "kpi company read" ON public.kpi_snapshots
  FOR SELECT TO authenticated USING (public.user_has_company_access(auth.uid(), company_id));
CREATE POLICY "kpi controller write" ON public.kpi_snapshots
  FOR ALL TO authenticated
  USING ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'controller')) AND public.user_has_company_access(auth.uid(), company_id))
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'controller')) AND public.user_has_company_access(auth.uid(), company_id));

-- ============== alert_rules ==============
CREATE TABLE public.alert_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  metric text NOT NULL,
  operator text NOT NULL,
  threshold_value numeric(14,2) NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'medium',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_rules TO authenticated;
GRANT ALL ON public.alert_rules TO service_role;
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_ar_updated BEFORE UPDATE ON public.alert_rules FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE POLICY "ar company read" ON public.alert_rules
  FOR SELECT TO authenticated USING (public.user_has_company_access(auth.uid(), company_id));
CREATE POLICY "ar controller write" ON public.alert_rules
  FOR ALL TO authenticated
  USING ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'controller')) AND public.user_has_company_access(auth.uid(), company_id))
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'controller')) AND public.user_has_company_access(auth.uid(), company_id));

-- ============== alert_events ==============
CREATE TABLE public.alert_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_rule_id uuid REFERENCES public.alert_rules(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  severity public.alert_severity NOT NULL DEFAULT 'medium',
  financial_impact numeric(14,2) NOT NULL DEFAULT 0,
  recommendation text,
  status public.alert_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_events TO authenticated;
GRANT ALL ON public.alert_events TO service_role;
ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ae company read" ON public.alert_events
  FOR SELECT TO authenticated USING (public.user_has_company_access(auth.uid(), company_id));
CREATE POLICY "ae controller write" ON public.alert_events
  FOR ALL TO authenticated
  USING ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'controller')) AND public.user_has_company_access(auth.uid(), company_id))
  WITH CHECK ((public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'controller')) AND public.user_has_company_access(auth.uid(), company_id));

-- ============== email_report_runs ==============
CREATE TABLE public.email_report_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  report_payload jsonb NOT NULL,
  status public.report_status NOT NULL DEFAULT 'pending',
  generated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_report_runs TO authenticated;
GRANT ALL ON public.email_report_runs TO service_role;
ALTER TABLE public.email_report_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "err company read" ON public.email_report_runs
  FOR SELECT TO authenticated USING (public.user_has_company_access(auth.uid(), company_id));
CREATE POLICY "err admin write" ON public.email_report_runs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') AND public.user_has_company_access(auth.uid(), company_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') AND public.user_has_company_access(auth.uid(), company_id));
