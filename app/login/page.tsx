import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next ?? "/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-2 text-center">
          <span className="text-lg font-semibold tracking-tight">Amigo</span>
          <CardTitle className="text-xl">Central de Prospecção</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <p className="text-center text-sm text-destructive">
              Não foi possível concluir o login. Tente novamente.
            </p>
          )}
          <GoogleLoginButton next={next} />
          <p className="text-center text-xs text-muted-foreground">
            Disponível apenas para usuários autorizados da Amigo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
