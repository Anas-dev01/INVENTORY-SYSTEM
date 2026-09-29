import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import LoginPage from "./pages/LoginPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import { useAppStore } from "@/lib/store";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import SalesPage from "@/pages/SalesPage";
import InventoryPage from "@/pages/InventoryPage";
import CustomersPage from "@/pages/CustomersPage";
import SuppliersPage from "@/pages/SuppliersPage";
import ReportsPage from "@/pages/ReportsPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AppContent() {
  const store = useAppStore();

  return (
    <AppLayout
      lowStockCount={store.lowStockProducts.length}
      lowStockItems={store.lowStockProducts.map(p => ({ name: p.name, stock: p.stock, minStock: p.minStock }))}
    >
      <Routes>
        <Route path="/" element={<DashboardPage store={store} />} />
        <Route path="/products" element={<ProductsPage store={store} />} />
        <Route path="/sales" element={<SalesPage store={store} />} />
        <Route path="/inventory" element={<InventoryPage store={store} />} />
        <Route path="/customers" element={<CustomersPage store={store} />} />
        <Route path="/suppliers" element={<SuppliersPage store={store} />} />
        <Route path="/reports" element={<ReportsPage store={store} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check active sessions on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-bold text-xl font-mono tracking-tighter">
          STOCKFLOW...
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* If no session, show LoginPage. Otherwise, show the Router and AppContent */}
        {!session ? (
          <LoginPage />
        ) : (
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;