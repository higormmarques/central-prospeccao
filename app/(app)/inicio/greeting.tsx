import { createClient } from "@/lib/supabase/server";

export async function Greeting() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user!.id)
    .single();

  return (
    <p className="text-sm text-muted-foreground">
      Olá, {profile?.name ?? "usuário"}. Estrutura de navegação (Etapa 04) publicada.
    </p>
  );
}
