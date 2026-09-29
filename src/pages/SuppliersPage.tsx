import { AppStore } from "@/lib/store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Mail, Phone, MapPin, Truck } from "lucide-react"; // Added Truck icon
import { useToast } from "@/hooks/use-toast";

interface SuppliersPageProps {
  store: AppStore;
}

export default function SuppliersPage({ store }: SuppliersPageProps) {
  const { suppliers, addSupplier } = store;
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const { toast } = useToast();

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddSupplier = async () => {
    if (!form.name.trim()) { 
      toast({ title: "Name is required", variant: "destructive" }); 
      return; 
    }

    setIsSubmitting(true);
    try {
      await addSupplier({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      });

      setForm({ name: "", email: "", phone: "", address: "" });
      setDialogOpen(false);
      toast({ title: "Supplier added successfully" });
    } catch (error) {
      console.error("Failed to add supplier:", error);
      toast({ 
        title: "Error", 
        description: "Could not save supplier to database", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-slide-in">
      <div className="flex gap-2 items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search suppliers..." 
            className="pl-9 h-9 text-sm" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <Button size="sm" className="h-9" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Supplier
        </Button>
      </div>

      {suppliers.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <Truck className="w-12 h-12 mb-4 opacity-20" />
          <h3 className="text-sm font-semibold text-foreground">No suppliers registered</h3>
          <p className="text-xs max-w-[200px] text-center mt-1">
            You'll need suppliers to link your products and manage stock orders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(supplier => (
            <div key={supplier.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold">{supplier.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {supplier.productsSupplied || 0} products supplied
                </p>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-3 h-3" /> {supplier.email || 'N/A'}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3 h-3" /> {supplier.phone || 'N/A'}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" /> {supplier.address || 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Name *</Label>
              <Input 
                className="mt-1 h-9 text-sm" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input 
                className="mt-1 h-9 text-sm" 
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })} 
              />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input 
                className="mt-1 h-9 text-sm" 
                value={form.phone} 
                onChange={e => setForm({ ...form, phone: e.target.value })} 
              />
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Input 
                className="mt-1 h-9 text-sm" 
                value={form.address} 
                onChange={e => setForm({ ...form, address: e.target.value })} 
              />
            </div>
            <Button 
              className="w-full" 
              onClick={handleAddSupplier}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Supplier"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}