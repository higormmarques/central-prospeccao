import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 dark:bg-black">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Central de Prospecção</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Fundação do projeto (Etapa 01) publicada. Próximas etapas: banco de
          dados, autenticação e navegação.
        </CardContent>
      </Card>
    </div>
  );
}
