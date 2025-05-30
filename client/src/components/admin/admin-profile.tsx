import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Upload,
  Shield,
  Calendar,
  Key
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const profileSchema = z.object({
  fullName: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
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

interface AdminProfileProps {
  onPageChange?: (page: string) => void;
}

export default function AdminProfile({ onPageChange }: AdminProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
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
    mutationFn: async (data: ProfileData & { profileImage?: string }) => {
      const response = await apiRequest("PUT", "/api/admin/profile", data);
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
      const response = await apiRequest("PUT", "/api/admin/password", data);
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
    updateProfile.mutate({ ...data, profileImage });
  };

  const onPasswordSubmit = (data: PasswordData) => {
    updatePassword.mutate(data);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n.charAt(0)).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Meu Perfil</h1>
          <p className="text-slate-400 mt-1">Gerencie suas informações pessoais e configurações de segurança</p>
        </div>
        <div className="flex items-center space-x-2">
          <User className="h-8 w-8 text-emerald-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5 text-emerald-500" />
                Informações Pessoais
              </CardTitle>
              <CardDescription className="text-slate-400">
                Atualize seus dados pessoais de administrador
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                {/* Profile Image */}
                <div className="flex items-center space-x-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profileImage || user?.profileImageUrl} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-blue-600 text-white text-lg">
                      {user?.fullName ? getInitials(user.fullName) : "AD"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Label htmlFor="profileImage" className="text-white">Imagem de Perfil</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        id="profileImage"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('profileImage')?.click()}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar Foto
                      </Button>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">
                      JPG, PNG ou GIF até 2MB
                    </p>
                  </div>
                </div>

                <Separator className="bg-slate-600" />

                <div>
                  <Label htmlFor="fullName" className="text-white">Nome Completo</Label>
                  <Input
                    {...profileForm.register("fullName")}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Digite seu nome completo"
                  />
                  {profileForm.formState.errors.fullName && (
                    <p className="text-red-400 text-sm mt-1">{profileForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    {...profileForm.register("email")}
                    type="email"
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Digite seu email"
                  />
                  {profileForm.formState.errors.email && (
                    <p className="text-red-400 text-sm mt-1">{profileForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  disabled={updateProfile.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfile.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-red-500" />
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
                  className="w-full bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-700 hover:to-purple-700"
                  disabled={updatePassword.isPending}
                >
                  <Key className="h-4 w-4 mr-2" />
                  {updatePassword.isPending ? "Atualizando..." : "Atualizar Senha"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Account Information */}
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-500" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Usuário</span>
                <span className="text-white font-medium">{user?.username}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Tipo de Conta</span>
                <span className="text-emerald-400 font-medium">Administrador</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Status</span>
                <span className="text-green-400 font-medium">Ativo</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Membro desde</span>
                <span className="text-slate-400">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                </span>
              </div>

              <Separator className="bg-slate-600" />
              
              <div className="space-y-2">
                <h4 className="text-white font-medium">Permissões de Admin</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-300">Gerenciar Afiliados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-300">Gerenciar Casas de Apostas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-300">Visualizar Relatórios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-300">Configurações do Sistema</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Atividade Recente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">Login realizado</p>
                  <p className="text-slate-400 text-xs">Hoje, 15:30</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">Casa adicionada: Brazino</p>
                  <p className="text-slate-400 text-xs">Hoje, 15:25</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white text-sm">Configurações atualizadas</p>
                  <p className="text-slate-400 text-xs">Ontem, 10:15</p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4 border-slate-600 text-slate-300 hover:bg-slate-700"
                onClick={() => onPageChange?.('reports')}
              >
                Ver Todos os Logs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}