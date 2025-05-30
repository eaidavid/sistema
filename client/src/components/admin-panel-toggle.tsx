import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Shield, User, ChevronUp, ChevronDown } from "lucide-react";

export default function AdminPanelToggle() {
  const { isAdmin, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Aguarda carregamento completo antes de renderizar
  if (isLoading || !user) return null;
  
  // Só mostra o botão para administradores
  if (!isAdmin) return null;

  const isOnAdminPanel = location === "/admin";

  const handleToggle = () => {
    if (isOnAdminPanel) {
      setLocation("/");
    } else {
      setLocation("/admin");
    }
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex flex-col items-end space-y-2">
        {isExpanded && (
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-lg">
            <p className="text-slate-300 text-xs mb-2 whitespace-nowrap">
              Painel atual: {isOnAdminPanel ? "Administrador" : "Usuário"}
            </p>
            <Button
              onClick={handleToggle}
              className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white text-xs py-2 h-auto"
            >
              {isOnAdminPanel ? (
                <>
                  <User className="h-3 w-3 mr-1" />
                  Ir para Painel Usuário
                </>
              ) : (
                <>
                  <Shield className="h-3 w-3 mr-1" />
                  Ir para Painel Admin
                </>
              )}
            </Button>
          </div>
        )}
        
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 shadow-lg"
        >
          {isOnAdminPanel ? (
            <Shield className="h-5 w-5 text-white" />
          ) : (
            <User className="h-5 w-5 text-white" />
          )}
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-white ml-1" />
          ) : (
            <ChevronUp className="h-3 w-3 text-white ml-1" />
          )}
        </Button>
      </div>
    </div>
  );
}