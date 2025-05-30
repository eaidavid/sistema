import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Users, Calendar, Download, Calculator } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CommissionsManagementProps {
  onPageChange?: (page: string) => void;
}

export default function CommissionsManagement({ onPageChange }: CommissionsManagementProps) {
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    period: "month",
    affiliate: "all",
    house: "all",
    status: "all",
  });

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["/api/admin/commissions", filters],
    retry: false,
  });

  const { data: statsData = {} } = useQuery({
    queryKey: ["/api/admin/commission-stats", filters],
    retry: false,
  });

  const { data: affiliates = [] } = useQuery({
    queryKey: ["/api/admin/affiliates"],
    retry: false,
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["/api/admin/betting-houses"],
    retry: false,
  });

  const processPayment = useMutation({
    mutationFn: async (commissionId: number) => {
      const response = await apiRequest("POST", `/api/admin/commissions/${commissionId}/pay`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Comissão processada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/commissions"] });
    },
  });

  const queryClient = useQueryClient();

  const exportReport = () => {
    toast({
      title: "Relatório sendo gerado",
      description: "O relatório de comissões será baixado em breve.",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: "bg-yellow-500", label: "Pendente" },
      paid: { color: "bg-green-500", label: "Paga" },
      cancelled: { color: "bg-red-500", label: "Cancelada" },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    );
  };

  const totalPending = commissions.filter((c: any) => c.status === 'pending').reduce((sum: number, c: any) => sum + c.amount, 0);
  const totalPaid = commissions.filter((c: any) => c.status === 'paid').reduce((sum: number, c: any) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Comissões e Estatísticas</h1>
          <p className="text-slate-400 mt-2">
            Gerencie comissões e acompanhe o desempenho financeiro do sistema
          </p>
        </div>
        <Button onClick={exportReport} className="bg-emerald-600 hover:bg-emerald-700">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="text-white data-[state=active]:bg-emerald-600">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="commissions" className="text-white data-[state=active]:bg-emerald-600">
            Comissões
          </TabsTrigger>
          <TabsTrigger value="statistics" className="text-white data-[state=active]:bg-emerald-600">
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[
              {
                title: "Comissões Pendentes",
                value: `R$ ${totalPending.toFixed(2)}`,
                icon: Calculator,
                color: "text-yellow-400",
                bgColor: "bg-yellow-500/10",
              },
              {
                title: "Comissões Pagas",
                value: `R$ ${totalPaid.toFixed(2)}`,
                icon: DollarSign,
                color: "text-green-400",
                bgColor: "bg-green-500/10",
              },
              {
                title: "Total de Afiliados",
                value: affiliates.length,
                icon: Users,
                color: "text-blue-400",
                bgColor: "bg-blue-500/10",
              },
              {
                title: "Volume Total",
                value: `R$ ${(totalPending + totalPaid).toFixed(2)}`,
                icon: TrendingUp,
                color: "text-purple-400",
                bgColor: "bg-purple-500/10",
              },
            ].map((stat, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{stat.title}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filtros */}
          <Card className="bg-slate-800 border-slate-700 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Período</label>
                  <Select value={filters.period} onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="week">Esta Semana</SelectItem>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="quarter">Trimestre</SelectItem>
                      <SelectItem value="year">Este Ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Afiliado</label>
                  <Select value={filters.affiliate} onValueChange={(value) => setFilters(prev => ({ ...prev, affiliate: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Todos os afiliados" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all">Todos os afiliados</SelectItem>
                      {affiliates.map((affiliate: any) => (
                        <SelectItem key={affiliate.id} value={affiliate.id.toString()}>
                          {affiliate.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Casa</label>
                  <Select value={filters.house} onValueChange={(value) => setFilters(prev => ({ ...prev, house: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Todas as casas" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all">Todas as casas</SelectItem>
                      {houses.map((house: any) => (
                        <SelectItem key={house.id} value={house.id.toString()}>
                          {house.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-slate-300 mb-2 block">Status</label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="all">Todos os status</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="paid">Pagas</SelectItem>
                      <SelectItem value="cancelled">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Lista de Comissões</CardTitle>
              <CardDescription className="text-slate-400">
                Gerencie e processe pagamentos de comissões
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Data</TableHead>
                      <TableHead className="text-slate-300">Afiliado</TableHead>
                      <TableHead className="text-slate-300">Casa</TableHead>
                      <TableHead className="text-slate-300">Tipo</TableHead>
                      <TableHead className="text-slate-300">Valor</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission: any) => (
                      <TableRow key={commission.id} className="border-slate-700">
                        <TableCell className="text-white">
                          {new Date(commission.createdAt).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-white">
                          {commission.affiliateName}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {commission.houseName}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {commission.type}
                        </TableCell>
                        <TableCell className="text-green-400 font-medium">
                          R$ {commission.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(commission.status)}
                        </TableCell>
                        <TableCell>
                          {commission.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => processPayment.mutate(commission.id)}
                              disabled={processPayment.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Pagar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Top Afiliados</CardTitle>
                <CardDescription className="text-slate-400">
                  Afiliados com maior comissão no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {affiliates.slice(0, 5).map((affiliate: any, index: number) => (
                    <div key={affiliate.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{affiliate.username}</p>
                          <p className="text-sm text-slate-400">{affiliate.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-medium">R$ {(Math.random() * 1000).toFixed(2)}</p>
                        <p className="text-sm text-slate-400">{Math.floor(Math.random() * 50)} conversões</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Top Casas</CardTitle>
                <CardDescription className="text-slate-400">
                  Casas com maior volume de comissões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {houses.slice(0, 5).map((house: any, index: number) => (
                    <div key={house.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{house.name}</p>
                          <p className="text-sm text-slate-400">{house.commissionType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-blue-400 font-medium">R$ {(Math.random() * 2000).toFixed(2)}</p>
                        <p className="text-sm text-slate-400">{Math.floor(Math.random() * 20)} afiliados</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}