import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MousePointer, 
  UserPlus, 
  DollarSign,
  Download,
  Building2,
  Calendar
} from "lucide-react";

interface ReportsManagementProps {
  onPageChange?: (page: string) => void;
}

export default function ReportsManagement({ onPageChange }: ReportsManagementProps) {
  const [selectedAffiliate, setSelectedAffiliate] = useState<string>("all");
  const [selectedHouse, setSelectedHouse] = useState<string>("all");

  const { data: generalStats } = useQuery({
    queryKey: ["/api/admin/reports/general"],
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

  const { data: affiliateReport } = useQuery({
    queryKey: ["/api/admin/reports/affiliate", selectedAffiliate],
    enabled: selectedAffiliate !== "all",
    retry: false,
  });

  const { data: houseReport } = useQuery({
    queryKey: ["/api/admin/reports/house", selectedHouse],
    enabled: selectedHouse !== "all",
    retry: false,
  });

  const exportCSV = (type: string) => {
    // Implementar exportação CSV
    console.log(`Exportando ${type} para CSV`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Relatórios</h1>
          <p className="text-slate-400 mt-1">Análise completa dos dados da plataforma</p>
        </div>
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-8 w-8 text-emerald-500" />
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-700">
          <TabsTrigger value="general" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
            Relatório Geral
          </TabsTrigger>
          <TabsTrigger value="affiliate" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
            Por Afiliado
          </TabsTrigger>
          <TabsTrigger value="house" className="text-slate-300 data-[state=active]:text-white data-[state=active]:bg-slate-700">
            Por Casa de Aposta
          </TabsTrigger>
        </TabsList>

        {/* Relatório Geral */}
        <TabsContent value="general" className="space-y-6">
          {/* Métricas Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total de Cliques</p>
                    <p className="text-2xl font-bold text-white">{generalStats?.totalClicks || 0}</p>
                    <p className="text-green-400 text-xs">+12% vs mês anterior</p>
                  </div>
                  <MousePointer className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total de Registros</p>
                    <p className="text-2xl font-bold text-white">{generalStats?.totalRegistrations || 0}</p>
                    <p className="text-green-400 text-xs">+8% vs mês anterior</p>
                  </div>
                  <UserPlus className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total de Depósitos</p>
                    <p className="text-2xl font-bold text-white">{generalStats?.totalDeposits || 0}</p>
                    <p className="text-green-400 text-xs">+15% vs mês anterior</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Receita Total</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      R$ {(Number(generalStats?.totalRevenue) || 0).toFixed(2)}
                    </p>
                    <p className="text-green-400 text-xs">+22% vs mês anterior</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Casas Mais Rentáveis */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-500" />
                Casas Mais Rentáveis
              </CardTitle>
              <CardDescription className="text-slate-400">
                Ranking das casas por receita gerada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Casa de Aposta</TableHead>
                    <TableHead className="text-slate-300">Afiliados Ativos</TableHead>
                    <TableHead className="text-slate-300">Total Cliques</TableHead>
                    <TableHead className="text-slate-300">Receita</TableHead>
                    <TableHead className="text-slate-300">Conversão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generalStats?.topHouses?.map((house: any, index: number) => (
                    <TableRow key={house.id} className="border-slate-700">
                      <TableCell className="text-white font-medium">
                        #{index + 1} {house.name}
                      </TableCell>
                      <TableCell className="text-white">{house.activeAffiliates}</TableCell>
                      <TableCell className="text-white">{house.totalClicks}</TableCell>
                      <TableCell className="text-emerald-400 font-medium">
                        R$ {(Number(house.revenue) || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {(Number(house.conversionRate) || 0).toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) || []}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Afiliados Mais Lucrativos */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                Afiliados Mais Lucrativos
              </CardTitle>
              <CardDescription className="text-slate-400">
                Top afiliados por comissão gerada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Afiliado</TableHead>
                    <TableHead className="text-slate-300">Email</TableHead>
                    <TableHead className="text-slate-300">Cliques</TableHead>
                    <TableHead className="text-slate-300">Registros</TableHead>
                    <TableHead className="text-slate-300">Comissão Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {generalStats?.topAffiliates?.map((affiliate: any, index: number) => (
                    <TableRow key={affiliate.id} className="border-slate-700">
                      <TableCell className="text-white font-medium">
                        #{index + 1} {affiliate.fullName}
                      </TableCell>
                      <TableCell className="text-slate-300">{affiliate.email}</TableCell>
                      <TableCell className="text-white">{affiliate.totalClicks}</TableCell>
                      <TableCell className="text-white">{affiliate.totalRegistrations}</TableCell>
                      <TableCell className="text-emerald-400 font-medium">
                        R$ {(Number(affiliate.totalCommission) || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )) || []}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório por Afiliado */}
        <TabsContent value="affiliate" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Relatório por Afiliado</CardTitle>
                  <CardDescription className="text-slate-400">
                    Análise detalhada de um afiliado específico
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedAffiliate} onValueChange={setSelectedAffiliate}>
                    <SelectTrigger className="w-64 bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecionar Afiliado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Afiliados</SelectItem>
                      {affiliates?.map((affiliate: any) => (
                        <SelectItem key={affiliate.id} value={affiliate.id.toString()}>
                          {affiliate.fullName} ({affiliate.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedAffiliate !== "all" && (
                    <Button
                      onClick={() => exportCSV('affiliate')}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedAffiliate !== "all" && affiliateReport ? (
                <div className="space-y-6">
                  {/* Estatísticas do Afiliado */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-300 text-sm">Cliques</p>
                      <p className="text-2xl font-bold text-white">{affiliateReport.totalClicks}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-300 text-sm">Registros</p>
                      <p className="text-2xl font-bold text-white">{affiliateReport.totalRegistrations}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-300 text-sm">Depósitos</p>
                      <p className="text-2xl font-bold text-white">{affiliateReport.totalDeposits}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-300 text-sm">Comissão</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        R$ {affiliateReport.totalCommission?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Eventos do Afiliado */}
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Data</TableHead>
                        <TableHead className="text-slate-300">Tipo</TableHead>
                        <TableHead className="text-slate-300">Casa</TableHead>
                        <TableHead className="text-slate-300">Valor</TableHead>
                        <TableHead className="text-slate-300">Comissão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliateReport.events?.map((event: any) => (
                        <TableRow key={event.id} className="border-slate-700">
                          <TableCell className="text-white">
                            {new Date(event.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{event.type}</Badge>
                          </TableCell>
                          <TableCell className="text-white">{event.houseName}</TableCell>
                          <TableCell className="text-white">
                            {event.amount ? `R$ ${event.amount.toFixed(2)}` : '-'}
                          </TableCell>
                          <TableCell className="text-emerald-400">
                            {event.commission ? `R$ ${event.commission.toFixed(2)}` : '-'}
                          </TableCell>
                        </TableRow>
                      )) || []}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Selecione um afiliado para ver o relatório</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatório por Casa */}
        <TabsContent value="house" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Relatório por Casa de Aposta</CardTitle>
                  <CardDescription className="text-slate-400">
                    Análise de performance por casa de apostas
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                    <SelectTrigger className="w-64 bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Selecionar Casa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Casas</SelectItem>
                      {houses.map((house: any) => (
                        <SelectItem key={house.id} value={house.id.toString()}>
                          {house.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedHouse !== "all" && (
                    <Button
                      onClick={() => exportCSV('house')}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar CSV
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedHouse !== "all" && houseReport ? (
                <div className="space-y-6">
                  {/* Estatísticas da Casa */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-300 text-sm">Afiliados Ativos</p>
                      <p className="text-2xl font-bold text-white">{houseReport.activeAffiliates}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-300 text-sm">Tráfego Total</p>
                      <p className="text-2xl font-bold text-white">{houseReport.totalTraffic}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-300 text-sm">Conversões</p>
                      <p className="text-2xl font-bold text-white">{houseReport.conversions}</p>
                    </div>
                    <div className="bg-slate-700 p-4 rounded-lg">
                      <p className="text-slate-300 text-sm">Receita Gerada</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        R$ {houseReport.revenue?.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Top Afiliados da Casa */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Top Afiliados</h3>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">Afiliado</TableHead>
                          <TableHead className="text-slate-300">Cliques</TableHead>
                          <TableHead className="text-slate-300">Registros</TableHead>
                          <TableHead className="text-slate-300">Taxa Conversão</TableHead>
                          <TableHead className="text-slate-300">Comissão</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {houseReport.topAffiliates?.map((affiliate: any) => (
                          <TableRow key={affiliate.id} className="border-slate-700">
                            <TableCell className="text-white font-medium">
                              {affiliate.fullName}
                            </TableCell>
                            <TableCell className="text-white">{affiliate.clicks}</TableCell>
                            <TableCell className="text-white">{affiliate.registrations}</TableCell>
                            <TableCell>
                              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {affiliate.conversionRate?.toFixed(1)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-emerald-400">
                              R$ {affiliate.commission?.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        )) || []}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Selecione uma casa de apostas para ver o relatório</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}