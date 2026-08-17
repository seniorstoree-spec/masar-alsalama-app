import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, AlertTriangle, ListChecks, LogOut, ShieldCheck, FileBarChart2, Archive, FolderOpen, FilePlus2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const allNavItems: { to: string; label: string; icon: any; roles: string[] }[] = [
  { to: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard, roles: ["developer", "user"] },
  { to: "/new-violation", label: "تسجيل مخالفة", icon: FilePlus2, roles: ["developer", "user"] },
  { to: "/violations", label: "المخالفات", icon: AlertTriangle, roles: ["developer", "user"] },
  { to: "/violation-types", label: "أنواع المخالفات", icon: ListChecks, roles: ["developer", "user"] },
  { to: "/reports", label: "التقارير", icon: FileBarChart2, roles: ["developer", "user"] },
  { to: "/employees", label: "الموظفين", icon: Users, roles: ["developer"] },
  { to: "/archive", label: "الأرشيف", icon: Archive, roles: ["developer", "user"] },
  { to: "/section-violations", label: "مخالفات العمال بالقسم", icon: FolderOpen, roles: ["developer", "user"] },

];

function AuthedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("app_role"));
    setReady(true);
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("admin_unlocked");
    localStorage.removeItem("app_role");
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج");
    navigate({ to: "/auth" });
  };

  const roleLabel = role === "developer" ? "وضع المطوّر" : "وضع المستخدم";
  const navItems = useMemo(
    () => allNavItems.filter((i) => i.roles.includes(role === "developer" ? "developer" : "user")),
    [role],
  );

  useEffect(() => {
    if (!ready) return;
    const allowed = navItems.map((i) => i.to);
    if (!allowed.some((p) => pathname.startsWith(p))) {
      navigate({ to: role === "developer" ? "/dashboard" : "/violations" });
    }
  }, [ready, role, pathname, navigate, navItems]);




  return (
    <div className="min-h-screen flex w-full bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-l border-sidebar-border">
        <div className="p-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-bold text-sm">مخالفات العاملين</div>
            <div className="text-[11px] text-muted-foreground">{roleLabel}</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to as any}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-sidebar border-t border-sidebar-border flex">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to as any}
              className={`flex-1 flex flex-col items-center gap-1 py-2 text-[10px] ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
