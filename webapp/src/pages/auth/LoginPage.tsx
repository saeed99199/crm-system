import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "فشل تسجيل الدخول. يرجى التحقق من البيانات.");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Login Card */}
        <div className="glass rounded-2xl p-8 shadow-2xl border border-border/50">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <img
              src="https://ssffc.com.sa/wp-content/uploads/2024/12/logo-2.png"
              alt="الحلول الذكية للاستشارات المالية"
              className="w-20 h-20 mx-auto mb-4 object-contain"
            />
            <h1 className="text-2xl font-bold text-foreground mb-1">الحلول الذكية</h1>
            <p className="text-muted-foreground text-sm">للاستشارات المالية</p>
          </div>

          {/* Welcome message */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">مرحباً بك</h2>
            <p className="text-muted-foreground text-sm">قم بتسجيل الدخول للوصول إلى لوحة التحكم</p>
          </div>

          {/* Error Message */}
          {error ? (
            <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm text-center">
              {error}
            </div>
          ) : null}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">
                البريد الإلكتروني
              </Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                  required
                  disabled={isLoading}
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">
                كلمة المرور
              </Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10 pl-12 h-12 bg-secondary/50 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-foreground placeholder:text-muted-foreground"
                  required
                  disabled={isLoading}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20 transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-muted-foreground text-xs mt-6">
          جميع الحقوق محفوظة {new Date().getFullYear()} - الحلول الذكية للاستشارات المالية
        </p>
      </div>
    </div>
  );
}
