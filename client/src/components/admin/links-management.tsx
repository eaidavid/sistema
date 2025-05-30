import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link, Users, Activity, Copy, ExternalLink, Search, TestTube, Settings, CheckCircle, AlertTriangle, Eye, Shield, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LinksManagementProps {
  onPageChange?: (page: string) => void;
}

interface House {
  id: number;
  name: string;
  identifier: string;
  securityToken: string;
  enabledPostbacks: string[];
  parameterMapping: Record<string, string>;
  isActive: boolean;
  commissionType: string;
  commissionValue: string;
}

export default function LinksManagement({ onPageChange }: LinksManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [copiedUrls, setCopiedUrls] = useState<string[]>([]);
  const { toast } = useToast();

  // Buscar todas as casas de apostas para gerenciar postbacks
  const { data: houses = [], isLoading } = useQuery<House[]>({
    queryKey: ["/api/admin/betting-houses"],
  });

  // Buscar todos os links de afiliados
  const { data: allLinks = [] } = useQuery({
    queryKey: ["/api/admin/all-links"],
  });

  const copyToClipboard = (text: string, eventName: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedUrls(prev => [...prev, eventName]);
      toast({
        title: "URL copiada!",
        description: `URL do evento ${eventName} foi copiada para a área de transferência.`,
      });
      setTimeout(() => {
        setCopiedUrls(prev => prev.filter(item => item !== eventName));
      }, 2000);
    });
  };

  const testPostback = async (house: House, event: string) => {
    try {
      const baseUrl = window.location.origin;
      const testUrl = `${baseUrl}/postback/${house.identifier}/${event}/${house.securityToken}?subid=testuser&amount=100&customer_id=TEST123`;
      
      const response = await fetch(testUrl);
      const result = await response.json();
      
      toast({
        title: response.ok ? "✅ Postback OK!" : "❌ Erro no Postback",
        description: result.message || `Teste do evento ${event}`,
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "❌ Erro no Teste",
        description: "Falha ao testar postback",
        variant: "destructive",
      });
    }
  };

  const generatePostbackUrls = (house: House) => {
    const baseUrl = window.location.origin;
    const urls: Record<string, string> = {};
    
    house.enabledPostbacks?.forEach(event => {
      const hasAmount = ['deposit', 'first_deposit', 'profit'].includes(event);
      const amountParam = hasAmount ? '&amount={amount}' : '';
      urls[event] = `${baseUrl}/api/postback/${house.identifier}/${event}?subid={subid}${amountParam}&customer_id={customer_id}`;
    });
    
    return urls;
  };

  const filteredHouses = houses.filter((house: House) =>
    house.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    house.identifier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLinks = allLinks.filter((link: any) =>
    link.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    link.houseName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-slate-400">Carregando dados de links...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Gerenciamento de Links</h1>
          <p className="text-slate-400">Configure URLs de postback e monitore links de afiliados</p>
        </div>
      </div>

      <Tabs defaultValue="postbacks" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="postbacks" className="data-[state=active]:bg-slate-700">
            <Activity className="h-4 w-4 mr-2" />
            URLs de Postback
          </TabsTrigger>
          <TabsTrigger value="affiliate-links" className="data-[state=active]:bg-slate-700">
            <Link className="h-4 w-4 mr-2" />
            Links de Afiliados
          </TabsTrigger>
        </TabsList>

        {/* Aba de URLs de Postback */}
        <TabsContent value="postbacks" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Buscar casas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400"
              />
            </div>
          </div>

          {filteredHouses.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Nenhuma casa encontrada</h3>
                <p className="text-slate-400 mb-4">Não há casas de apostas cadastradas ou correspondentes à busca.</p>
                <Button onClick={() => onPageChange?.('houses')} className="bg-emerald-500 hover:bg-emerald-600">
                  Cadastrar Casa
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredHouses.map((house) => {
                const postbackUrls = generatePostbackUrls(house);
                const hasEvents = house.enabledPostbacks && house.enabledPostbacks.length > 0;
                
                return (
                  <Card key={house.id} className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center overflow-hidden border border-slate-600">
                            {house.logoUrl ? (
                              <img 
                                src={house.logoUrl} 
                                alt={`${house.name} logo`}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement!.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center"><svg class="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path></svg></div>`;
                                }}
                              />
                            ) : (
                              <Globe className="h-6 w-6 text-emerald-500" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-white flex items-center gap-2">
                              {house.name}
                              {house.isActive ? (
                                <Badge className="bg-green-500/20 text-green-400">Ativa</Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-400">Inativa</Badge>
                              )}
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                              ID: {house.identifier} • {house.commissionType} {house.commissionValue}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedHouse(house)}
                            className="border-slate-600 text-slate-300 hover:bg-slate-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {!hasEvents ? (
                        <Alert className="border-yellow-500/20 bg-yellow-500/10">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          <AlertDescription className="text-yellow-300">
                            Esta casa não possui eventos de postback configurados. 
                            <Button 
                              variant="link" 
                              className="text-yellow-400 p-0 h-auto ml-1"
                              onClick={() => onPageChange?.('houses')}
                            >
                              Configure agora
                            </Button>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-emerald-400" />
                                Token de Segurança
                              </h4>
                              <div className="flex items-center space-x-2">
                                <code className="bg-slate-900/50 text-emerald-400 px-3 py-1 rounded text-sm font-mono flex-1">
                                  {house.securityToken}
                                </code>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(house.securityToken, 'token')}
                                  className="h-8 w-8 p-0"
                                >
                                  {copiedUrls.includes('token') ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-white font-medium mb-2">Eventos Habilitados</h4>
                              <div className="flex flex-wrap gap-2">
                                {house.enabledPostbacks.map(event => (
                                  <Badge key={event} variant="secondary" className="bg-blue-500/20 text-blue-400">
                                    {event.replace('_', ' ')}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                              <ExternalLink className="h-4 w-4 text-emerald-400" />
                              URLs de Postback
                            </h4>
                            <div className="space-y-3">
                              {Object.entries(postbackUrls).map(([event, url]) => (
                                <div key={event} className="bg-slate-900/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-emerald-400 font-medium capitalize">
                                      {event.replace('_', ' ')}:
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => testPostback(house, event)}
                                        className="h-6 text-xs border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                                      >
                                        <TestTube className="h-3 w-3 mr-1" />
                                        Testar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(url, event)}
                                        className="h-6 w-6 p-0"
                                      >
                                        {copiedUrls.includes(event) ? (
                                          <CheckCircle className="h-3 w-3 text-green-500" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                  <code className="text-slate-300 font-mono text-xs break-all block">
                                    {url}
                                  </code>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Alert className="border-blue-500/20 bg-blue-500/10">
                            <CheckCircle className="h-4 w-4 text-blue-400" />
                            <AlertDescription className="text-blue-300">
                              <strong>Instruções:</strong> Copie essas URLs e configure na plataforma da casa de apostas. 
                              Os parâmetros {`{subid}`}, {`{amount}`} e {`{customer_id}`} serão substituídos automaticamente pela casa.
                            </AlertDescription>
                          </Alert>
                        </>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Aba de Links de Afiliados */}
        <TabsContent value="affiliate-links" className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Buscar por afiliado ou casa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400"
              />
            </div>
          </div>

          {filteredLinks.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="text-center py-12">
                <Link className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Nenhum link encontrado</h3>
                <p className="text-slate-400">Não há links de afiliados correspondentes à busca.</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  Links de Afiliados Ativos
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400">
                    {filteredLinks.length}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Todos os links de afiliação gerados na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredLinks.map((link: any) => (
                    <div key={link.id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="outline" className="border-emerald-500 text-emerald-400">
                              {link.userName}
                            </Badge>
                            <Badge variant="outline" className="border-blue-500 text-blue-400">
                              {link.houseName}
                            </Badge>
                            {link.isActive ? (
                              <Badge className="bg-green-500/20 text-green-400">Ativo</Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400">Inativo</Badge>
                            )}
                          </div>
                          <code className="text-slate-300 font-mono text-sm break-all">
                            {link.generatedUrl}
                          </code>
                          <div className="text-xs text-slate-400 mt-1">
                            Criado em: {new Date(link.createdAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(link.generatedUrl, `link-${link.id}`)}
                            className="h-8 w-8 p-0"
                          >
                            {copiedUrls.includes(`link-${link.id}`) ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(link.generatedUrl, '_blank')}
                            className="h-8 w-8 p-0"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de detalhes da casa */}
      {selectedHouse && (
        <Dialog open={!!selectedHouse} onOpenChange={() => setSelectedHouse(null)}>
          <DialogContent className="max-w-4xl bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-emerald-500" />
                Detalhes de Configuração - {selectedHouse.name}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Configurações detalhadas de postback para esta casa de apostas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-white font-medium mb-3">Informações Básicas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nome:</span>
                      <span className="text-white">{selectedHouse.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Identificador:</span>
                      <span className="text-emerald-400 font-mono">{selectedHouse.identifier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <Badge className={selectedHouse.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                        {selectedHouse.isActive ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Comissão:</span>
                      <span className="text-white">{selectedHouse.commissionType} {selectedHouse.commissionValue}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-medium mb-3">Mapeamento de Parâmetros</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(selectedHouse.parameterMapping || {}).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-400">{key}:</span>
                        <span className="text-emerald-400 font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-medium mb-3">URLs de Postback Completas</h4>
                <div className="space-y-3">
                  {Object.entries(generatePostbackUrls(selectedHouse)).map(([event, url]) => (
                    <div key={event} className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-emerald-400 font-medium capitalize">
                          {event.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testPostback(selectedHouse, event)}
                            className="h-6 text-xs border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                          >
                            <TestTube className="h-3 w-3 mr-1" />
                            Testar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(url, `modal-${event}`)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedUrls.includes(`modal-${event}`) ? (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <code className="text-slate-300 font-mono text-xs break-all block bg-slate-800/50 p-2 rounded">
                        {url}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSelectedHouse(null)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  onPageChange?.('houses');
                  setSelectedHouse(null);
                }}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Editar Casa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}