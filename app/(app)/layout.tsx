import { redirect } from "next/navigation";
import { Sidebar } from "@/components/navigation/sidebar";
import { Header } from "@/components/navigation/header";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name, email, photo_url, status")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "active") {
    redirect("/acesso-restrito");
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-16">
        <Header name={profile.name} email={profile.email} photoUrl={profile.photo_url} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
