DO $$
DECLARE
  r RECORD;
  v_sql TEXT;
  v_admins UUID[];
BEGIN
  SELECT array_agg(user_id) INTO v_admins FROM public.user_roles WHERE role = 'admin';

  -- Bypass FK checks during the cleanup
  SET LOCAL session_replication_role = 'replica';

  -- 1) Remove rows in any public table that references auth.users for non-admin users
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS table_name, a.attname AS column_name
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
    WHERE con.contype = 'f'
      AND con.confrelid = 'auth.users'::regclass
      AND n.nspname = 'public'
  LOOP
    v_sql := format(
      'DELETE FROM %I.%I WHERE %I IS NOT NULL AND %I <> ALL($1)',
      r.schema_name, r.table_name, r.column_name, r.column_name
    );
    EXECUTE v_sql USING v_admins;
  END LOOP;

  -- 2) Delete the auth users themselves (cascades defined will fire)
  DELETE FROM auth.users WHERE id <> ALL(v_admins);

  -- 3) Sweep orphaned rows: any public table FK whose referenced row no longer exists
  --    Repeat a few passes so transitive orphans are caught.
  FOR i IN 1..5 LOOP
    FOR r IN
      SELECT
        n1.nspname AS src_schema,
        c1.relname AS src_table,
        a1.attname AS src_col,
        n2.nspname AS ref_schema,
        c2.relname AS ref_table,
        a2.attname AS ref_col
      FROM pg_constraint con
      JOIN pg_class c1 ON c1.oid = con.conrelid
      JOIN pg_namespace n1 ON n1.oid = c1.relnamespace
      JOIN pg_attribute a1 ON a1.attrelid = con.conrelid AND a1.attnum = ANY(con.conkey)
      JOIN pg_class c2 ON c2.oid = con.confrelid
      JOIN pg_namespace n2 ON n2.oid = c2.relnamespace
      JOIN pg_attribute a2 ON a2.attrelid = con.confrelid AND a2.attnum = ANY(con.confkey)
      WHERE con.contype = 'f'
        AND n1.nspname = 'public'
        AND n2.nspname IN ('public','auth')
    LOOP
      v_sql := format(
        'DELETE FROM %I.%I src WHERE src.%I IS NOT NULL AND NOT EXISTS (SELECT 1 FROM %I.%I ref WHERE ref.%I = src.%I)',
        r.src_schema, r.src_table, r.src_col,
        r.ref_schema, r.ref_table, r.ref_col, r.src_col
      );
      EXECUTE v_sql;
    END LOOP;
  END LOOP;
END $$;