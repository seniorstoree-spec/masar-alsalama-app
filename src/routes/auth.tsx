import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ShieldCheck, Loader2, User, Wrench, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

const ADMIN_PASSWORD = "Ee1986";
const DEV_EMAIL = "developer@app.local";
const DEV_PASSWORD = "Ee1986-app-internal-secret";

async function ensureDevSession() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session) return;
  const { error } = await supabase.auth.signInWithPassword({
    email: DEV_EMAIL,
    password: DEV_PASSWORD,
  });
  if (error) {
    const { error: signUpErr } = await supabase.auth.signUp({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    });
    if (signUpErr) throw signUpErr;
    const { error: retry } = await supabase.auth.signInWithPassword({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    });
    if (retry) throw retry;
  }
}

type Mode = "choose" | "devPassword";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("choose");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unlocked = typeof window !== "undefined" && localStorage.getItem("admin_unlocked") === "1";
    if (unlocked) {
      ensureDevSession()
        .then(() => navigate({ to: "/dashboard" }))
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [navigate]);

  const enterAsUser = async () => {
    setLoading(true);
    try {
      await ensureDevSession();
      localStorage.setItem("admin_unlocked", "1");
      localStorage.setItem("app_role", "user");
      navigate({ to: "/violations" });
    } catch (err: any) {
      toast.error(err.message || "تعذّر الدخول");
      setLoading(false);
    }
  };

  const submitDev = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== ADMIN_PASSWORD) {
      toast.error("كلمة المرور غير صحيحة");
      return;
    }
    setLoading(true);
    try {
      await ensureDevSession();
      localStorage.setItem("admin_unlocked", "1");
      localStorage.setItem("app_role", "developer");
      toast.success("مرحباً بك في لوحة التحكم");
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message || "تعذّر تسجيل الدخول");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent/30 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="text-2xl">تطبيق تسجيل مخالفات العاملين</CardTitle>
          <CardDescription>
            {mode === "choose" ? "اختر طريقة الدخول" : "أدخل كلمة مرور المطوّر"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "choose" ? (
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled={loading}
                onClick={enterAsUser}
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary hover:bg-primary/5 transition disabled:opacity-50"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition">
                  {loading ? (
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  ) : (
                    <User className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div className="text-sm font-semibold">مستخدم</div>
                <div className="text-[11px] text-muted-foreground">دخول مباشر</div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setMode("devPassword")}
                className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-5 hover:border-primary hover:bg-primary/5 transition disabled:opacity-50"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition">
                  <Wrench className="w-6 h-6 text-primary" />
                </div>
                <div className="text-sm font-semibold">المطوّر</div>
                <div className="text-[11px] text-muted-foreground">يتطلب كلمة مرور</div>
              </button>
            </div>
          ) : (
            <form onSubmit={submitDev} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة مرور المطوّر</Label>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setPassword("");
                    setMode("choose");
                  }}
                  disabled={loading}
                >
                  <ArrowRight className="w-4 h-4 ml-2" />
                  رجوع
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                  دخول
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
