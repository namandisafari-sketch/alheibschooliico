
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DatabaseHealthCheck() {
  const { role, user } = useAuth();
  const [stats, setStats] = useState<Record<string, number | string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const tables = ["learners", "profiles", "classes", "user_roles", "guardians", "staff", "attendance"];
      const results: Record<string, number | string> = {};
      
      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });
        
        if (error) {
          results[table] = "Error: " + error.message;
        } else {
          results[table] = count || 0;
        }
      }
      setStats(results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      fetchStats();
    }
  }, [role, user?.email]);

  if (role !== "admin") return null;

  return (
    <Card className="mt-8 border-2 border-dashed border-slate-300 bg-slate-50/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600" />
            Database Connectivity Debug
          </div>
          <Button variant="ghost" size="sm" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(stats).map(([table, count]) => (
            <div key={table} className="p-3 bg-white rounded-lg border shadow-sm">
              <p className="text-[10px] font-black uppercase text-slate-500 mb-1">{table}</p>
              <p className={cn(
                "text-xl font-black",
                typeof count === 'string' ? "text-red-500 text-xs" : "text-slate-900"
              )}>
                {count}
              </p>
            </div>
          ))}
        </div>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-[10px] font-bold text-blue-700 uppercase leading-relaxed">
          <p>Admin Email: {user?.email}</p>
          <p>Auth Role: {role}</p>
          <p className="mt-1">If all counts are 0 and you expect data, RLS may be blocking you or migrations haven't run.</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper to use in any file
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}
