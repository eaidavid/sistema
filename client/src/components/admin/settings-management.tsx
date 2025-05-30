import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Globe, 
  DollarSign, 
  Shield, 
  Palette,
  Save,
  RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const systemSettingsSchema = z.object({
  systemName: z.string().min(1, "Nome do sistema é obrigatório"),
  supportEmail: z.string().email("Email inválido"),
  apiKey: z.string().min(1, "API Key é obrigatória"),
  mainDomain: z.string().min(1, "Domínio principal é obrigatório"),
  postbackBaseUrl: z.string().url("URL deve ser válida"),
});

const commissionSettingsSchema = z.object({
  defaultRevShare: z.number().min(0).max(100),
  defaultCPA: z.number().min(0),
});

const globalSettingsSchema = z.object({
  allowMultipleAffiliations: z.boolean(),
  allowProfileEditing: z.boolean(),
  defaultTheme: z.enum(["light", "dark"]),
});

type SystemSettings = z.infer<typeof systemSettingsSchema>;
type CommissionSettings = z.infer<typeof commissionSettingsSchema>;
type GlobalSettings = z.infer<typeof globalSettingsSchema>;

interface SettingsManagementProps {
  onPageChange?: (page: string) => void;
}

export default function SettingsManagement({ onPageChange }: SettingsManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: systemSettings } = useQuery({
    queryKey: ["/api/admin/settings/system"],
    retry: false,
  });

  const { data: commissionSettings } = useQuery({
    queryKey: ["/api/admin/settings/commission"],
    retry: false,
  });

  const { data: globalSettings } = useQuery({
    queryKey: ["/api/admin/settings/global"],
    retry: false,
  });

  const systemForm = useForm<SystemSettings>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: {
      systemName: systemSettings?.systemName || "AfiliadosBet",
      supportEmail: systemSettings?.supportEmail || "suporte@afiliadosbet.com",
      apiKey: systemSettings?.apiKey || "",
      mainDomain: systemSettings?.mainDomain || "afiliadosbet.com",
      postbackBaseUrl: systemSettings?.postbackBaseUrl || "https://api.afiliadosbet.com/postback",
    },
  });

  const commissionForm = useForm<CommissionSettings>({
    resolver: zodResolver(commissionSettingsSchema),
    defaultValues: {
      defaultRevShare: commissionSettings?.defaultRevShare || 30,
      defaultCPA: commissionSettings?.defaultCPA || 50,
    },
  });

  const globalForm = useForm<GlobalSettings>({
    resolver: zodResolver(globalSettingsSchema),
    defaultValues: {
      allowMultipleAffiliations: globalSettings?.allowMultipleAffiliations || true,
      allowProfileEditing: globalSettings?.allowProfileEditing || true,
      defaultTheme: globalSettings?.defaultTheme || "dark",
    },
  });

  const updateSystemSettings = useMutation({
    mutationFn: async (data: SystemSettings) => {
      const response = await apiRequest("PUT", "/api/admin/settings/system", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Configurações do sistema atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/system"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações do sistema.",
        variant: "destructive",
      });
    },
  });

  const updateCommissionSettings = useMutation({
    mutationFn: async (data: CommissionSettings) => {
      const response = await apiRequest("PUT", "/api/admin/settings/commission", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Configurações de comissão atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/commission"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações de comissão.",
        variant: "destructive",
      });
    },
  });

  const updateGlobalSettings = useMutation({
    mutationFn: async (data: GlobalSettings) => {
      const response = await apiRequest("PUT", "/api/admin/settings/global", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Configurações globais atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings/global"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações globais.",
        variant: "destructive",
      });
    },
  });

  const generateNewApiKey = () => {
    const newApiKey = 'ak_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    systemForm.setValue('apiKey', newApiKey);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configurações</h1>
          <p className="text-slate-400 mt-1">Gerencie as configurações gerais da plataforma</p>
        </div>
        <div className="flex items-center space-x-2">
          <Settings className="h-8 w-8 text-emerald-500" />
        </div>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
          <TabsTrigger value="system" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
            Sistema
          </TabsTrigger>
          <TabsTrigger value="commission" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
            Comissões
          </TabsTrigger>
          <TabsTrigger value="global" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
            Parâmetros Globais
          </TabsTrigger>
        </TabsList>

        {/* Configurações do Sistema */}
        <TabsContent value="system">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-emerald-500" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configurações básicas da plataforma e integração
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={systemForm.handleSubmit((data) => updateSystemSettings.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="systemName" className="text-white">Nome do Sistema</Label>
                    <Input
                      {...systemForm.register("systemName")}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="AfiliadosBet"
                    />
                    {systemForm.formState.errors.systemName && (
                      <p className="text-red-400 text-sm mt-1">{systemForm.formState.errors.systemName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="supportEmail" className="text-white">Email de Suporte</Label>
                    <Input
                      {...systemForm.register("supportEmail")}
                      type="email"
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="suporte@afiliadosbet.com"
                    />
                    {systemForm.formState.errors.supportEmail && (
                      <p className="text-red-400 text-sm mt-1">{systemForm.formState.errors.supportEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="mainDomain" className="text-white">Domínio Principal</Label>
                    <Input
                      {...systemForm.register("mainDomain")}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="afiliadosbet.com"
                    />
                    {systemForm.formState.errors.mainDomain && (
                      <p className="text-red-400 text-sm mt-1">{systemForm.formState.errors.mainDomain.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="postbackBaseUrl" className="text-white">URL Base para Postbacks</Label>
                    <Input
                      {...systemForm.register("postbackBaseUrl")}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="https://api.afiliadosbet.com/postback"
                    />
                    {systemForm.formState.errors.postbackBaseUrl && (
                      <p className="text-red-400 text-sm mt-1">{systemForm.formState.errors.postbackBaseUrl.message}</p>
                    )}
                  </div>
                </div>

                <Separator className="bg-slate-600" />

                <div>
                  <Label htmlFor="apiKey" className="text-white">API Key Geral</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      {...systemForm.register("apiKey")}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Chave API para integrações"
                    />
                    <Button
                      type="button"
                      onClick={generateNewApiKey}
                      variant="outline"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Gerar Nova
                    </Button>
                  </div>
                  {systemForm.formState.errors.apiKey && (
                    <p className="text-red-400 text-sm mt-1">{systemForm.formState.errors.apiKey.message}</p>
                  )}
                  <p className="text-slate-500 text-xs mt-1">
                    Esta chave será usada para autenticar integrações externas
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  disabled={updateSystemSettings.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateSystemSettings.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações de Comissão */}
        <TabsContent value="commission">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-yellow-500" />
                Configurações de Comissão Padrão
              </CardTitle>
              <CardDescription className="text-slate-400">
                Valores padrão aplicados ao cadastrar novas casas de apostas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={commissionForm.handleSubmit((data) => updateCommissionSettings.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="defaultRevShare" className="text-white">RevShare Padrão (%)</Label>
                    <Input
                      {...commissionForm.register("defaultRevShare", { valueAsNumber: true })}
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="30"
                    />
                    {commissionForm.formState.errors.defaultRevShare && (
                      <p className="text-red-400 text-sm mt-1">{commissionForm.formState.errors.defaultRevShare.message}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      Percentual padrão de comissão por receita recorrente
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="defaultCPA" className="text-white">CPA Padrão (R$)</Label>
                    <Input
                      {...commissionForm.register("defaultCPA", { valueAsNumber: true })}
                      type="number"
                      min="0"
                      step="0.01"
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="50.00"
                    />
                    {commissionForm.formState.errors.defaultCPA && (
                      <p className="text-red-400 text-sm mt-1">{commissionForm.formState.errors.defaultCPA.message}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-1">
                      Valor fixo padrão por ação de conversão
                    </p>
                  </div>
                </div>

                <div className="bg-slate-700 p-4 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Informações sobre Comissões</h4>
                  <div className="text-sm text-slate-300 space-y-1">
                    <p>• <strong>RevShare:</strong> Comissão baseada na receita líquida gerada pelo jogador</p>
                    <p>• <strong>CPA:</strong> Comissão fixa paga por cada jogador que realiza o primeiro depósito</p>
                    <p>• Estes valores podem ser personalizados individualmente para cada casa de apostas</p>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  disabled={updateCommissionSettings.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateCommissionSettings.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parâmetros Globais */}
        <TabsContent value="global">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Parâmetros Globais
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configurações de comportamento geral da plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={globalForm.handleSubmit((data) => updateGlobalSettings.mutate(data))} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div>
                      <Label htmlFor="allowMultipleAffiliations" className="text-white font-medium">
                        Múltiplas Afiliações por Casa
                      </Label>
                      <p className="text-slate-400 text-sm">
                        Permitir que um afiliado se afilie à mesma casa múltiplas vezes
                      </p>
                    </div>
                    <Switch
                      {...globalForm.register("allowMultipleAffiliations")}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div>
                      <Label htmlFor="allowProfileEditing" className="text-white font-medium">
                        Edição de Perfil pelo Afiliado
                      </Label>
                      <p className="text-slate-400 text-sm">
                        Permitir que afiliados editem seus próprios dados de perfil
                      </p>
                    </div>
                    <Switch
                      {...globalForm.register("allowProfileEditing")}
                      className="data-[state=checked]:bg-emerald-600"
                    />
                  </div>

                  <div className="p-4 bg-slate-700 rounded-lg">
                    <Label htmlFor="defaultTheme" className="text-white font-medium">
                      Tema Padrão
                    </Label>
                    <p className="text-slate-400 text-sm mb-3">
                      Tema aplicado automaticamente para novos usuários
                    </p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          {...globalForm.register("defaultTheme")}
                          type="radio"
                          value="light"
                          className="text-emerald-600"
                        />
                        <span className="text-white">Claro</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          {...globalForm.register("defaultTheme")}
                          type="radio"
                          value="dark"
                          className="text-emerald-600"
                        />
                        <span className="text-white">Escuro</span>
                      </label>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                  disabled={updateGlobalSettings.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateGlobalSettings.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}