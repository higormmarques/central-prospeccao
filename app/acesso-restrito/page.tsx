import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";

export default function AcessoRestritoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Acesso ainda não liberado</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>
            Sua conta Google foi reconhecida, mas ainda não está autorizada a
            usar a Central de Prospecção. Fale com o administrador para
            liberar o acesso.
          </p>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
