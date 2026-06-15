import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <Topbar userEmail={user?.email ?? null} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
