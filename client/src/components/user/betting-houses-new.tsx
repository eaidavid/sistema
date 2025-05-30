import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Search,
  Building,
  Plus,
  Check,
  Eye,
  Copy,
  ExternalLink,
} from "lucide-react";

export default function BettingHousesNew() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHouse, setSelectedHouse] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ✅ Buscar apenas casas DISPONÍVEIS para afiliamento (API já filtra casas não afiliadas)
  const { data: houses = [], isLoading: housesLoading } = useQuery({
    queryKey: ["/api/betting-houses"],
  });

  // Mutação para se afiliar
  const affiliateMutation = useMutation({
    mutationFn: async (houseId: number) => {
      const response = await apiRequest("POST", `/api/affiliate/${houseId}`);
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return response.json();
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Você foi afiliado com sucesso! Verifique seus links na aba 'Meus Links'.",
      });
      // Apenas invalidar os dados das casas de apostas
      queryClient.invalidateQueries({ queryKey: ["/api/betting-houses"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao se afiliar",
        variant: "destructive",
      });
    },
  });

  // ✅ IMPORTANTE: Casas retornadas pela API são APENAS as disponíveis para afiliamento
  // Se uma casa aparece aqui, significa que o usuário NÃO está afiliado a ela
  // Removemos completamente a verificação isAffiliated pois era baseada em dados incorretos

  // Copiar link para clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  // Função para abrir modal de detalhes
  const openDetailsModal = (house: any) => {
    setSelectedHouse(house);
    setIsDetailsModalOpen(true);
  };

  // Filtrar casas por busca
  const filteredHouses = Array.isArray(houses) ? houses.filter((house: any) =>
    house.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  if (housesLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-700 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-700 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Casas de Apostas</h1>
          <p className="text-slate-300">
            Escolha as melhores casas para se afiliar e começar a ganhar comissões.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar casas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-blue-500/30 text-blue-400">
              {filteredHouses.length} Disponívei{filteredHouses.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHouses.map((house: any) => {
          // ✅ TODAS as casas aqui são NÃO AFILIADAS (API já filtra)
          // Nunca mostrar como afiliado, sempre mostrar botão "Se Afiliar"
          return (
            <Card key={house.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                      <Building className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{house.name}</h3>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                    Disponível
                  </Badge>
                </div>

                <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                  {house.description || "Casa de apostas confiável com ótimas oportunidades de comissão."}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Comissão:</span>
                    <span className="text-white font-medium">
                      {house.commissionType === 'cpa' ? `R$ ${house.commissionValue}` : `${house.commissionValue}%`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Modelo:</span>
                    <span className="text-white font-medium">
                      {house.commissionType === 'cpa' ? 'CPA' : 'RevShare'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Status:</span>
                    <span className={`font-medium ${house.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {house.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Botão Ver Detalhes */}
                  <Button
                    variant="outline"
                    onClick={() => openDetailsModal(house)}
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>

                  {/* ✅ Botão de Afiliação - sempre "Se Afiliar" pois casas aqui são NÃO afiliadas */}
                  <Button
                      onClick={() => affiliateMutation.mutate(house.id)}
                      disabled={affiliateMutation.isPending || !house.isActive}
                      className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white disabled:opacity-50"
                    >
                      {affiliateMutation.isPending ? (
                        "Afiliando..."
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Afiliar-se
                        </>
                      )}
                    </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredHouses.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400">Nenhuma casa de apostas encontrada.</p>
        </div>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-md bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Building className="h-5 w-5 text-emerald-400" />
              <span>{selectedHouse?.name}</span>
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Informações detalhadas sobre esta casa de apostas
            </DialogDescription>
          </DialogHeader>
          
          {selectedHouse && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-2">Descrição</h4>
                <p className="text-slate-300 text-sm">
                  {selectedHouse.description || "Casa de apostas confiável com ótimas oportunidades de comissão."}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-1">Comissão</h4>
                  <p className="text-white font-medium">
                    {selectedHouse.commissionType === 'cpa' ? `R$ ${selectedHouse.commissionValue}` : `${selectedHouse.commissionValue}%`}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-1">Modelo</h4>
                  <p className="text-white font-medium">
                    {selectedHouse.commissionType === 'cpa' ? 'CPA' : 'RevShare'}
                  </p>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-1">Status</h4>
                <Badge className={selectedHouse.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                  {selectedHouse.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              
              {selectedHouse.baseUrl && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-1">Site Oficial</h4>
                  <a 
                    href={selectedHouse.baseUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 text-sm flex items-center space-x-1"
                  >
                    <span>{selectedHouse.baseUrl}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button
              onClick={() => setIsDetailsModalOpen(false)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}