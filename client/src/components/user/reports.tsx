import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  MousePointer, 
  UserPlus, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Filter
} from "lucide-react";

interface ReportsProps {
  onPageChange?: (page: string) => void;
}

export default function Reports({ onPageChange }: ReportsProps) {
  const [selectedHouse, setSelectedHouse] = useState<string>("all");

  const { data: houses = [] } = useQuery({
    queryKey: ["/api/betting-houses"],
    retry: false,
  });

  const { data: events = [] } = useQuery({
    queryKey: ["/api/user/events", selectedHouse],
    retry: false,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats/user"],
    retry: false,
  });

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "click":
        return <MousePointer className="h-4 w-4 text-blue-500" />;
      case "registration":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case "deposit":
        return <DollarSign className="h-4 w-4 text-yellow-500" />;
      case "commission":
        return <TrendingUp className="h-4 w-4 text-emerald-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "click":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Clique</Badge>;
      case "registration":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Registro</Badge>;
      case "deposit":
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Depósito</Badge>;
      case "commission":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Comissão</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Relatórios</h1>
          <p className="text-slate-400 mt-1">Análise detalhada das suas conversões e performance</p>
        </div>
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-8 w-8 text-emerald-500" />
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total de Cliques</p>
                <p className="text-2xl font-bold text-white">{stats?.totalClicks || 0}</p>
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
                <p className="text-2xl font-bold text-white">{stats?.totalRegistrations || 0}</p>
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
                <p className="text-2xl font-bold text-white">{stats?.totalDeposits || 0}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Comissão Total</p>
                <p className="text-2xl font-bold text-emerald-400">
                  R$ {stats?.totalCommission?.toFixed(2) || '0.00'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Events Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Histórico de Eventos
              </CardTitle>
              <CardDescription className="text-slate-400">
                Acompanhe todos os eventos gerados pelos seus links
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Data</TableHead>
                    <TableHead className="text-slate-300">Tipo</TableHead>
                    <TableHead className="text-slate-300">Casa de Aposta</TableHead>
                    <TableHead className="text-slate-300">Valor</TableHead>
                    <TableHead className="text-slate-300">Comissão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event: any) => (
                    <TableRow key={event.id} className="border-slate-700">
                      <TableCell className="text-white">
                        {new Date(event.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEventTypeIcon(event.type)}
                          {getEventTypeBadge(event.type)}
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {event.houseName}
                      </TableCell>
                      <TableCell className="text-white">
                        {event.amount ? `R$ ${event.amount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="text-emerald-400 font-medium">
                        {event.commission ? `R$ ${event.commission.toFixed(2)}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Nenhum evento encontrado</p>
              <p className="text-slate-500 text-sm">
                {selectedHouse === "all" 
                  ? "Comece a divulgar seus links para ver os eventos aqui"
                  : "Nenhum evento para a casa selecionada"
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}