import { useState } from "react";
import { AppStore, CATEGORIES, Product } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatNaira } from "@/lib/utils"; // Import the formatter

interface ProductsPageProps {
  store: AppStore;
}

const emptyProduct = {
  name: "", sku: "", category: "Other", price: 0, cost: 0, stock: 0, minStock: 10, unit: "pcs", supplier: "", barcode: "",
};

export default function ProductsPage({ store }: ProductsPageProps) {
  const { products, suppliers, addProduct, updateProduct, deleteProduct } = store;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const { toast } = useToast();

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const openAdd = () => { setEditingProduct(null); setForm(emptyProduct); setDialogOpen(true); };
  const openEdit = (p: Product) => { setEditingProduct(p); setForm({ name: p.name, sku: p.sku, category: p.category, price: p.price, cost: p.cost, stock: p.stock, minStock: p.minStock, unit: p.unit, supplier: p.supplier, barcode: p.barcode || "" }); setDialogOpen(true); };

  const handleSave = () => {
    if (!form.name.trim() || !form.sku.trim()) {
      toast({ title: "Validation Error", description: "Name and SKU are required.", variant: "destructive" });
      return;
    }
    if (form.price < 0 || form.cost < 0) {
      toast({ title: "Validation Error", description: "Price and cost must be positive.", variant: "destructive" });
      return;
    }
    if (editingProduct) {
      updateProduct(editingProduct.id, form);
      toast({ title: "Product updated successfully" });
    } else {
      addProduct(form);
      toast({ title: "Product added successfully" });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Delete "${name}"?`)) {
      deleteProduct(id);
      toast({ title: "Product deleted" });
    }
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products..." className="pl-9 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9" onClick={openAdd}><Plus className="w-4 h-4 mr-1" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="col-span-2"><Label className="text-xs">Name *</Label><Input className="mt-1 h-9 text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label className="text-xs">SKU *</Label><Input className="mt-1 h-9 text-sm" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
              <div><Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs">Sell Price (₦)</Label><Input type="number" className="mt-1 h-9 text-sm" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Cost (₦)</Label><Input type="number" className="mt-1 h-9 text-sm" value={form.cost} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Stock</Label><Input type="number" className="mt-1 h-9 text-sm" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Min Stock</Label><Input type="number" className="mt-1 h-9 text-sm" value={form.minStock} onChange={e => setForm({ ...form, minStock: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Unit</Label><Input className="mt-1 h-9 text-sm" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
              
              <div>
                <Label className="text-xs">Supplier</Label>
                <Select value={form.supplier} onValueChange={v => setForm({ ...form, supplier: v })}>
                  <SelectTrigger className="mt-1 h-9 text-sm">
                    <SelectValue placeholder={suppliers.length === 0 ? "No Suppliers Found" : "Select Supplier"} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.length === 0 ? (
                      <div className="p-2 text-xs text-muted-foreground flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Add a supplier first
                      </div>
                    ) : (
                      suppliers.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
              </div>

            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave}>{editingProduct ? "Update" : "Add"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">SKU</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Category</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Price</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Stock</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(product => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground">{product.supplier}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{product.sku}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="text-[10px] font-normal">{product.category}</Badge></td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{formatNaira(product.price)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-mono text-xs font-medium ${product.stock <= product.minStock ? "text-destructive" : "text-foreground"}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(product)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(product.id, product.name)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No products found.</p>}
      </div>
    </div>
  );
}