import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building, Users, TrendingUp, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BettingHouse {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
  baseUrl: string;
  primaryParam: string;
  commissionType: string;
  commissionValue: string;
  minDeposit: string;
  paymentMethods: string;
  isActive: boolean;
  createdAt: string;
}

interface AffiliateLink {
  id: number;
  userId: number;
  houseId: number;
  generatedUrl: string;
  isActive: boolean;
  createdAt: string;
}

export default function BettingHousesSecure() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadingAffiliation, setLoadingAffiliation] = useState<number | null>(null);

  // Buscar todas as casas ativas
  const { data: houses = [], isLoading: housesLoading } = useQuery({
    queryKey: ["/api/betting-houses"],
  });

  // Buscar links de afiliação do usuário
  const { data: userLinks = [], isLoading: linksLoading } = useQuery({
    queryKey: ["/api/my-links"],
  });

  // Verificar se usuário está afiliado a uma casa específica
  const isAffiliated = (houseId: number): boolean => {
    return userLinks.some((link: AffiliateLink) => 
      link.houseId === houseId && link.isActive && link.generatedUrl && link.generatedUrl.trim() !== ''
    );
  };

  // Obter link de afiliação para uma casa
  const getAffiliateLink = (houseId: number): string | null => {
    const link = userLinks.find((link: AffiliateLink) => 
      link.houseId === houseId && link.isActive && link.generatedUrl && link.generatedUrl.trim() !== ''
    );
    return link ? link.generatedUrl : null;
  };

  // Mutação para afiliação
  const affiliateMutation = useMutation({
    mutationFn: async (houseId: number) => {
      console.log("🔗 Iniciando afiliação para casa:", houseId);
      const response = await apiRequest("POST", "/api/affiliate", { houseId });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao se afiliar");
      }
      
      return response.json();
    },
    onSuccess: (data, houseId) => {
      console.log("✅ Afiliação realizada com sucesso:", data);
      toast({
        title: "Sucesso!",
        description: "Afiliação realizada com sucesso! Seu link personalizado foi gerado.",
      });
      
      // Invalidar queries para atualizar a interface
      queryClient.invalidateQueries({ queryKey: ["/api/my-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/betting-houses"] });
      setLoadingAffiliation(null);
    },
    onError: (error: any, houseId) => {
      console.error("❌ Erro na afiliação:", error);
      toast({
        title: "Erro na afiliação",
        description: error.message || "Não foi possível realizar a afiliação. Tente novamente.",
        variant: "destructive",
      });
      setLoadingAffiliation(null);
    },
  });

  const handleAffiliate = async (houseId: number) => {
    if (isAffiliated(houseId)) {
      toast({
        title: "Já afiliado",
        description: "Você já está afiliado a esta casa de apostas.",
        variant: "destructive",
      });
      return;
    }

    setLoadingAffiliation(houseId);
    affiliateMutation.mutate(houseId);
  };

  const copyToClipboard = (text: string, houseName: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copiado!",
      description: `Link da ${houseName} copiado para a área de transferência.`,
    });
  };

  if (housesLoading || linksLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-slate-800 border-slate-700 animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-slate-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeHouses = houses.filter((house: BettingHouse) => house.isActive);

  if (activeHouses.length === 0) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-12 text-center">
          <Building className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhuma casa disponível</h3>
          <p className="text-slate-400">
            Não há casas de apostas ativas disponíveis para afiliação no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {activeHouses.map((house: BettingHouse) => {
        const affiliated = isAffiliated(house.id);
        const affiliateLink = getAffiliateLink(house.id);
        const isLoading = loadingAffiliation === house.id;

        return (
          <Card key={house.id} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                    {house.logoUrl ? (
                      <img 
                        src={house.logoUrl} 
                        alt={house.name} 
                        className="w-12 h-12 rounded-xl object-cover" 
                      />
                    ) : (
                      <Building className="h-8 w-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{house.name}</h3>
                    <p className="text-slate-400">
                      Ativa desde {new Date(house.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {affiliated ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                      Afiliado
                    </Badge>
                  ) : (
                    <Badge className="bg-slate-600/20 text-slate-400 border border-slate-600/20">
                      Não afiliado
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-400 text-sm mb-1">Comissão</div>
                      <div className="text-2xl font-bold text-emerald-500">{house.commissionValue}</div>
                    </div>
                    <div className="text-xs bg-slate-600 text-slate-300 px-2 py-1 rounded">
                      {house.commissionType === "revshare" ? "RS" : "CPA"}
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-400 text-sm mb-1">Depósito Mín.</div>
                      <div className="text-2xl font-bold text-white">R$ {house.minDeposit || "0"}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-400 text-sm mb-1">Pagamentos</div>
                      <div className="text-sm font-semibold text-white">{house.paymentMethods || "N/A"}</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-700/50 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-400 text-sm mb-1">Status</div>
                      <Badge className="bg-emerald-500/20 text-emerald-400">Ativa</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {house.description && (
                <div className="mb-6">
                  <p className="text-slate-300 text-sm">{house.description}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-400">
                  {affiliated ? (
                    "Você está afiliado a esta casa de apostas"
                  ) : (
                    "Clique em 'Se Afiliar' para gerar seu link personalizado"
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {affiliated && affiliateLink ? (
                    <>
                      <Button
                        onClick={() => copyToClipboard(affiliateLink, house.name)}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copiar Link
                      </Button>
                      <Button
                        onClick={() => window.open(affiliateLink, "_blank")}
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Testar
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleAffiliate(house.id)}
                      disabled={isLoading}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      {isLoading ? "Afiliando..." : "Se Afiliar"}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}