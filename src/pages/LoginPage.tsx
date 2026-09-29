import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Access Denied",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    } else {
      toast({ title: "Welcome back, Admin", description: "System initialized." });
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />

      {/* Main Card - Switched to White (bg-white/90) */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-white rounded-2xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-primary/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Flow Inventory System</h1>
          <p className="text-[10px] text-slate-500 mt-1 font-mono uppercase tracking-widest">Secure Admin Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Email</Label>
            <Input 
              type="email" 
              placeholder="Enter email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-slate-50 border-slate-200 h-11 text-slate-900 placeholder:text-slate-400 focus:ring-primary"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Password</Label>
            <Input 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-slate-50 border-slate-200 h-11 text-slate-900 placeholder:text-slate-400 focus:ring-primary"
            />
          </div>

          <Button className="w-full h-11 font-semibold text-base shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white" disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <> Login </>}
          </Button>
        </form>

        <p className="text-[9px] text-center text-slate-400 mt-8 uppercase tracking-[0.2em] font-medium">
          Authorized Users Only
        </p>
      </div>
    </div>
  );
}