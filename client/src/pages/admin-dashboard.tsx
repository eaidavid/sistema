import { useState } from "react";
import AdminSidebar from "@/components/admin/sidebar";
import AdminHousesManagement from "@/components/admin/houses-management";
import AffiliatesManagement from "@/components/admin/affiliates-management";
import LinksManagement from "@/components/admin/links-management";
import PostbacksManagement from "@/components/admin/postbacks-management";
import CommissionsManagement from "@/components/admin/commissions-management";
import ReportsManagement from "@/components/admin/reports-management";
import SettingsManagement from "@/components/admin/settings-management";
import AdminProfile from "@/components/admin/admin-profile";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building, TrendingUp, DollarSign } from "lucide-react";

export default function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const isMobile = useIsMobile();

  const { data: adminStats = {} } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  const renderContent = () => {
    switch (currentPage) {
      case "houses":
        return <AdminHousesManagement onPageChange={setCurrentPage} />;
      case "affiliates":
        return <AffiliatesManagement onPageChange={setCurrentPage} />;
      case "links":
        return <LinksManagement onPageChange={setCurrentPage} />;
      case "postbacks":
        return <PostbacksManagement onPageChange={setCurrentPage} />;
      case "commissions":
        return <CommissionsManagement onPageChange={setCurrentPage} />;
      case "reports":
        return <ReportsManagement onPageChange={setCurrentPage} />;
      case "settings":
        return <SettingsManagement onPageChange={setCurrentPage} />;
      case "profile":
        return <AdminProfile onPageChange={setCurrentPage} />;
      default:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Painel Administrativo</h1>
                <p className="text-slate-400">
                  Visão geral da plataforma e estatísticas principais.
                </p>
              </div>
            </div>

            {/* Admin Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
              <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-400 text-xs md:text-sm font-medium truncate">Total Afiliados</p>
                      <p className="text-xl md:text-2xl font-bold text-white mt-1">
                        {(adminStats as any)?.totalAffiliates?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center ml-3">
                      <Users className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-3 md:mt-4">
                    <span className="text-emerald-500 text-xs md:text-sm font-medium">+15.2%</span>
                    <span className="text-slate-400 text-xs md:text-sm ml-2">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-400 text-xs md:text-sm font-medium truncate">Casas Ativas</p>
                      <p className="text-xl md:text-2xl font-bold text-white mt-1">
                        {adminStats?.activeHouses || "0"}
                      </p>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center ml-3">
                      <Building className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-3 md:mt-4">
                    <span className="text-emerald-500 text-xs md:text-sm font-medium">+3 novos</span>
                    <span className="text-slate-400 text-xs md:text-sm ml-2">este mês</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-400 text-xs md:text-sm font-medium truncate">Volume Total</p>
                      <p className="text-xl md:text-2xl font-bold text-white mt-1">
                        R$ {adminStats?.totalVolume?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center ml-3">
                      <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-3 md:mt-4">
                    <span className="text-emerald-500 text-xs md:text-sm font-medium">+22.8%</span>
                    <span className="text-slate-400 text-xs md:text-sm ml-2">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-400 text-xs md:text-sm font-medium truncate">Comissões Pagas</p>
                      <p className="text-xl md:text-2xl font-bold text-emerald-500 mt-1">
                        R$ {adminStats?.paidCommissions?.toLocaleString() || "0"}
                      </p>
                    </div>
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center ml-3">
                      <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
                    </div>
                  </div>
                  <div className="flex items-center mt-3 md:mt-4">
                    <span className="text-emerald-500 text-xs md:text-sm font-medium">+18.7%</span>
                    <span className="text-slate-400 text-xs md:text-sm ml-2">vs mês anterior</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top performers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-white mb-4">Top Afiliados</h3>
                  <div className="space-y-3 md:space-y-4">
                    {adminStats?.topAffiliates?.map((affiliate: any) => (
                      <div key={affiliate.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs md:text-sm font-medium">
                              {affiliate.fullName?.charAt(0) || affiliate.username?.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm md:text-base truncate">{affiliate.fullName || affiliate.username}</p>
                            <p className="text-slate-400 text-xs md:text-sm truncate">{affiliate.username}</p>
                          </div>
                        </div>
                        <span className="text-emerald-500 font-semibold text-sm md:text-base ml-3">
                          R$ {(Number(affiliate.totalCommission) || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4 md:p-6">
                  <h3 className="text-base md:text-lg font-semibold text-white mb-4">Top Casas</h3>
                  <div className="space-y-3 md:space-y-4">
                    {adminStats?.topHouses?.map((house: any) => (
                      <div key={house.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 min-w-0 flex-1">
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs md:text-sm font-bold">
                              {house.name?.charAt(0)}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm md:text-base truncate">{house.name}</p>
                            <p className="text-slate-400 text-xs md:text-sm truncate">{house.affiliateCount} afiliados</p>
                          </div>
                        </div>
                        <div className="text-right ml-3">
                          <p className="text-emerald-500 font-semibold text-sm md:text-base">
                            R$ {(Number(house.totalVolume) || 0).toFixed(2)}
                          </p>
                          <p className="text-green-400 text-xs md:text-sm">+12.5%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminSidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      
      <div className={isMobile ? "w-full" : "md:ml-72"}>
        <header className={`bg-slate-900 border-b border-slate-700 ${isMobile ? "px-4 py-3 pt-16" : "px-6 py-4"}`}>
          <div className="flex items-center justify-between">
            <h1 className={`font-bold text-white ${isMobile ? "text-xl" : "text-2xl"}`}>Painel Administrativo</h1>
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
              </div>
              <span className={`text-white ${isMobile ? "hidden" : "block"}`}>Admin</span>
            </div>
          </div>
        </header>
        
        <main className={isMobile ? "p-4" : "p-6"}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
