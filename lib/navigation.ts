import {
  BarChart3,
  Contact,
  Home,
  Library,
  ListChecks,
  Megaphone,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Início", href: "/inicio", icon: Home },
  { label: "Operação", href: "/operacao", icon: ListChecks },
  { label: "Base de Leads", href: "/leads", icon: Users },
  { label: "Campanhas", href: "/campanhas", icon: Megaphone },
  { label: "Contatos", href: "/contatos", icon: Contact },
  { label: "Central de Conteúdo", href: "/biblioteca", icon: Library },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Configurações", href: "/configuracoes", icon: Settings },
];

export function labelForPath(pathname: string): string {
  const item = NAV_ITEMS.find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return item?.label ?? "Central de Prospecção";
}
