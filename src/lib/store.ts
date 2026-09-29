import { useState, useCallback, useEffect } from "react";
import { supabase } from "./supabase";

// --- INTERFACES (UNCHANGED) ---
export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  supplier: string;
  barcode?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface Sale {
  id: string;
  items: { productId: string; productName: string; quantity: number; price: number; discount: number }[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: "cash" | "card" | "mobile";
  customerId?: string;
  date: string;
  cashier: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalPurchases: number;
  lastVisit: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  productsSupplied: number;
}

export const CATEGORIES = ["Electronics", "Groceries", "Beverages", "Pharmacy", "Clothing", "Household", "Stationery", "Other"];

// --- THE LIVE STORE HOOK ---
export function useAppStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. FETCHING DATA ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    
    const { data: pData } = await supabase.from('products').select('*').order('name');
    if (pData) setProducts(pData.map((p: any) => ({ ...p, minStock: p.min_stock, createdAt: p.created_at })));

    const { data: cData } = await supabase.from('customers').select('*').order('name');
    if (cData) setCustomers(cData.map((c: any) => ({ ...c, totalPurchases: c.total_purchases, lastVisit: c.last_visit })));

    const { data: sData } = await supabase.from('suppliers').select('*').order('name');
    if (sData) setSuppliers(sData.map((s: any) => ({ ...s, productsSupplied: s.products_supplied })));

    // Fetch Sales (Includes Sale Items)
    const { data: salesData } = await supabase.from('sales').select('*, sale_items(*)').order('date', { ascending: false });
    if (salesData) {
      setSales(salesData.map((s: any) => ({
        ...s,
        paymentMethod: s.payment_method, 
        customerId: s.customer_id, // CRITICAL FIX: Maps DB customer_id to frontend customerId
        items: s.sale_items.map((item: any) => ({
          productId: item.product_id,
          productName: item.product_name,
          quantity: item.quantity,
          price: item.price,
          discount: item.discount
        }))
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- 2. ACTIONS ---
  const addProduct = async (product: Omit<Product, "id" | "createdAt">) => {
    const { error } = await supabase
      .from('products')
      .insert([{
        name: product.name,
        sku: product.sku,
        category: product.category,
        price: product.price,
        cost: product.cost,
        stock: product.stock,
        min_stock: product.minStock, 
        unit: product.unit,
        supplier: product.supplier,
        barcode: product.barcode
      }]);

    if (error) {
      console.error("Supabase Insert Error:", error);
      alert("Error adding product: " + error.message);
    } else {
      fetchData(); 
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const dbUpdates: any = { ...updates };
    if (updates.minStock !== undefined) {
      dbUpdates.min_stock = updates.minStock;
      delete dbUpdates.minStock;
    }
    
    const { error } = await supabase.from('products').update(dbUpdates).eq('id', id);
    if (error) console.error("Update Error:", error);
    fetchData();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id);
    fetchData();
  };

  const addCustomer = async (customer: Omit<Customer, "id" | "totalPurchases" | "lastVisit">) => {
    await supabase.from('customers').insert([customer]);
    fetchData();
  };

  const addSupplier = async (supplier: Omit<Supplier, "id" | "productsSupplied">) => {
    await supabase.from('suppliers').insert([supplier]);
    fetchData();
  };

  const addSale = async (sale: Omit<Sale, "id">) => {
    const { data: newSale, error: sError } = await supabase.from('sales').insert([{
      subtotal: sale.subtotal, tax: sale.tax, discount: sale.discount,
      total: sale.total, payment_method: sale.paymentMethod,
      customer_id: sale.customerId, cashier: sale.cashier
    }]).select().single();

    if (sError) return console.error(sError);

    const itemsToInsert = sale.items.map(item => ({
      sale_id: newSale.id, product_id: item.productId,
      product_name: item.productName, quantity: item.quantity,
      price: item.price, discount: item.discount
    }));
    await supabase.from('sale_items').insert(itemsToInsert);

    for (const item of sale.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        await supabase.from('products')
          .update({ stock: Math.max(0, product.stock - item.quantity) })
          .eq('id', item.productId);
      }
    }
    fetchData();
  };

  // --- 3. ANALYTICS ---
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total || 0), 0);
  
  const totalCost = sales.reduce((sum, s) => {
    return sum + s.items.reduce((iSum, item) => {
      const product = products.find(p => p.id === item.productId);
      return iSum + (product ? Number(product.cost || 0) * item.quantity : 0);
    }, 0);
  }, 0);

  const todaySalesCount = sales.filter(s => new Date(s.date).toDateString() === new Date().toDateString()).length;

  return {
    products, sales, customers, suppliers, loading,
    addProduct, updateProduct, deleteProduct, addSale, addCustomer, addSupplier,
    lowStockProducts, totalRevenue, totalCost, todaySalesCount, fetchData
  };
}

export type AppStore = ReturnType<typeof useAppStore>;