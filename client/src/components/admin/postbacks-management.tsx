import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, Filter, Activity, Database, TrendingUp, Users, DollarSign, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PostbackLogs from "./postback-logs";

interface PostbacksManagementProps {
  onPageChange?: (page: string) => void;
}

export default function PostbacksManagement({ onPageChange }: PostbacksManagementProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'overview'>('logs');
  const [filters, setFilters] = useState({
    type: "all",
    user: "",
  });
  const { toast } = useToast();

  // Buscar dados para a visão geral
  const { data: postbacks = [] } = useQuery({
    queryKey: ["/api/admin/postback-logs"],
    enabled: activeTab === 'overview'
  });

  const getEventBadge = (type: string) => {
    const colors = {
      click: "bg-blue-500",
      registration: "bg-green-500", 
      deposit: "bg-yellow-500",
      recurring_deposit: "bg-orange-500",
      profit: "bg-purple-500",
    };
    return (
      <Badge className={`${colors[type as keyof typeof colors] || "bg-gray-500"} text-white`}>
        {type.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const exportPostbacks = () => {
    toast({
      title: "Exportação iniciada",
      description: "Os dados dos postbacks serão baixados em breve.",
    });
  };

  const filteredPostbacks = Array.isArray(postbacks) ? postbacks.filter((postback: any) => {
    if (filters.type !== "all" && postback.evento !== filters.type) return false;
    if (filters.user && !postback.subid?.toLowerCase().includes(filters.user.toLowerCase())) return false;
    return true;
  }) : [];

  // Calcular estatísticas
  const totalPostbacks = filteredPostbacks.length;
  const totalValue = filteredPostbacks.reduce((sum: number, p: any) => sum + (parseFloat(p.valor) || 0), 0);
  const successfulPostbacks = filteredPostbacks.filter((p: any) => p.status === 'success').length;
  const uniqueUsers = new Set(filteredPostbacks.map((p: any) => p.subid)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Gestão de Postbacks</h1>
          <p className="text-gray-400 mt-1">Monitore e gerencie postbacks das casas de apostas</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            activeTab === 'logs' 
              ? 'bg-emerald-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Database className="w-4 h-4 mr-2" />
          Logs de Postbacks
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center px-4 py-2 rounded-md transition-colors ${
            activeTab === 'overview' 
              ? 'bg-emerald-600 text-white' 
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Activity className="w-4 h-4 mr-2" />
          Visão Geral
        </button>
      </div>

      {/* Conteúdo das Abas */}
      {activeTab === 'logs' ? (
        <PostbackLogs onPageChange={onPageChange} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Visão Geral dos Postbacks</h2>
              <p className="text-slate-400 mt-2">
                Acompanhe em tempo real todos os postbacks recebidos das casas de apostas
              </p>
            </div>
            <Button onClick={exportPostbacks} className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          {/* Filtros */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300">Tipo de Evento</label>
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="click">Click</SelectItem>
                      <SelectItem value="registration">Registro</SelectItem>
                      <SelectItem value="deposit">Depósito</SelectItem>
                      <SelectItem value="recurring_deposit">Depósito Recorrente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300">Usuário (SubID)</label>
                  <Input
                    placeholder="Filtrar por usuário..."
                    value={filters.user}
                    onChange={(e) => setFilters(prev => ({ ...prev, user: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Total de Postbacks</p>
                    <p className="text-2xl font-bold text-white">{totalPostbacks}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Valor Total</p>
                    <p className="text-2xl font-bold text-white">R$ {totalValue.toFixed(2)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Taxa de Sucesso</p>
                    <p className="text-2xl font-bold text-white">
                      {totalPostbacks > 0 ? ((successfulPostbacks / totalPostbacks) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Usuários Únicos</p>
                    <p className="text-2xl font-bold text-white">{uniqueUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Postbacks Recentes */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Postbacks Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPostbacks.slice(0, 10).map((postback: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getEventBadge(postback.evento)}
                      <div>
                        <p className="text-white font-medium">{postback.casa}</p>
                        <p className="text-slate-400 text-sm">SubID: {postback.subid}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">R$ {parseFloat(postback.valor || 0).toFixed(2)}</p>
                      <p className="text-slate-400 text-sm">
                        {new Date(postback.criadoEm).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredPostbacks.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-400">Nenhum postback encontrado com os filtros selecionados.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}