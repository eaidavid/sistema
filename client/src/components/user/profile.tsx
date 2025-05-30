import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Shield, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const profileSchema = z.object({
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  birthDate: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(8, "Nova senha deve ter pelo menos 8 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

interface ProfileProps {
  onPageChange?: (page: string) => void;
}

export default function Profile({ onPageChange }: ProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      phone: user?.phone || "",
      whatsapp: user?.whatsapp || "",
      birthDate: user?.birthDate || "",
      city: user?.city || "",
      state: user?.state || "",
      country: user?.country || "BR",
    },
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileData) => {
      const response = await apiRequest("PUT", "/api/user/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Perfil atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil.",
        variant: "destructive",
      });
    },
  });

  const updatePassword = useMutation({
    mutationFn: async (data: PasswordData) => {
      const response = await apiRequest("PUT", "/api/user/password", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Senha atualizada com sucesso.",
      });
      passwordForm.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar senha. Verifique a senha atual.",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileData) => {
    updateProfile.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordData) => {
    updatePassword.mutate(data);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
          <p className="text-slate-400 mt-1">Gerencie suas informações pessoais e configurações</p>
        </div>
        <div className="flex items-center space-x-2">
          <User className="h-8 w-8 text-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-500" />
              Informações Pessoais
            </CardTitle>
            <CardDescription className="text-slate-400">
              Atualize seus dados de contato e localização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              {/* Read-only fields */}
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300">Nome Completo</Label>
                  <Input
                    value={user?.fullName || ""}
                    disabled
                    className="bg-slate-700 border-slate-600 text-slate-400"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-300">CPF</Label>
                  <Input
                    value={user?.cpf || ""}
                    disabled
                    className="bg-slate-700 border-slate-600 text-slate-400"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-300">Email</Label>
                  <Input
                    value={user?.email || ""}
                    disabled
                    className="bg-slate-700 border-slate-600 text-slate-400"
                  />
                </div>
              </div>

              <Separator className="bg-slate-600" />

              {/* Editable fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone" className="text-white">Telefone</Label>
                  <Input
                    {...profileForm.register("phone")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp" className="text-white">WhatsApp</Label>
                  <Input
                    {...profileForm.register("whatsapp")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div>
                  <Label htmlFor="birthDate" className="text-white">Data de Nascimento</Label>
                  <Input
                    {...profileForm.register("birthDate")}
                    type="date"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-white">Cidade</Label>
                    <Input
                      {...profileForm.register("city")}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="São Paulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-white">Estado</Label>
                    <Input
                      {...profileForm.register("state")}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="SP"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="country" className="text-white">País</Label>
                  <Input
                    {...profileForm.register("country")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Brasil"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-500" />
                Segurança
              </CardTitle>
              <CardDescription className="text-slate-400">
                Altere sua senha para manter sua conta segura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-white">Senha Atual</Label>
                  <Input
                    {...passwordForm.register("currentPassword")}
                    type="password"
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Digite sua senha atual"
                  />
                  {passwordForm.formState.errors.currentPassword && (
                    <p className="text-red-400 text-sm mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-white">Nova Senha</Label>
                  <Input
                    {...passwordForm.register("newPassword")}
                    type="password"
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Digite sua nova senha"
                  />
                  {passwordForm.formState.errors.newPassword && (
                    <p className="text-red-400 text-sm mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-white">Confirmar Nova Senha</Label>
                  <Input
                    {...passwordForm.register("confirmPassword")}
                    type="password"
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Confirme sua nova senha"
                  />
                  {passwordForm.formState.errors.confirmPassword && (
                    <p className="text-red-400 text-sm mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  disabled={updatePassword.isPending}
                >
                  {updatePassword.isPending ? "Atualizando..." : "Atualizar Senha"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-500" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Status da Conta</span>
                <span className="text-emerald-400 font-medium">Ativa</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Tipo de Conta</span>
                <span className="text-blue-400 font-medium">Afiliado</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Membro desde</span>
                <span className="text-slate-400">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>

              <Separator className="bg-slate-600" />
              
              <Button 
                variant="outline" 
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => onPageChange?.('payments')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Configurar Pagamentos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}