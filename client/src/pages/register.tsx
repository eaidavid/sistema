import { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useRegister } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChartLine, Eye, EyeOff } from "lucide-react";
import logoPath from "@assets/Afiliados Bet positivo.png";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const register = useRegister();
  const isMobile = useIsMobile();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      cpf: "",
      birthDate: "",
      password: "",
      confirmPassword: "",
      phone: "",
      city: "",
      state: "",
      country: "BR",
    },
  });

  const onSubmit = (data: InsertUser) => {
    register.mutate(data);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center ${isMobile ? "p-2" : "p-4"}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-600/5"></div>
      
      <Card className={`w-full ${isMobile ? "max-w-sm mx-2" : "max-w-2xl"} bg-slate-900/90 border-slate-700 backdrop-blur-sm`}>
        <CardHeader className="text-center space-y-4">
          <div className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} mx-auto flex items-center justify-center`}>
            <img 
              src={logoPath} 
              alt="AfiliadosBet Logo" 
              className={`${isMobile ? "w-12 h-12" : "w-16 h-16"} object-contain`}
            />
          </div>
          <div>
            <CardTitle className={`${isMobile ? "text-xl" : "text-3xl"} font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent`}>
              AfiliadosBet
            </CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Crie sua conta e comece a ganhar como afiliado
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {register.error && (
            <Alert className="mb-6 border-red-500/50 bg-red-500/10">
              <AlertDescription className="text-red-400">
                {register.error.message}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-slate-300">
                  Usuário (SubID) <span className="text-red-400">*</span>
                </Label>
                <Input
                  {...form.register("username")}
                  placeholder="Mínimo 7 caracteres"
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500"
                />
                {form.formState.errors.username && (
                  <p className="text-red-400 text-sm">{form.formState.errors.username.message}</p>
                )}
                <p className="text-xs text-slate-400">Será usado como seu identificador único</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-slate-300">
                  Nome Completo <span className="text-red-400">*</span>
                </Label>
                <Input
                  {...form.register("fullName")}
                  placeholder="Seu nome completo"
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500"
                />
                {form.formState.errors.fullName && (
                  <p className="text-red-400 text-sm">{form.formState.errors.fullName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cpf" className="text-slate-300">
                  CPF <span className="text-red-400">*</span>
                </Label>
                <Input
                  {...form.register("cpf")}
                  placeholder="000.000.000-00"
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500"
                />
                {form.formState.errors.cpf && (
                  <p className="text-red-400 text-sm">{form.formState.errors.cpf.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-slate-300">
                  Data de Nascimento <span className="text-red-400">*</span>
                </Label>
                <Input
                  {...form.register("birthDate")}
                  type="date"
                  className="bg-slate-800 border-slate-600 text-white focus:border-emerald-500"
                />
                {form.formState.errors.birthDate && (
                  <p className="text-red-400 text-sm">{form.formState.errors.birthDate.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                {...form.register("email")}
                type="email"
                placeholder="seu@email.com"
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500"
              />
              {form.formState.errors.email && (
                <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  Senha <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    {...form.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 8 caracteres"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-300">
                  Confirmar Senha <span className="text-red-400">*</span>
                </Label>
                <div className="relative">
                  <Input
                    {...form.register("confirmPassword")}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua senha"
                    className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-red-400 text-sm">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={register.isPending}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white py-3 h-auto font-semibold"
            >
              {register.isPending ? "Criando conta..." : "Criar Conta"}
            </Button>

            <div className="text-center">
              <span className="text-slate-400">Já tem uma conta? </span>
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
                Entrar
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
