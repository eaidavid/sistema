import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginData } from "@shared/schema";
import { useLogin } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChartLine, Eye, EyeOff } from "lucide-react";
import logoPath from "@assets/Afiliados Bet positivo.png";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const login = useLogin();
  const isMobile = useIsMobile();

  const form = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      usernameOrEmail: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginData) => {
    login.mutate(data, {
      onSuccess: (response) => {
        // Redireciona baseado no tipo de usuário
        if (response && response.role === "admin") {
          setLocation("/admin");
        } else {
          setLocation("/");
        }
      }
    });
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center ${isMobile ? "p-2" : "p-4"}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-600/5"></div>
      
      <Card className={`w-full ${isMobile ? "max-w-sm mx-2" : "max-w-md"} bg-slate-900/90 border-slate-700 backdrop-blur-sm`}>
        <CardHeader className="text-center space-y-4">
          <div className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} mx-auto flex items-center justify-center`}>
            <img 
              src={logoPath} 
              alt="AfiliadosBet Logo" 
              className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} object-contain`}
            />
          </div>
          <div>
            <CardTitle className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent`}>
              Bem-vindo de volta
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Entre na sua conta de afiliado
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {login.error && (
            <Alert className="mb-6 border-red-500/50 bg-red-500/10">
              <AlertDescription className="text-red-400">
                {login.error.message}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="usernameOrEmail" className="text-slate-300">
                Email ou Usuário
              </Label>
              <Input
                {...form.register("usernameOrEmail")}
                placeholder="Digite seu email ou usuário"
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500"
              />
              {form.formState.errors.usernameOrEmail && (
                <p className="text-red-400 text-sm">{form.formState.errors.usernameOrEmail.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Senha
              </Label>
              <div className="relative">
                <Input
                  {...form.register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white py-3 h-auto font-semibold"
            >
              {login.isPending ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center">
              <span className="text-slate-400">Não tem uma conta? </span>
              <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Criar conta
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
