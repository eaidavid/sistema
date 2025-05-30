import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, ExternalLink, Search, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface MyLinksProps {
  onPageChange?: (page: string) => void;
}

export default function MyLinks({ onPageChange }: MyLinksProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: affiliations, isLoading } = useQuery({
    queryKey: ["/api/my-affiliations"],
  });

  const filteredAffiliations = affiliations?.filter((affiliation: any) =>
    affiliation.house?.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Link copiado!",
      description: "O link foi copiado para a área de transferência.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Meus Links</h2>
            <p className="text-muted-foreground">
              Gerencie e copie seus links de afiliação personalizados.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
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
          <h2 className="text-3xl font-bold">Meus Links</h2>
          <p className="text-muted-foreground">
            Gerencie e copie seus links de afiliação personalizados.
          </p>
        </div>
        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          {filteredAffiliations.length} Afiliações
        </Badge>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar casas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => onPageChange?.("betting-houses")}
          className="flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Ver Casas Disponíveis
        </Button>
      </div>

      {filteredAffiliations.length === 0 ? (
        <Card className="text-center p-8">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
              <ExternalLink className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhuma afiliação encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não está afiliado a nenhuma casa de apostas.
            </p>
            <Button onClick={() => onPageChange?.("betting-houses")}>
              Explorar Casas de Apostas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAffiliations.map((affiliation: any) => (
            <Card key={affiliation.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {affiliation.house?.name.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{affiliation.house?.name}</CardTitle>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        Afiliado em {formatDate(affiliation.affiliatedAt)}
                      </div>
                    </div>
                  </div>
                  <Badge variant={affiliation.isActive ? "default" : "secondary"}>
                    {affiliation.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <CardDescription>
                  {affiliation.house?.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Comissão:</span>
                    <span className="font-semibold text-emerald-600">
                      {affiliation.house?.commissionRate}% {affiliation.house?.commissionType}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={affiliation.house?.isActive ? "default" : "secondary"} className="text-xs">
                      {affiliation.house?.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Link Personalizado:</label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={affiliation.personalizedUrl}
                      readOnly
                      className="text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(affiliation.personalizedUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}