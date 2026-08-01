import { createClient } from "@/lib/supabase/server";
import type { ContentType, ContentWithAuthor } from "@/types/content";

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export async function getContents(params: { type?: ContentType; q?: string }) {
  const supabase = await createClient();

  let query = supabase
    .from("content")
    .select("*, author:users!content_author_user_id_fkey(name)")
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (params.type) {
    query = query.eq("type", params.type);
  }

  if (params.q?.trim()) {
    const term = params.q.trim();
    query = query.or(`title.ilike.%${term}%,category.ilike.%${term}%,body.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const contents: ContentWithAuthor[] = (data ?? []).map((row) => ({
    ...row,
    author_name: one(row.author)?.name ?? null,
  }));

  return contents;
}
