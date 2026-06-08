/**
 * Untyped Supabase client for tables not yet in generated types.
 * Use `db.from("table_name")` instead of `supabase.from(...)` to bypass TS errors.
 */
import { supabase } from "./client";

export const db = supabase as any;
