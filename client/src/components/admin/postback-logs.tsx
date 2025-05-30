import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Search, Filter, Eye, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface PostbackLog {
  id: number;
  casa: string;
  subid: string;
  evento: string;
  valor: number;
  ip: string;
  raw: string;
  status: string;
  criadoEm: string;
}

interface PostbackLogsProps {
  onPageChange?: (page: string) => void;
}

export default function PostbackLogs({ onPageChange }: PostbackLogsProps) {
  const [filters, setFilters] = useState({
    status: 'all',
    casa: '',
    subid: '',
  });
  
  const [selectedLog, setSelectedLog] = useState<PostbackLog | null>(null);
  const [showRawData, setShowRawData] = useState(false);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/postback-logs', filters],
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registrado':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Registrado</Badge>;
      case 'erro_subid':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />SubID Inválido</Badge>;
      case 'erro_casa':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Casa Inválida</Badge>;
      case 'processando':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Processando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventBadge = (evento: string) => {
    const colors = {
      'registration': 'bg-blue-500',
      'deposit': 'bg-green-500',
      'revenue': 'bg-purple-500',
      'profit': 'bg-orange-500',
      'click': 'bg-gray-500'
    };
    return <Badge className={colors[evento as keyof typeof colors] || 'bg-gray-500'}>{evento}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Logs de Postbacks</h2>
          <p className="text-gray-400">Monitore em tempo real os postbacks recebidos das casas de apostas</p>
        </div>
        <Button onClick={() => refetch()} className="bg-emerald-600 hover:bg-emerald-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="registrado">Registrado</SelectItem>
                  <SelectItem value="erro_subid">Erro SubID</SelectItem>
                  <SelectItem value="erro_casa">Erro Casa</SelectItem>
                  <SelectItem value="processando">Processando</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Casa</label>
              <Input 
                placeholder="Filtrar por casa..."
                value={filters.casa}
                onChange={(e) => setFilters({...filters, casa: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">SubID</label>
              <Input 
                placeholder="Filtrar por subid..."
                value={filters.subid}
                onChange={(e) => setFilters({...filters, subid: e.target.value})}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">
            Logs Recentes ({logs.length} registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              <span className="ml-2 text-gray-400">Carregando logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum postback recebido ainda</p>
              <p className="text-sm">Os logs aparecerão aqui quando as casas enviarem postbacks</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-gray-300">Data/Hora</TableHead>
                    <TableHead className="text-gray-300">Casa</TableHead>
                    <TableHead className="text-gray-300">SubID</TableHead>
                    <TableHead className="text-gray-300">Evento</TableHead>
                    <TableHead className="text-gray-300">Valor</TableHead>
                    <TableHead className="text-gray-300">IP</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: PostbackLog) => (
                    <TableRow key={log.id} className="border-slate-700 hover:bg-slate-700/50">
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {formatDate(log.criadoEm)}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {log.casa}
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono">
                        {log.subid}
                      </TableCell>
                      <TableCell>
                        {getEventBadge(log.evento)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {log.valor > 0 ? formatCurrency(log.valor) : '-'}
                      </TableCell>
                      <TableCell className="text-gray-400 font-mono text-sm">
                        {log.ip}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(log.status)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowRawData(true);
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Raw Data */}
      {showRawData && selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-semibold text-white">Detalhes do Postback</h3>
              <p className="text-gray-400">Casa: {selectedLog.casa} | SubID: {selectedLog.subid}</p>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">URL Completa Recebida:</h4>
                <pre className="bg-slate-900 p-4 rounded-lg text-sm text-gray-300 overflow-x-auto border border-slate-600">
                  {selectedLog.raw}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Informações:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Casa:</span>
                      <span className="text-white">{selectedLog.casa}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">SubID:</span>
                      <span className="text-white">{selectedLog.subid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Evento:</span>
                      <span className="text-white">{selectedLog.evento}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Valor:</span>
                      <span className="text-white">{selectedLog.valor > 0 ? formatCurrency(selectedLog.valor) : 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Técnico:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">IP:</span>
                      <span className="text-white font-mono">{selectedLog.ip}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span>{getStatusBadge(selectedLog.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Data:</span>
                      <span className="text-white">{formatDate(selectedLog.criadoEm)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700">
              <Button onClick={() => setShowRawData(false)} className="bg-gray-600 hover:bg-gray-700">
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}