import { createClient } from "@/lib/supabase/server";
import type { ManagedUser, Reason, Role } from "@/types/settings";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getCurrentUserRole(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("users")
    .select("role:roles!users_role_id_fkey(name)")
    .eq("id", user.id)
    .single();

  if (error) throw error;

  return one(data?.role)?.name ?? null;
}

export async function getRoles(): Promise<Role[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("roles").select("id, name, description").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getUsers(): Promise<ManagedUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, name, email, photo_url, status, role_id, last_access_at, created_at, role:roles!users_role_id_fkey(name)",
    )
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    photo_url: row.photo_url,
    status: row.status,
    role_id: row.role_id,
    role_name: one(row.role)?.name ?? null,
    last_access_at: row.last_access_at,
    created_at: row.created_at,
  }));
}

export async function getReasons(): Promise<Reason[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reasons")
    .select("id, type, name, description, is_active")
    .order("type")
    .order("name");
  if (error) throw error;
  return data ?? [];
}
