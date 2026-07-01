import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserPlus, LogIn, LogOut, Clock, Building, Phone, MapPin, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useQuery } from "@tanstack/react-query";

const COMMON_COMPANIES = [
  "UGEC", "MTN Uganda", "Airtel Uganda", "Umeme Limited", "NWSC",
  "Roke Telkom", "Simba Telecom", "Harris International", "Roko Construction",
  "Excel Construction", "Ssenyange Builders", "Other...",
];

const COMMON_PURPOSES = [
  "Server maintenance", "Network installation", "Electrical repair",
  "Plumbing repair", "Cleaning services", "Construction work",
  "Painting", "Fumigation", "Generator servicing", "AC repair",
  "Water tank cleaning", "Waste collection", "Other...",
];

const TemporaryWorkers = () => {
  const { toast } = useToast();
  const [activeWorkers, setActiveWorkers] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", company: "", id_number: "", purpose: "", supervised_by: "" });

  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .not("full_name", "is", null)
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const fetchActive = async () => {
    const { data } = await supabase
      .from("temp_worker_logs")
      .select("*, temp_workers(*)")
      .eq("status", "checked_in")
      .order("check_in_at", { ascending: false });
    setActiveWorkers(data || []);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("temp_worker_logs")
      .select("*, temp_workers(*)")
      .order("check_in_at", { ascending: false })
      .limit(20);
    setRecentLogs(data || []);
  };

  useEffect(() => { fetchActive(); fetchLogs(); }, []);

  const handleRegister = async () => {
    if (!form.full_name.trim()) {
      toast({ title: "Required", description: "Full name is required", variant: "destructive" });
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: worker, error } = await supabase.from("temp_workers").insert({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        id_number: form.id_number.trim() || null,
        purpose: form.purpose.trim() || null,
        supervised_by: form.supervised_by.trim() || null,
        created_by: user?.id,
      }).select().single();
      if (error) throw error;

      await supabase.from("temp_worker_logs").insert({
        temp_worker_id: worker.id,
        status: "checked_in",
        verified_by: user?.id,
        purpose: form.purpose.trim() || null,
      });

      toast({ title: "Registered & Checked In", description: `${form.full_name} has been registered and checked in.` });
      setShowNewDialog(false);
      setForm({ full_name: "", phone: "", company: "", id_number: "", purpose: "", supervised_by: "" });
      fetchActive();
      fetchLogs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCheckOut = async (logId: string, name: string) => {
    try {
      const { error } = await supabase
        .from("temp_worker_logs")
        .update({ check_out_at: new Date().toISOString(), status: "checked_out" })
        .eq("id", logId);
      if (error) throw error;
      toast({ title: "Checked Out", description: `${name} has been checked out.` });
      fetchActive();
      fetchLogs();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {activeWorkers.length} temporary worker{activeWorkers.length !== 1 ? "s" : ""} currently on site
          </p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} className="gap-2">
          <UserPlus className="h-4 w-4" /> Register New
        </Button>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <LogIn className="h-4 w-4" /> On Site ({activeWorkers.length})
          </TabsTrigger>
          <TabsTrigger value="recent" className="gap-2">
            <Clock className="h-4 w-4" /> Recent Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4 space-y-2">
          {activeWorkers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-slate-500 py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="font-semibold">No Temporary Workers On Site</p>
                <p className="text-sm mt-1">Register a new temporary worker or contractor to get started.</p>
              </CardContent>
            </Card>
          ) : (
            activeWorkers.map((log: any) => (
              <Card key={log.id} className="border border-emerald-200">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold uppercase text-sm truncate">{log.temp_workers?.full_name}</p>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[9px]">On Site</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {log.temp_workers?.company && (
                        <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {log.temp_workers.company}</span>
                      )}
                      {log.temp_workers?.phone && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {log.temp_workers.phone}</span>
                      )}
                      {log.purpose && (
                        <span>{log.purpose}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Since {format(new Date(log.check_in_at), "HH:mm")}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="gap-2 ml-4 shrink-0" onClick={() => handleCheckOut(log.id, log.temp_workers?.full_name)}>
                    <LogOut className="h-3 w-3" /> Check Out
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="recent" className="mt-4 space-y-2">
          {recentLogs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center text-slate-500 py-12">
                <p className="font-semibold">No Recent Activity</p>
              </CardContent>
            </Card>
          ) : (
            recentLogs.map((log: any) => (
              <Card key={log.id} className="border border-slate-200">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm uppercase">{log.temp_workers?.full_name}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      {log.temp_workers?.company && <span>{log.temp_workers.company}</span>}
                      <span>In: {format(new Date(log.check_in_at), "HH:mm")}</span>
                      {log.check_out_at && <span>Out: {format(new Date(log.check_out_at), "HH:mm")}</span>}
                    </div>
                  </div>
                  <Badge variant={log.status === "checked_in" ? "default" : "secondary"} className="text-[9px]">
                    {log.status === "checked_in" ? "On Site" : "Departed"}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register Temporary Worker</DialogTitle>
            <DialogDescription>Contractors, technicians, and other temporary personnel</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="e.g. John Mukasa" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+256..." />
              </div>
              <div>
                <Label>Company</Label>
                <SearchableSelect
                  value={form.company}
                  onValueChange={(v) => setForm({ ...form, company: v })}
                  options={[
                    ...COMMON_COMPANIES.map((c) => ({ value: c, label: c })),
                  ]}
                  placeholder="Select or type company..."
                  searchPlaceholder="Search companies..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>ID Number</Label>
                <Input value={form.id_number} onChange={(e) => setForm({ ...form, id_number: e.target.value })} placeholder="National ID / NIN" />
              </div>
              <div>
                <Label>Supervised By</Label>
                <SearchableSelect
                  value={form.supervised_by}
                  onValueChange={(v) => setForm({ ...form, supervised_by: v })}
                  options={staffList.map((s) => ({ value: s.full_name, label: s.full_name }))}
                  placeholder="Select staff member..."
                  searchPlaceholder="Search staff..."
                />
              </div>
            </div>
            <div>
              <Label>Purpose</Label>
              <SearchableSelect
                value={form.purpose}
                onValueChange={(v) => setForm({ ...form, purpose: v })}
                options={COMMON_PURPOSES.map((p) => ({ value: p, label: p }))}
                placeholder="Select purpose..."
                searchPlaceholder="Search purposes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button onClick={handleRegister}>Register & Check In</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemporaryWorkers;
