import StatCard from "@/components/StatCard";
import { Banknote, Package, ShoppingCart, AlertTriangle, TrendingUp, Users } from "lucide-react";
import { AppStore } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatNaira } from "@/lib/utils"; // Import the Naira formatter


interface DashboardPageProps {
  store: AppStore;
}

export default function DashboardPage({ store }: DashboardPageProps) {
  const { products, sales, lowStockProducts, totalRevenue, totalCost, customers } = store;

  const profit = totalRevenue - totalCost;
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);

  // Category distribution
  const categoryData = products.reduce((acc, p) => {
    const existing = acc.find(c => c.name === p.category);
    if (existing) existing.value += p.stock;
    else acc.push({ name: p.category, value: p.stock });
    return acc;
  }, [] as { name: string; value: number }[]);

  // Sales by day (last 7 days mockup)
  const salesByDay = [
    { day: "Mon", sales: 245 },
    { day: "Tue", sales: 312 },
    { day: "Wed", sales: 198 },
    { day: "Thu", sales: 420 },
    { day: "Fri", sales: 380 },
    { day: "Sat", sales: 510 },
    { day: "Sun", sales: 290 },
  ];

  const COLORS = [
    "hsl(221, 83%, 53%)",
    "hsl(150, 60%, 40%)",
    "hsl(38, 92%, 50%)",
    "hsl(280, 65%, 60%)",
    "hsl(0, 72%, 51%)",
    "hsl(199, 89%, 48%)",
    "hsl(340, 75%, 55%)",
  ];

  const NairaIcon = () => (
  <span className="font-bold text-lg text-primary flex items-center justify-center">
    ₦
  </span>
  );

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatNaira(totalRevenue)}
          icon={NairaIcon}
          trend={{ value: "12.5% vs last month", positive: true }}
        />
        <StatCard
          title="Profit"
          value={formatNaira(profit)}
          icon={TrendingUp}
          trend={{ value: "8.2% margin", positive: profit > 0 }}
        />
        <StatCard
          title="Total Products"
          value={String(totalProducts)}
          subtitle={`${totalStock} units in stock`}
          icon={Package}
        />
        <StatCard
          title="Low Stock Items"
          value={String(lowStockProducts.length)}
          subtitle="Need restocking"
          icon={AlertTriangle}
          className={lowStockProducts.length > 0 ? "border-warning/30" : ""}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Weekly Sales Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={salesByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip
                formatter={(value: number) => formatNaira(value)}
                contentStyle={{
                  backgroundColor: "hsl(0, 0%, 100%)",
                  border: "1px solid hsl(220, 13%, 91%)",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
              />
              <Bar dataKey="sales" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-4">Stock by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: "12px", borderRadius: "8px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {categoryData.slice(0, 6).map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sales & Low Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold text-sm mb-3">Recent Sales</h3>
          <div className="space-y-3">
            {sales.slice(-5).reverse().map(sale => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-xs font-medium">{sale.items.map(i => i.productName).join(", ")}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(sale.date).toLocaleDateString()} · {sale.paymentMethod}</p>
                </div>
                <span className="text-sm font-semibold font-mono">{formatNaira(sale.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <h3 className="font-semibold text-sm">Low Stock Alerts</h3>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">All items well stocked! ✓</p>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-xs font-medium">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground">{product.category} · Min: {product.minStock}</p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-destructive">{product.stock} left</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}