import { useState } from "react";
import { AppStore, CartItem } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Smartphone, Receipt, User, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatNaira } from "@/lib/utils";

interface SalesPageProps {
  store: AppStore;
}

export default function SalesPage({ store }: SalesPageProps) {
  const { products, customers, addSale } = store;
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<string>("walk-in");
  const [taxRate] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mobile">("cash");
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  const { toast } = useToast();

  const filteredProducts = products.filter(p =>
    p.stock > 0 && (p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (product: typeof products[0]) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast({ title: "Insufficient stock", variant: "destructive" });
          return prev;
        }
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      if (newQty > item.product.stock) { toast({ title: "Insufficient stock", variant: "destructive" }); return item; }
      return { ...item, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  };

  const setItemDiscount = (productId: string, discount: number) => {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, discount: Math.max(0, discount) } : i));
  };

  const subtotal = cart.reduce((sum, i) => sum + (i.product.price * i.quantity) - i.discount, 0);
  const tax = subtotal * (taxRate / 100);
  const totalDiscount = cart.reduce((sum, i) => sum + i.discount, 0);
  const total = subtotal + tax;

  const completeSale = async () => {
    if (cart.length === 0) { 
      toast({ title: "Cart is empty", variant: "destructive" }); 
      return; 
    }

    try {
      const saleData = {
        items: cart.map(i => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
          discount: i.discount,
        })),
        subtotal,
        tax,
        discount: totalDiscount,
        total,
        paymentMethod,
        customerId: customerId === "walk-in" ? undefined : customerId,
        date: new Date().toISOString(),
        cashier: "Admin",
      };

      await addSale(saleData); 

      const customerName = customerId === "walk-in" ? "Walk-in Customer" : customers.find(c => c.id === customerId)?.name;

      setLastSale({ ...saleData, id: "TEMP-" + Math.random().toString(36).substr(2, 9), customerName });
      
      setCart([]);
      setCustomerId("walk-in");
      setReceiptOpen(true);
      toast({ title: "Sale completed!", description: `Total: ${formatNaira(total)}` });
    } catch (error) {
      console.error("Sale failed:", error);
      toast({ title: "Sale failed", description: "Check your database connection", variant: "destructive" });
    }
  };

  return (
    <div className="animate-slide-in flex flex-col lg:flex-row gap-4 h-[calc(100vh-7rem)]">
      {/* Product Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, SKU, or barcode..." className="pl-9 h-10 text-sm" value={search} onChange={e => setSearch(e.target.value)} autoFocus />
        </div>
        
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 content-start">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-40">
              <ShoppingCart className="w-12 h-12 mb-3" />
              <p className="text-sm font-medium">No products available for sale</p>
              <p className="text-[10px]">Add products with stock in the Products tab</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="bg-card border border-border rounded-lg p-3 text-left hover:border-primary/50 hover:shadow-sm transition-all group"
              >
                <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">{product.name}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{product.category}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold font-mono">{formatNaira(product.price)}</span>
                  <Badge variant={product.stock <= product.minStock ? "destructive" : "secondary"} className="text-[9px] px-1.5">
                    {product.stock} left
                  </Badge>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 bg-card border border-border rounded-xl flex flex-col">
        <div className="p-3 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Select Customer</span>
          </div>
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger className="h-9 text-xs bg-background">
              <SelectValue placeholder="Select Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk-in">Walk-in Customer</SelectItem>
              {customers.length > 0 ? (
                customers.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))
              ) : (
                <div className="p-2 text-[10px] text-muted-foreground italic flex items-center gap-1">
                   <AlertCircle className="w-3 h-3" /> No customers in DB
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Cart</h3>
          <Badge variant="secondary" className="ml-auto text-[10px]">{cart.length} items</Badge>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
          {cart.length === 0 ? (
            <p className="text-center text-muted-foreground text-xs py-8">Add products to cart</p>
          ) : cart.map(item => (
            <div key={item.product.id} className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{item.product.name}</p>
                  <p className="text-[10px] text-muted-foreground">{formatNaira(item.product.price)} each</p>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.product.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.product.id, -1)}><Minus className="w-3 h-3" /></Button>
                  <span className="w-8 text-center text-xs font-mono font-semibold">{item.quantity}</span>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => updateQuantity(item.product.id, 1)}><Plus className="w-3 h-3" /></Button>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    placeholder="Disc"
                    className="h-7 w-16 text-[10px] text-right"
                    value={item.discount || ""}
                    onChange={e => setItemDiscount(item.product.id, Number(e.target.value))}
                  />
                  <span className="text-xs font-semibold font-mono w-16 text-right">{formatNaira(item.product.price * item.quantity - item.discount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4 space-y-3">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">{formatNaira(subtotal)}</span></div>
            {totalDiscount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span className="font-mono text-success">-{formatNaira(totalDiscount)}</span></div>}
            <div className="flex justify-between"><span className="text-muted-foreground">Tax ({taxRate}%)</span><span className="font-mono">{formatNaira(tax)}</span></div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-border"><span>Total</span><span className="font-mono">{formatNaira(total)}</span></div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { method: "cash" as const, icon: Banknote, label: "Cash" },
              { method: "card" as const, icon: CreditCard, label: "Card" },
              { method: "mobile" as const, icon: Smartphone, label: "Mobile" },
            ].map(pm => (
              <Button
                key={pm.method}
                variant={paymentMethod === pm.method ? "default" : "outline"}
                size="sm"
                className="h-9 text-[10px] flex-col gap-0.5"
                onClick={() => setPaymentMethod(pm.method)}
              >
                <pm.icon className="w-3.5 h-3.5" />
                {pm.label}
              </Button>
            ))}
          </div>

          <Button className="w-full h-11 font-semibold" onClick={completeSale} disabled={cart.length === 0}>
            Complete Sale - {formatNaira(total)}
          </Button>
        </div>
      </div>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle className="text-center flex items-center justify-center gap-2"><Receipt className="w-4 h-4" /> Receipt</DialogTitle></DialogHeader>
          {lastSale && (
            <div className="text-xs space-y-2 font-mono">
              <div className="text-center border-b border-dashed border-border pb-2">
                <p className="font-bold text-sm">ShopFlow Suite</p>
                <p className="text-muted-foreground">{new Date(lastSale.date).toLocaleString()}</p>
                <p className="text-muted-foreground italic">Customer: {lastSale.customerName}</p>
                <p className="text-muted-foreground">Sale #{lastSale.id}</p>
              </div>
              <div className="space-y-1 border-b border-dashed border-border pb-2">
                {lastSale.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.quantity}x {item.productName}</span>
                    <span>{formatNaira(item.price * item.quantity - item.discount)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatNaira(lastSale.subtotal)}</span></div>
                <div className="flex justify-between"><span>Tax</span><span>{formatNaira(lastSale.tax)}</span></div>
                <div className="flex justify-between font-bold text-sm"><span>Total</span><span>{formatNaira(lastSale.total)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>Payment</span><span>{lastSale.paymentMethod}</span></div>
              </div>
              <p className="text-center text-muted-foreground pt-2">Thank you for your purchase!</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}