import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "active") {
    redirect("/acesso-restrito");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-8 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Central de Prospecção</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            Olá, {profile.name}. Login e permissões (Etapa 03) publicados.
            Próxima etapa: estrutura de navegação.
          </p>
          <div>
            <LogoutButton />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
