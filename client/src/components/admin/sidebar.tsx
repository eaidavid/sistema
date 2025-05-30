import { useState } from "react";
import { useLogout } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Crown, BarChart3, Users, Building, PieChart, Settings, LogOut, Webhook, DollarSign, Link2, Menu, X } from "lucide-react";
import logoPath from "@assets/Afiliados Bet positivo.png";

interface AdminSidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function AdminSidebar({ currentPage, onPageChange }: AdminSidebarProps) {
  const logout = useLogout();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "affiliates", label: "Afiliados", icon: Users },
    { id: "houses", label: "Casas de Apostas", icon: Building },
    { id: "links", label: "Links", icon: Link2 },
    { id: "postbacks", label: "Postbacks", icon: Webhook },
    { id: "commissions", label: "Comissões", icon: DollarSign },
    { id: "reports", label: "Relatórios", icon: PieChart },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  const handlePageChange = (page: string) => {
    onPageChange(page);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Mobile menu button
  if (isMobile) {
    return (
      <>
        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 bg-slate-800 rounded-lg border border-slate-700 lg:hidden"
        >
          <Menu className="h-6 w-6 text-white" />
        </button>

        {/* Mobile overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Sidebar */}
            <div className="fixed inset-y-0 left-0 w-80 max-w-[90vw] bg-slate-900 border-r border-slate-700 transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* Header with close button */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                  <div className="flex items-center">
                    <img 
                      src={logoPath} 
                      alt="AfiliadosBet Logo" 
                      className="w-8 h-8 mr-3"
                    />
                    <h1 className="text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                      Admin Panel
                    </h1>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => handlePageChange(item.id)}
                        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                          isActive
                            ? "text-red-400 bg-red-500/10 border border-red-500/20"
                            : "text-slate-300 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        <Icon className="h-5 w-5 mr-3" />
                        <span className="font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Logout */}
                <div className="px-4 py-4 border-t border-slate-700">
                  <button
                    onClick={() => logout.mutate()}
                    className="w-full flex items-center px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="h-5 w-5 mr-3" />
                    <span className="font-medium">Sair</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop sidebar
  return (
    <div className="fixed inset-y-0 left-0 w-72 bg-slate-900 border-r border-slate-700 z-40 hidden md:block">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 border-b border-slate-700">
          <img 
            src={logoPath} 
            alt="AfiliadosBet Logo" 
            className="w-10 h-10 mr-3"
          />
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-red-400 bg-red-500/10 border border-red-500/20"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-4 py-4 border-t border-slate-700">
          <button
            onClick={() => logout.mutate()}
            className="w-full flex items-center px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
