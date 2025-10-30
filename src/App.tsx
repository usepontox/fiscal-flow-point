import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PDV from "./pages/PDV";
import Produtos from "./pages/Produtos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SidebarProvider>
                  <div className="flex min-h-screen w-full">
                    <AppSidebar />
                    <main className="flex-1">
                      <header className="sticky top-0 z-10 flex h-14 items-center border-b bg-background px-4">
                        <SidebarTrigger />
                      </header>
                      <div className="p-6">
                        <Routes>
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/pdv" element={<PDV />} />
                          <Route path="/produtos" element={<Produtos />} />
                          <Route path="/clientes" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Clientes</h2><p className="text-muted-foreground">Em desenvolvimento</p></div>} />
                          <Route path="/fornecedores" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Fornecedores</h2><p className="text-muted-foreground">Em desenvolvimento</p></div>} />
                          <Route path="/financeiro" element={<div className="text-center py-12"><h2 className="text-2xl font-bold">Financeiro</h2><p className="text-muted-foreground">Em desenvolvimento</p></div>} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                    </main>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
