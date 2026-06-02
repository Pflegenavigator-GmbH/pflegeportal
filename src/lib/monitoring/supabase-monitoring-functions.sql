-- Supabase Monitoring Functions
-- Diese Funktionen müssen über die Supabase SQL Editor ausgeführt werden

-- Funktion: Datenbank-Größe abrufen
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT pg_database_size(current_database());
$$;

-- Funktion: Connection Pool Statistiken
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE(
  active_connections bigint,
  idle_connections bigint,
  max_connections bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    count(*) FILTER (WHERE state = 'active') as active_connections,
    count(*) FILTER (WHERE state = 'idle') as idle_connections,
    (SELECT setting::bigint FROM pg_settings WHERE name = 'max_connections') as max_connections
  FROM pg_stat_activity
  WHERE datname = current_database();
$$;

-- Funktion: Tabelle-Größen abrufen
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE(
  table_name text,
  size_bytes bigint,
  size_pretty text,
  row_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    c.relname::text as table_name,
    pg_relation_size(c.oid) as size_bytes,
    pg_size_pretty(pg_relation_size(c.oid)) as size_pretty,
    c.reltuples::bigint as row_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND c.relkind = 'r'
  ORDER BY pg_relation_size(c.oid) DESC;
$$;

-- Funktion: Größte Tabellen identifizieren
CREATE OR REPLACE FUNCTION get_largest_tables(limit_count int DEFAULT 10)
RETURNS TABLE(
  schema_name text,
  table_name text,
  total_size text,
  table_size text,
  index_size text,
  row_estimate bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
    pg_size_pretty(pg_relation_size(c.oid)) as table_size,
    pg_size_pretty(pg_indexes_size(c.oid)) as index_size,
    c.reltuples::bigint as row_estimate
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND c.relkind = 'r'
  ORDER BY pg_total_relation_size(c.oid) DESC
  LIMIT limit_count;
$$;

-- View: Aktuelle Nutzungs-Übersicht
CREATE OR REPLACE VIEW monitoring_usage_overview AS
SELECT 
  pg_database_size(current_database()) as database_size_bytes,
  pg_size_pretty(pg_database_size(current_database())) as database_size_pretty,
  ROUND(pg_database_size(current_database())::numeric / (500 * 1024 * 1024) * 100, 2) as database_usage_percent,
  (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as active_connections,
  (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
  (SELECT count(*) FROM auth.users) as total_auth_users,
  now() as checked_at;

-- Tabelle für Monitoring-Logs (optional, für historische Daten)
CREATE TABLE IF NOT EXISTS monitoring_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  metric_type text NOT NULL,
  metric_value numeric,
  metric_unit text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_type_time 
ON monitoring_logs(metric_type, created_at DESC);

-- Funktion: Monitoring-Log schreiben
CREATE OR REPLACE FUNCTION log_monitoring_metric(
  p_metric_type text,
  p_metric_value numeric,
  p_metric_unit text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO monitoring_logs (metric_type, metric_value, metric_unit, details)
  VALUES (p_metric_type, p_metric_value, p_metric_unit, p_details);
END;
$$;

-- Policy: Nur authentifizierte Nutzer können Logs lesen
ALTER TABLE monitoring_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON monitoring_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service role insert" ON monitoring_logs
  FOR INSERT TO service_role WITH CHECK (true);

-- Kommentare
COMMENT ON FUNCTION get_database_size() IS 'Returns the current database size in bytes';
COMMENT ON FUNCTION get_connection_stats() IS 'Returns current connection pool statistics';
COMMENT ON FUNCTION get_table_sizes() IS 'Returns sizes of all user tables';
COMMENT ON FUNCTION get_largest_tables(int) IS 'Returns the largest tables by total size';
COMMENT ON VIEW monitoring_usage_overview IS 'Quick overview of current database usage';
