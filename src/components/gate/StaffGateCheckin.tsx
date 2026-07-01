import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Search, User, LogIn, LogOut, Phone, Shield, Fingerprint, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const StaffGateCheckin = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState<string | null>(null);
  const [biometricCheckins, setBiometricCheckins] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const loadBiometric = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("staff_attendance")
        .select("*, profiles:user_id(full_name, phone, role)")
        .eq("date", today)
        .eq("source", "hikvision")
        .order("check_in", { ascending: false })
        .limit(10);
      setBiometricCheckins(data || []);
    };
    loadBiometric();
    const interval = setInterval(loadBiometric, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleBiometricSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/hikvision/sync", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      toast({
        title: data.synced ? "Sync Complete" : "Sync Failed",
        description: `${data.synced || 0} records synced${data.failed ? `, ${data.failed} failed` : ""}`,
        variant: data.synced > 0 ? "default" : "destructive",
      });
      const today = new Date().toISOString().split("T")[0];
      const { data: fresh } = await supabase
        .from("staff_attendance")
        .select("*, profiles:user_id(full_name, phone, role)")
        .eq("date", today)
        .eq("source", "hikvision")
        .order("check_in", { ascending: false })
        .limit(10);
      setBiometricCheckins(fresh || []);
    } catch (err: any) {
      toast({ title: "Sync Error", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = async () => {
    const q = search.trim();
    if (!q) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, phone, role, email, designation")
        .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(10);
      setResults(data || []);
      if (!data?.length) {
        toast({ title: "Not Found", description: `No staff matching "${q}"`, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (staffId: string, name: string) => {
    setWorking(staffId);
    try {
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("staff_attendance")
        .select("id")
        .eq("user_id", staffId)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("staff_attendance")
          .update({ check_out: new Date().toISOString(), status: "present" })
          .eq("id", existing.id);
        toast({ title: "Checked Out", description: `${name} checked out.` });
      } else {
        await supabase.from("staff_attendance").insert({
          user_id: staffId,
          status: "present",
          check_in: new Date().toISOString(),
          date: today,
        });
        toast({ title: "Checked In", description: `${name} checked in.` });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setWorking(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Staff Gate Check-in/out
          </CardTitle>
          <CardDescription>Search for staff by name, email, or phone to check them in or out</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search staff name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="h-10"
            />
            <Button onClick={handleSearch} disabled={loading} className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Fingerprint className="h-4 w-4" />
              Biometric Check-ins Today
            </CardTitle>
            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={handleBiometricSync} disabled={syncing}>
              <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Device"}
            </Button>
          </div>
          <CardDescription>Staff who checked in via fingerprint at the gate</CardDescription>
        </CardHeader>
        <CardContent>
          {biometricCheckins.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Fingerprint className="h-6 w-6 mx-auto mb-1 opacity-40" />
              <p className="text-xs">No biometric check-ins yet today</p>
              <p className="text-[10px]">Fingerprint sync runs automatically every 30s</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {biometricCheckins.map((b) => (
                <div key={b.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-green-50 border border-green-100">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-3.5 w-3.5 text-green-600" />
                    <div>
                      <p className="text-xs font-medium">{b.profiles?.full_name || "Unknown"}</p>
                      <p className="text-[10px] text-muted-foreground">{b.profiles?.role || ""}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-green-700">{b.check_in ? format(new Date(b.check_in), "HH:mm") : ""}</p>
                    <Badge variant="outline" className="text-[8px] text-green-600 border-green-200 bg-green-50">device</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((staff) => (
            <Card key={staff.id} className="border border-slate-200">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-bold text-sm uppercase">{staff.full_name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <Badge variant="outline" className="text-[9px] uppercase">{staff.role}</Badge>
                      {staff.designation && <span>{staff.designation}</span>}
                      {staff.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {staff.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={working === staff.id}
                  onClick={() => handleCheckIn(staff.id, staff.full_name)}
                  className="gap-2"
                >
                  {working === staff.id ? (
                    <>...</>
                  ) : (
                    <><LogIn className="h-3 w-3" /> Check In/Out</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffGateCheckin;
