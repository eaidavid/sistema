import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import Register from "@/pages/register";
import Login from "@/pages/login";
import UserDashboard from "@/pages/user-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import AdminPanelToggle from "@/components/admin-panel-toggle";

function Router() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-emerald-500 text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        {!isAuthenticated ? (
          <>
            <Route path="/" component={Login} />
          </>
        ) : (
          <>
            <Route path="/" component={UserDashboard} />
            <Route path="/dashboard" component={UserDashboard} />
            <Route path="/admin" component={AdminDashboard} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
      {isAuthenticated && <AdminPanelToggle />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
