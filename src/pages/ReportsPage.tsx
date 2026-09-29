import { AppStore } from "@/lib/store";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Filter } from "lucide-react";
import { formatNaira } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ReportsPageProps {
  store: AppStore;
}

export default function ReportsPage({ store }: ReportsPageProps) {
  const { sales, products, customers, suppliers, totalRevenue, totalCost, loading } = store;
  const [filterMonth, setFilterMonth] = useState<string>("all");

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Crunching your numbers...</p>
      </div>
    );
  }

  // --- DATA FILTERING LOGIC ---
  const filteredSales = sales.filter(s => {
    if (filterMonth === "all") return true;
    const saleDate = new Date(s.date);
    return saleDate.getMonth().toString() === filterMonth;
  });

  // --- ANALYTICS CALCULATIONS ---
  const safeRevenue = totalRevenue || 0;
  const safeCost = totalCost || 0;
  const profit = safeRevenue - safeCost;
  const margin = safeRevenue > 0 ? (profit / safeRevenue) * 100 : 0;

  // Top Customers by Spending
  const customerSpending = sales.reduce((acc, s) => {
    const customerName = customers.find(c => c.id === s.customerId)?.name || "Walk-in Customer";
    const existing = acc.find(c => c.name === customerName);
    if (existing) existing.total += Number(s.total || 0);
    else acc.push({ name: customerName, total: Number(s.total || 0) });
    return acc;
  }, [] as { name: string; total: number }[]).sort((a, b) => b.total - a.total);

  // Top Suppliers by Inventory Value Supplied
  const supplierValue = products.reduce((acc, p) => {
    const existing = acc.find(s => s.name === p.supplier);
    const value = (p.cost || 0) * (p.stock || 0);
    if (existing) existing.total += value;
    else acc.push({ name: p.supplier || "Unknown", total: value });
    return acc;
  }, [] as { name: string; total: number }[]).sort((a, b) => b.total - a.total);

  const paymentData = sales.reduce((acc, s) => {
    const existing = acc.find(p => p.method === s.paymentMethod);
    if (existing) { existing.total += Number(s.total || 0); existing.count += 1; }
    else acc.push({ method: s.paymentMethod, total: Number(s.total || 0), count: 1 });
    return acc;
  }, [] as { method: string; total: number; count: number }[]);

  const productRevenue = sales.flatMap(s => s.items).reduce((acc, item) => {
    const existing = acc.find(p => p.name === item.productName);
    if (existing) { existing.revenue += Number(item.price || 0) * item.quantity; existing.qty += item.quantity; }
    else acc.push({ name: item.productName, revenue: Number(item.price || 0) * item.quantity, qty: item.quantity });
    return acc;
  }, [] as { name: string; revenue: number; qty: number }[]).sort((a, b) => b.revenue - a.revenue);

  const dailyData = sales.reduce((acc, s) => {
    const date = new Date(s.date).toLocaleDateString();
    const existing = acc.find(d => d.date === date);
    if (existing) existing.total += Number(s.total || 0);
    else acc.push({ date, total: Number(s.total || 0) });
    return acc;
  }, [] as { date: string; total: number }[]).reverse();

  // --- DOWNLOAD FUNCTION (FIXED GIBBERISH) ---
  const downloadCSV = () => {
    // 1. Added "Time" as its own header
    const headers = ['"Date"', '"Time"', '"Customer"', '"Description"', '"Method"', '"Total (NGN)"'];
    
    const rows = filteredSales.map(s => {
      const saleDate = new Date(s.date);
      
      // 2. Split Date and Time into two strings
      const datePart = saleDate.toLocaleDateString(); // e.g., 3/24/2026
      const timePart = saleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }); // e.g., 12:33:48 PM
      
      const custName = customers.find(c => c.id === s.customerId)?.name || "Walk-in Customer";
      const desc = s.items.map(i => `${i.quantity}x ${i.productName}`).join(" | ");
      const method = s.paymentMethod || "N/A";
      const totalAmt = Number(s.total || 0).toFixed(2);

      // 3. Return as separate quoted columns
      return [`"${datePart}"`, `"${timePart}"`, `"${custName}"`, `"${desc}"`, `"${method}"`, `"${totalAmt}"`];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Sales_Report_${filterMonth === 'all' ? 'Full' : 'Month_' + filterMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-slide-in pb-10">
      {/* P&L Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</p>
          <p className="text-xl font-bold font-mono mt-1">{formatNaira(safeRevenue)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cost of Goods</p>
          <p className="text-xl font-bold font-mono mt-1">{formatNaira(safeCost)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net Profit</p>
          <p className={`text-xl font-bold font-mono mt-1 ${profit >= 0 ? "text-success" : "text-destructive"}`}>
            {formatNaira(profit)}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Profit Margin</p>
          <p className="text-xl font-bold font-mono mt-1">{margin.toFixed(1)}%</p>
        </div>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="sales" className="text-xs">Sales Trends</TabsTrigger>
          <TabsTrigger value="products" className="text-xs">Top Products</TabsTrigger>
          <TabsTrigger value="customers" className="text-xs">Top Customers</TabsTrigger>
          <TabsTrigger value="suppliers" className="text-xs">Top Suppliers</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="sales">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">Daily Sales Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatNaira(value)} />
                <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">Top Customers by Spending</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerSpending.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip formatter={(value: number) => formatNaira(value)} />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="suppliers">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">Top Suppliers by Inventory Value</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supplierValue.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip formatter={(value: number) => formatNaira(value)} />
                <Bar dataKey="total" fill="hsl(150, 60%, 40%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">Top Products by Revenue</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productRevenue.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                <Tooltip formatter={(value: number) => formatNaira(value)} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="payments">
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-sm mb-4">Sales by Payment Method</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="method" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatNaira(value)} />
                <Bar dataKey="total" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>

      {/* Sales History Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex flex-col sm:flex-row justify-between items-center gap-2">
          <h3 className="font-semibold text-sm">Sales History</h3>
          <div className="flex items-center gap-2">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <Filter className="w-3 h-3 mr-2" />
                <SelectValue placeholder="Filter Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="0">January</SelectItem>
                <SelectItem value="1">February</SelectItem>
                <SelectItem value="2">March</SelectItem>
                <SelectItem value="3">April</SelectItem>
                <SelectItem value="4">May</SelectItem>
                <SelectItem value="5">June</SelectItem>
                <SelectItem value="6">July</SelectItem>
                <SelectItem value="7">August</SelectItem>
                <SelectItem value="8">September</SelectItem>
                <SelectItem value="9">October</SelectItem>
                <SelectItem value="10">November</SelectItem>
                <SelectItem value="11">December</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={downloadCSV}>
              <Download className="w-3 h-3 mr-2" /> Download CSV
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Method</th>
                <th className="text-right px-4 py-3 text-xs font-medium uppercase text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.slice().reverse().map(sale => {
                const customerName = customers.find(c => c.id === sale.customerId)?.name || "Walk-in Customer";
                return (
                  <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-3 text-xs">{new Date(sale.date).toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs font-medium">{customerName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground italic">
                      {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(", ")}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="capitalize bg-muted px-2 py-1 rounded text-[10px]">{sale.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono font-bold text-right">{formatNaira(Number(sale.total || 0))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredSales.length === 0 && <p className="text-center py-10 text-muted-foreground text-xs italic">No sales recorded for this period.</p>}
        </div>
      </div>
    </div>
  );
}