import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building, Search, Plus, Link as LinkIcon, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface BettingHousesProps {
  onPageChange?: (page: string) => void;
}

export default function BettingHouses({ onPageChange }: BettingHousesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: houses, isLoading } = useQuery({
    queryKey: ["/api/betting-houses"],
  });

  const { data: myLinks } = useQuery({
    queryKey: ["/api/my-links"],
  });

  const affiliateMutation = useMutation({
    mutationFn: async (houseId: number) => {
      try {
        const response = await apiRequest("POST", `/api/betting-houses/${houseId}/affiliate`);
        
        // Verificar se a resposta é válida
        const text = await response.text();
        
        // Se for vazio, retornar sucesso padrão
        if (!text || text.trim() === '') {
          return { success: true, message: "Afiliado com sucesso" };
        }
        
        // Tentar fazer parse do JSON
        try {
          return JSON.parse(text);
        } catch (parseError) {
          // Se não for JSON válido, mas a resposta foi ok, considerar sucesso
          if (response.ok) {
            return { success: true, message: "Afiliado com sucesso" };
          }
          throw new Error("Resposta inválida do servidor");
        }
      } catch (error: any) {
        // Se for erro de rede/conexão, relançar
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: "Você foi afiliado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/betting-houses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-links"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao se afiliar",
        variant: "destructive",
      });
    },
  });

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const filteredHouses = (houses as any)?.filter((house: any) =>
    house.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Função para verificar se já está afiliado a uma casa
  const isAffiliated = (houseId: number) => {
    return (myLinks as any)?.some((link: any) => link.houseId === houseId && link.isActive);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-slate-400">Carregando casas de apostas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Casas de Apostas</h1>
          <p className="text-slate-400">Escolha as melhores casas para se afiliar e começar a ganhar comissões.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar casas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-emerald-500/20 text-emerald-500">
                {filteredHouses.filter((h: any) => h.isAffiliated).length} Afiliadas
              </Badge>
              <Badge variant="outline" className="border-slate-600 text-slate-400">
                {filteredHouses.filter((h: any) => !h.isAffiliated).length} Disponíveis
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Houses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredHouses.map((house: any) => (
          <Card key={house.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-all duration-200 hover:scale-105">
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
                {house.isAffiliated ? (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                    <Check className="h-3 w-3 mr-1" />
                    Afiliado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                    Disponível
                  </Badge>
                )}
              </div>

              <p className="text-slate-300 text-sm mb-4 line-clamp-2">
                {house.description || "Casa de apostas confiável com ótimas oportunidades de comissão."}
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Comissão:</span>
                  <span className="text-white font-medium">{house.commissionValue}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Depósito mín.:</span>
                  <span className="text-white font-medium">{house.minDeposit || "R$ 10"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Pagamento:</span>
                  <span className="text-white font-medium">{house.paymentMethods || "PIX instantâneo"}</span>
                </div>
              </div>

              {isAffiliated(house.id) ? (
                <Button
                  disabled
                  className="w-full bg-slate-700 text-slate-400 cursor-not-allowed"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Já sou Afiliado
                </Button>
              ) : (
                <Button
                  onClick={() => affiliateMutation.mutate(house.id)}
                  disabled={affiliateMutation.isPending}
                  className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white"
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
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredHouses.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Nenhuma casa encontrada</h3>
            <p className="text-slate-400">
              {searchTerm ? "Tente ajustar sua busca." : "Não há casas de apostas disponíveis no momento."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
