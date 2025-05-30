import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Search,
  Building,
  Plus,
  Check,
  ExternalLink,
  Globe,
  Users,
  TrendingUp,
} from "lucide-react";

interface BettingHousesFixedProps {
  onPageChange?: (page: string) => void;
}

export default function BettingHousesFixed({ onPageChange }: BettingHousesFixedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar casas DISPONÍVEIS para afiliação (API já retorna apenas casas não afiliadas)
  const { data: availableHouses = [], isLoading: housesLoading } = useQuery({
    queryKey: ["/api/betting-houses"],
  });

  // Buscar afiliações existentes do usuário
  const { data: userAffiliations = [] } = useQuery({
    queryKey: ["/api/my-affiliations"],
  });

  // Mutação para se afiliar
  const affiliateMutation = useMutation({
    mutationFn: async (houseId: number) => {
      const response = await apiRequest("POST", `/api/affiliate/${houseId}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sucesso!",
        description: "Você foi afiliado com sucesso! Seu link personalizado foi gerado.",
      });
      // Invalidar queries para atualizar as listas
      queryClient.invalidateQueries({ queryKey: ["/api/betting-houses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-affiliations"] });
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

  // Verificar se usuário está afiliado a uma casa específica
  const isUserAffiliated = (houseId: number): boolean => {
    return userAffiliations.some((affiliation: any) => 
      affiliation.house?.id === houseId && affiliation.isActive
    );
  };

  // Filtrar casas por termo de busca
  const filteredHouses = availableHouses.filter((house: any) =>
    house.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    house.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (housesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Casas de Apostas</h2>
            <p className="text-muted-foreground">
              Carregando casas disponíveis para afiliação...
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Casas de Apostas</h2>
          <p className="text-muted-foreground">
            Explore e se afilie às melhores casas de apostas disponíveis.
          </p>
        </div>
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
          {filteredHouses.length} Disponíveis
        </Badge>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar casas de apostas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => onPageChange?.("my-links")}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Meus Links
        </Button>
      </div>

      {filteredHouses.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <Building className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma casa disponível</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "Nenhuma casa encontrada com esse termo de busca."
                : "Você já está afiliado a todas as casas disponíveis ou não há casas ativas no momento."
              }
            </p>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Limpar Busca
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHouses.map((house: any) => {
            // Verificação em tempo real se o usuário está afiliado
            const isAffiliated = isUserAffiliated(house.id);
            
            return (
              <Card key={house.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                        {house.name.charAt(0)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{house.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {house.commissionType === "percentage" ? `${house.commissionValue}%` : `R$ ${house.commissionValue}`} de comissão
                        </p>
                      </div>
                    </div>
                    {house.isActive && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                        Ativa
                      </Badge>
                    )}
                  </div>
                  
                  {house.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {house.description}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Plataforma Online</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 text-xs font-medium">Comissão Alta</span>
                    </div>
                  </div>

                  {/* RENDERIZAÇÃO CONDICIONAL BASEADA NA VERIFICAÇÃO REAL */}
                  {isAffiliated ? (
                    <Button
                      disabled
                      className="w-full bg-slate-600 text-slate-300 cursor-not-allowed"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Já Afiliado
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
                          Se Afiliar
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}