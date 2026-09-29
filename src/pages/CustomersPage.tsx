import { AppStore } from "@/lib/store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Mail, Phone, Users } from "lucide-react"; // Added Users icon
import { useToast } from "@/hooks/use-toast";

interface CustomersPageProps {
  store: AppStore;
}

export default function CustomersPage({ store }: CustomersPageProps) {
  const { customers, addCustomer } = store; 
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false); 
  const { toast } = useToast();

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddCustomer = async () => {
    if (!form.name.trim()) { 
      toast({ title: "Name is required", variant: "destructive" }); 
      return; 
    }

    setIsSubmitting(true);
    try {
      await addCustomer({
        name: form.name,
        email: form.email,
        phone: form.phone
      });

      setForm({ name: "", email: "", phone: "" });
      setDialogOpen(false);
      toast({ title: "Customer added successfully" });
    } catch (error) {
      console.error("Failed to add customer:", error);
      toast({ title: "Error", description: "Could not save customer to database", variant: "destructive" });
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
            placeholder="Search customers..." 
            className="pl-9 h-9 text-sm" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <Button size="sm" className="h-9" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Add Customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <Users className="w-12 h-12 mb-4 opacity-20" />
          <h3 className="text-sm font-semibold text-foreground">No customers yet</h3>
          <p className="text-xs max-w-[200px] text-center mt-1">
            Start building your client base by adding your first customer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(customer => (
            <div key={customer.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                  {customer.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold">{customer.name}</p>
                  <p className="text-[10px] text-muted-foreground">{customer.totalPurchases} purchases</p>
                </div>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {customer.email}</div>
                <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {customer.phone}</div>
              </div>
              <p className="text-[10px] text-muted-foreground">Last visit: {customer.lastVisit || 'Never'}</p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
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
            <Button 
              className="w-full" 
              onClick={handleAddCustomer}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Customer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}