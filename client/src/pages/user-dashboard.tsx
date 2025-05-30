import { useState, useEffect } from "react";
import UserSidebar from "@/components/user/sidebar";
import UserTopBar from "@/components/user/topbar";
import BettingHousesSecure from "@/components/user/betting-houses-secure";
import MyLinks from "@/components/user/my-links";
import Payments from "@/components/user/payments";
import Reports from "@/components/user/reports";
import Support from "@/components/user/support";
import Profile from "@/components/user/profile";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MousePointer, UserPlus, CreditCard, DollarSign, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export default function UserDashboard() {
  const [currentPage, setCurrentPage] = useState("home");
  const { user, isLoading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // Atualização automática a cada 3 segundos para sincronizar com mudanças do admin
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/betting-houses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-links"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/user"] });
    }, 3000);

    return () => clearInterval(interval);
  }, [queryClient]);

  const { data: stats = {}, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["/api/stats/user"],
  });

  // Verificação do status da conta (afetado por ações do admin)
  const { data: accountStatus = {} } = useQuery({
    queryKey: ["/api/user/account-status"],
    refetchInterval: 5000, // Verifica a cada 5 segundos
  });

  // Estado de carregamento seguro
  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  // Verificação de erro
  if (statsError) {
    console.error("Stats error:", statsError);
  }

  // Renderiza notificações de ações administrativas
  const renderAdminNotifications = () => {
    const notifications = [];
    
    if (accountStatus?.isActive === false) {
      notifications.push(
        <Alert key="blocked" className="mb-4 border-red-500 bg-red-500/10">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-400">
            Sua conta foi bloqueada pelo administrador. Entre em contato com o suporte.
          </AlertDescription>
        </Alert>
      );
    }

    if (accountStatus?.activeLinksCount !== undefined && accountStatus.activeLinksCount < accountStatus?.totalLinks) {
      notifications.push(
        <Alert key="links-disabled" className="mb-4 border-yellow-500 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-400">
            Alguns dos seus links foram desativados pelo administrador.
          </AlertDescription>
        </Alert>
      );
    }

    return notifications;
  };

  const renderContent = () => {
    switch (currentPage) {
      case "houses":
        return <BettingHousesSecure />;
      case "links":
        return <MyLinks onPageChange={setCurrentPage} />;
      case "payments":
        return <Payments onPageChange={setCurrentPage} />;
      case "reports":
        return <Reports onPageChange={setCurrentPage} />;
      case "support":
        return <Support onPageChange={setCurrentPage} />;
      case "profile":
        return <Profile onPageChange={setCurrentPage} />;
      case "dashboard":
        return <Reports onPageChange={setCurrentPage} />;
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Bem-vindo, {user?.fullName?.split(" ")[0]}! 👋
                </h1>
                <p className="text-slate-400">
                  Acompanhe seu progresso e maximize seus ganhos como afiliado.
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total de Cliques</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {(stats as any)?.totalClicks?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                      <MousePointer className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <span className="text-emerald-500 text-sm font-medium">+12.5%</span>
                    <span className="text-slate-400 text-sm ml-2">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Registros</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {(stats as any)?.totalRegistrations || "0"}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <UserPlus className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <span className="text-emerald-500 text-sm font-medium">+8.2%</span>
                    <span className="text-slate-400 text-sm ml-2">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Depósitos</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {(stats as any)?.totalDeposits || "0"}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-yellow-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <span className="text-emerald-500 text-sm font-medium">+15.7%</span>
                    <span className="text-slate-400 text-sm ml-2">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Comissão Total</p>
                      <p className="text-2xl font-bold text-emerald-500 mt-1">
                        R$ {(stats as any)?.totalCommission?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <span className="text-emerald-500 text-sm font-medium">+22.3%</span>
                    <span className="text-slate-400 text-sm ml-2">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setCurrentPage("houses")}
                    className="flex items-center justify-center space-x-3 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-colors"
                  >
                    <span className="text-emerald-500 font-medium">Afiliar-se a Nova Casa</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage("links")}
                    className="flex items-center justify-center space-x-3 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl transition-colors"
                  >
                    <span className="text-blue-500 font-medium">Ver Meus Links</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage("reports")}
                    className="flex items-center justify-center space-x-3 p-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-xl transition-colors"
                  >
                    <span className="text-yellow-500 font-medium">Relatórios Detalhados</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <UserSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <div className={isMobile ? "w-full" : "ml-72"}>
        <UserTopBar onPageChange={setCurrentPage} />
        <main className={isMobile ? "p-4 pt-16" : "p-6"}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
