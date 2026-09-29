import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingCart, Users, Truck, BarChart3, Settings, Menu, X, AlertTriangle, Bell, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase"; // Import supabase for logout

interface AppLayoutProps {
  children: React.ReactNode;
  lowStockCount: number;
  lowStockItems: { name: string; stock: number; minStock: number }[];
}

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/products", icon: Package, label: "Products" },
  { to: "/sales", icon: ShoppingCart, label: "Point of Sale" },
  { to: "/inventory", icon: BarChart3, label: "Inventory" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/suppliers", icon: Truck, label: "Suppliers" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
];

export default function AppLayout({ children, lowStockCount, lowStockItems }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentPage = navItems.find(item => item.to === location.pathname)?.label || "Dashboard";

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error.message);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Package className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-sidebar-accent-foreground">StockFlow</h1>
            <p className="text-[10px] text-sidebar-foreground/60 uppercase tracking-wider">Inventory Manager</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {item.label === "Inventory" && lowStockCount > 0 && (
                <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0 h-5">{lowStockCount}</Badge>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Logout Section */}
        <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start text-xs text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <b>Logout</b>
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-4 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-sm">{currentPage}</h2>
          <div className="ml-auto flex items-center gap-2">
            {lowStockCount > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="w-4 h-4" />
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">{lowStockCount}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <h4 className="font-semibold text-sm">Low Stock Alerts</h4>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {lowStockItems.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1.5 border-b border-border last:border-0">
                        <span className="font-medium truncate mr-2">{item.name}</span>
                        <span className="text-destructive font-mono whitespace-nowrap">{item.stock}/{item.minStock}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}