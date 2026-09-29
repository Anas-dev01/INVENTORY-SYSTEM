import { AppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Search, AlertTriangle, ArrowUpDown, Package } from "lucide-react"; // Added Package icon
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { formatNaira } from "@/lib/utils";

interface InventoryPageProps {
  store: AppStore;
}

export default function InventoryPage({ store }: InventoryPageProps) {
  const { products, updateProduct } = store;
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"stock" | "name">("stock");
  const [restockProduct, setRestockProduct] = useState<typeof products[0] | null>(null);
  const [restockQty, setRestockQty] = useState(0);
  const { toast } = useToast();

  const sorted = [...products]
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === "stock" ? a.stock - b.stock : a.name.localeCompare(b.name));

  const handleRestock = () => {
    if (!restockProduct || restockQty <= 0) return;
    updateProduct(restockProduct.id, { stock: restockProduct.stock + restockQty });
    toast({ title: `Restocked ${restockProduct.name}`, description: `Added ${restockQty} units` });
    setRestockProduct(null);
    setRestockQty(0);
  };

  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const totalCostValue = products.reduce((sum, p) => sum + p.cost * p.stock, 0);

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Stock Value</p>
          <p className="text-xl font-bold font-mono mt-1">{formatNaira(totalValue)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Cost Value</p>
          <p className="text-xl font-bold font-mono mt-1">{formatNaira(totalCostValue)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Potential Profit</p>
          <p className="text-xl font-bold font-mono mt-1 text-success">
            {formatNaira(totalValue - totalCostValue)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search inventory..." className="pl-9 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" className="h-9" onClick={() => setSortBy(s => s === "stock" ? "name" : "stock")}>
          <ArrowUpDown className="w-3.5 h-3.5 mr-1" /> {sortBy === "stock" ? "By Stock" : "By Name"}
        </Button>
      </div>

      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed border-border py-16 flex flex-col items-center justify-center text-muted-foreground">
            <Package className="w-10 h-10 mb-2 opacity-20" />
            <p className="text-xs font-medium">Your inventory is empty</p>
          </div>
        ) : (
          sorted.map(product => {
            const stockRatio = Math.min(100, (product.stock / (product.minStock * 3)) * 100);
            const isLow = product.stock <= product.minStock;
            return (
              <div key={product.id} className={`bg-card rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${isLow ? "border-warning/40" : "border-border"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    {isLow && <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{product.category} · {product.sku} · Supplier: {product.supplier}</p>
                </div>
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-32">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Stock</span>
                      <span className={`font-mono font-medium ${isLow ? "text-destructive" : ""}`}>{product.stock}/{product.minStock * 3}</span>
                    </div>
                    <Progress value={stockRatio} className="h-1.5" />
                  </div>
                  <Badge variant={isLow ? "destructive" : "secondary"} className="text-[10px] whitespace-nowrap">
                    {isLow ? "Low Stock" : "In Stock"}
                  </Badge>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => { setRestockProduct(product); setRestockQty(product.minStock * 2); }}>
                    Restock
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!restockProduct} onOpenChange={() => setRestockProduct(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Restock {restockProduct?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground">Current stock: {restockProduct?.stock} · Min: {restockProduct?.minStock}</p>
            <div><Label className="text-xs">Quantity to Add</Label><Input type="number" className="mt-1 h-9" value={restockQty} onChange={e => setRestockQty(Number(e.target.value))} /></div>
            <Button className="w-full" onClick={handleRestock}>Confirm Restock</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}