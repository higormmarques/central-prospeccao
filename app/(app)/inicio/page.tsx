import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { Greeting } from "./greeting";

export default function InicioPage() {
  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs current="Início" />
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Central de Prospecção</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-5 w-64" />}>
            <Greeting />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
