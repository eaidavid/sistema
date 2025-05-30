import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Shield, 
  ShieldOff, 
  RotateCcw, 
  Trash2,
  Calendar,
  Mail,
  CreditCard,
  TrendingUp,
  MousePointer,
  UserPlus,
  DollarSign,
  BarChart3,
  Target,
  Activity,
  Clock,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  TrendingDown
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AffiliatesManagementProps {
  onPageChange?: (page: string) => void;
}

// Componente para o modal de detalhes completos do afiliado
function AffiliateDetailsModal({ affiliate, isOpen, onClose }: { 
  affiliate: any; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const { data: affiliateStats = {} } = useQuery({
    queryKey: ["/api/admin/affiliate-stats", affiliate?.id],
    enabled: !!affiliate?.id && isOpen,
  });

  const { data: affiliateConversions = [] } = useQuery({
    queryKey: ["/api/admin/affiliate-conversions", affiliate?.id],
    enabled: !!affiliate?.id && isOpen,
  });

  const { data: affiliateLinks = [] } = useQuery({
    queryKey: ["/api/affiliate-links", affiliate?.id],
    enabled: !!affiliate?.id && isOpen,
  });

  if (!affiliate) return null;

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatDate = (date: string) => 
    new Date(date).toLocaleDateString('pt-BR');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-emerald-500" />
            Relatório Detalhado - {affiliate.fullName}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Performance completa e histórico de conversões do afiliado
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-700">
            <TabsTrigger value="overview" className="text-white">Visão Geral</TabsTrigger>
            <TabsTrigger value="performance" className="text-white">Performance</TabsTrigger>
            <TabsTrigger value="conversions" className="text-white">Conversões</TabsTrigger>
            <TabsTrigger value="links" className="text-white">Links</TabsTrigger>
          </TabsList>

          {/* ABA: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informações Pessoais */}
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-400" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nome:</span>
                    <span className="text-white font-medium">{affiliate.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Usuário:</span>
                    <span className="text-white font-medium">{affiliate.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white font-medium">{affiliate.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CPF:</span>
                    <span className="text-white font-medium">{affiliate.cpf}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Telefone:</span>
                    <span className="text-white font-medium">{affiliate.phone || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cidade:</span>
                    <span className="text-white font-medium">{affiliate.city || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <Badge className={affiliate.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {affiliate.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cadastro:</span>
                    <span className="text-white font-medium">{formatDate(affiliate.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Resumo de Performance */}
              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Resumo de Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total de Cliques:</span>
                    <span className="text-white font-bold text-lg">{affiliateStats.totalClicks || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Registros:</span>
                    <span className="text-white font-bold text-lg">{affiliateStats.totalRegistrations || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Depósitos:</span>
                    <span className="text-white font-bold text-lg">{affiliateStats.totalDeposits || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Taxa de Conversão:</span>
                    <span className="text-white font-bold text-lg">{(affiliateStats.conversionRate || 0).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Comissão Total:</span>
                    <span className="text-emerald-400 font-bold text-lg">{formatCurrency(affiliateStats.totalCommission || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Links Ativos:</span>
                    <span className="text-white font-bold text-lg">{affiliateLinks.length || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ABA: Performance Detalhada */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Cliques Totais</p>
                      <p className="text-white text-2xl font-bold">{affiliateStats.totalClicks || 0}</p>
                    </div>
                    <MousePointer className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-600 to-green-700 border-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Registros</p>
                      <p className="text-white text-2xl font-bold">{affiliateStats.totalRegistrations || 0}</p>
                    </div>
                    <UserPlus className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Depósitos</p>
                      <p className="text-white text-2xl font-bold">{affiliateStats.totalDeposits || 0}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-600 to-emerald-700 border-emerald-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">Comissão</p>
                      <p className="text-white text-2xl font-bold">{formatCurrency(affiliateStats.totalCommission || 0)}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-emerald-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Métricas Avançadas */}
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-400" />
                  Métricas Avançadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-600 rounded-lg">
                    <p className="text-slate-400 text-sm">Taxa de Conversão</p>
                    <p className="text-white text-xl font-bold">{(affiliateStats.conversionRate || 0).toFixed(2)}%</p>
                    <div className="flex items-center justify-center mt-2">
                      {(affiliateStats.conversionRate || 0) > 5 ? (
                        <ArrowUpRight className="h-4 w-4 text-green-400" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-600 rounded-lg">
                    <p className="text-slate-400 text-sm">Valor Médio por Depósito</p>
                    <p className="text-white text-xl font-bold">
                      {affiliateStats.totalDeposits > 0 
                        ? formatCurrency((affiliateStats.totalCommission || 0) / affiliateStats.totalDeposits)
                        : 'R$ 0,00'
                      }
                    </p>
                  </div>
                  
                  <div className="text-center p-4 bg-slate-600 rounded-lg">
                    <p className="text-slate-400 text-sm">Eficiência</p>
                    <p className="text-white text-xl font-bold">
                      {affiliateStats.totalClicks > 0 
                        ? ((affiliateStats.totalDeposits || 0) / affiliateStats.totalClicks * 100).toFixed(1)
                        : '0.0'
                      }%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: Histórico de Conversões */}
          <TabsContent value="conversions" className="space-y-6">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Histórico de Conversões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-600">
                        <TableHead className="text-slate-300">Data</TableHead>
                        <TableHead className="text-slate-300">Tipo</TableHead>
                        <TableHead className="text-slate-300">Casa</TableHead>
                        <TableHead className="text-slate-300">Valor</TableHead>
                        <TableHead className="text-slate-300">Comissão</TableHead>
                        <TableHead className="text-slate-300">Cliente ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliateConversions.length > 0 ? (
                        affiliateConversions.map((conversion: any, index: number) => (
                          <TableRow key={index} className="border-slate-600">
                            <TableCell className="text-white">
                              {formatDate(conversion.convertedAt)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={
                                  conversion.type === 'click' ? 'bg-blue-100 text-blue-800' :
                                  conversion.type === 'registration' ? 'bg-green-100 text-green-800' :
                                  conversion.type === 'first_deposit' ? 'bg-purple-100 text-purple-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }
                              >
                                {conversion.type === 'click' ? 'Clique' :
                                 conversion.type === 'registration' ? 'Registro' :
                                 conversion.type === 'first_deposit' ? 'Primeiro Depósito' :
                                 'Depósito'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-white">{conversion.houseName || 'N/A'}</TableCell>
                            <TableCell className="text-white">
                              {conversion.amount ? formatCurrency(parseFloat(conversion.amount)) : 'R$ 0,00'}
                            </TableCell>
                            <TableCell className="text-emerald-400 font-bold">
                              {conversion.commission ? formatCurrency(parseFloat(conversion.commission)) : 'R$ 0,00'}
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {conversion.customerId || 'N/A'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                            Nenhuma conversão encontrada
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: Links Ativos */}
          <TabsContent value="links" className="space-y-6">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-indigo-400" />
                  Links de Afiliado Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-600">
                        <TableHead className="text-slate-300">Casa de Apostas</TableHead>
                        <TableHead className="text-slate-300">Link</TableHead>
                        <TableHead className="text-slate-300">Comissão</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Criado em</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliateLinks.length > 0 ? (
                        affiliateLinks.map((link: any, index: number) => (
                          <TableRow key={index} className="border-slate-600">
                            <TableCell className="text-white font-medium">{link.houseName}</TableCell>
                            <TableCell className="text-blue-400 font-mono text-sm">
                              {link.link ? link.link.substring(0, 50) + '...' : 'N/A'}
                            </TableCell>
                            <TableCell className="text-white">{link.commissionValue}</TableCell>
                            <TableCell>
                              <Badge className={link.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {link.isActive ? "Ativo" : "Inativo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {formatDate(link.createdAt)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                            Nenhum link encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export default function AffiliatesManagement({ onPageChange }: AffiliatesManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const { data: affiliates = [], isLoading: affiliatesLoading, error: affiliatesError } = useQuery({
    queryKey: ["/api/admin/affiliates"],
    retry: false,
  });

  // Debug: Verificar se os dados estão chegando
  console.log("Affiliates data:", affiliates);
  console.log("Affiliates loading:", affiliatesLoading);
  console.log("Affiliates error:", affiliatesError);

  const toggleAffiliateStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PUT", `/api/admin/affiliates/${id}/status`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Status do afiliado atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do afiliado.",
        variant: "destructive",
      });
    },
  });

  const resetPassword = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/admin/affiliates/${id}/reset-password`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Senha resetada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao resetar senha.",
        variant: "destructive",
      });
    },
  });

  // Funcionalidade de bloqueio/desbloqueio (afeta painel do usuário)
  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${id}/status`, { isActive });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do usuário.",
        variant: "destructive",
      });
    },
  });

  const deleteAffiliate = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/admin/affiliates/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Afiliado excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/affiliates"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir afiliado.",
        variant: "destructive",
      });
    },
  });

  const filteredAffiliates = affiliates.filter((affiliate: any) => {
    const fullName = affiliate.fullName || affiliate.full_name || '';
    const username = affiliate.username || '';
    const email = affiliate.email || '';
    
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && (affiliate.isActive || affiliate.is_active)) ||
                         (statusFilter === "inactive" && !(affiliate.isActive || affiliate.is_active));
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Ativo</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Inativo</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gerenciar Afiliados</h1>
          <p className="text-slate-400 mt-1">Administre todos os afiliados da plataforma</p>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="h-8 w-8 text-emerald-500" />
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nome, usuário ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Affiliates Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500" />
            Afiliados ({filteredAffiliates.length})
          </CardTitle>
          <CardDescription className="text-slate-400">
            Lista completa de afiliados cadastrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Usuário</TableHead>
                  <TableHead className="text-slate-300">Nome Completo</TableHead>
                  <TableHead className="text-slate-300">Email</TableHead>
                  <TableHead className="text-slate-300">CPF</TableHead>
                  <TableHead className="text-slate-300">Cadastro</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Casas</TableHead>
                  <TableHead className="text-slate-300">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAffiliates.map((affiliate: any) => (
                  <TableRow key={affiliate.id} className="border-slate-700">
                    <TableCell className="text-white font-medium">
                      {affiliate.username}
                    </TableCell>
                    <TableCell className="text-white">
                      {affiliate.fullName || affiliate.full_name || 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {affiliate.email || 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {affiliate.cpf || 'N/A'}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {affiliate.createdAt ? new Date(affiliate.createdAt).toLocaleDateString('pt-BR') : 
                       affiliate.created_at ? new Date(affiliate.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(affiliate.isActive || affiliate.is_active)}
                    </TableCell>
                    <TableCell className="text-white">
                      {affiliate.affiliateHouses || affiliate.affiliate_links_count || 0}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedAffiliate(affiliate);
                            setIsDetailsOpen(true);
                          }}
                          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalhes
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleAffiliateStatus.mutate({ 
                            id: affiliate.id, 
                            isActive: !affiliate.isActive 
                          })}
                          className={affiliate.isActive ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"}
                        >
                          {affiliate.isActive ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetPassword.mutate(affiliate.id)}
                          className="text-yellow-400 hover:text-yellow-300"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-800 border-slate-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Confirmar Exclusão
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-400">
                                Tem certeza que deseja excluir o afiliado {affiliate.fullName}? 
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-700 text-white border-slate-600">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteAffiliate.mutate(affiliate.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes Completo */}
      <AffiliateDetailsModal 
        affiliate={selectedAffiliate}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedAffiliate(null);
        }}
      />
    </div>
  );
}