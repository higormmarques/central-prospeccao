import Link from "next/link";
import { GlobalSearch } from "@/components/navigation/global-search";
import { NotificationsMenu } from "@/components/navigation/notifications-menu";
import { UserMenu } from "@/components/navigation/user-menu";

export function Header({
  name,
  email,
  photoUrl,
}: {
  name: string;
  email: string;
  photoUrl: string | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
      <Link href="/inicio" className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-semibold tracking-tight text-primary">Amigo</span>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          Central de Prospecção
        </span>
      </Link>
      <div className="flex flex-1 justify-center">
        <GlobalSearch />
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <NotificationsMenu />
        <UserMenu name={name} email={email} photoUrl={photoUrl} />
      </div>
    </header>
  );
}
