// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uuidToShortId } from "@/lib/shortId";
import { Search, CheckCircle, XCircle, Clock, AlertCircle, Printer } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const GatePassVerification = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { data: appointments = [] } = useQuery({
    queryKey: ["all-appointments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("status", "checked_in");
      if (error) throw error;
      return data || [];
    },
  });

  const handleVerify = async (query: string) => {
    if (!query.trim()) {
      toast({ title: "Error", description: "Please enter a gate PIN or appointment ID", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const cleanQuery = query.toUpperCase().trim();
      
      const found = appointments.find(
        (a) => uuidToShortId(a.id) === cleanQuery || a.id === query
      );

      if (!found) {
        setResult({
          valid: false,
          message: "Gate pass not found",
          details: "This appointment ID or gate pass was not found in the system.",
        });
        return;
      }

      // Check if appointment is still valid (checked_in and recent)
      const checkedInTime = new Date(found.checked_in_at);
      const now = new Date();
      const minutesAgo = (now.getTime() - checkedInTime.getTime()) / (1000 * 60);

      // Gate pass valid for 8 hours
      if (minutesAgo > 480) {
        setResult({
          valid: false,
          message: "Gate pass expired",
          details: `This pass was issued ${Math.floor(minutesAgo / 60)} hours ago and has expired.`,
          appointment: found,
        });
        return;
      }

      setResult({
        valid: true,
        message: "Gate pass verified ✓",
        details: "This is a valid and active gate pass.",
        appointment: found,
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout title="Gate Pass Verification" subtitle="Scan and verify printed gate passes">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Printer className="h-5 w-5" /> Verify Gate Pass
            </CardTitle>
            <CardDescription>
              Scan the gate PIN code or appointment ID from the printed pass to verify authenticity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleVerify(search);
              }}
              className="space-y-4"
            >
              <div className="flex gap-2">
                <Input
                  placeholder="Enter gate PIN (e.g., 1234) or Appointment ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="text-lg font-mono"
                  autoFocus
                />
                <Button type="submit" disabled={loading} className="gap-2 px-6 rounded-xl">
                  <Search className="h-4 w-4" /> {loading ? "Verifying..." : "Verify"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card
            className={`border-2 ${
              result.valid ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
            }`}
          >
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                {result.valid ? (
                  <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                ) : (
                  <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                )}
                <div className="flex-1">
                  <p className={`text-xl font-bold ${result.valid ? "text-emerald-700" : "text-red-700"}`}>
                    {result.message}
                  </p>
                  <p className={`text-sm mt-1 ${result.valid ? "text-emerald-600" : "text-red-600"}`}>
                    {result.details}
                  </p>
                </div>
              </div>

              {result.appointment && (
                <div className="bg-white rounded-lg p-4 space-y-3 border border-slate-200 mt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Visitor</p>
                      <p className="text-lg font-bold text-slate-900">{result.appointment.visitor_name}</p>
                    </div>
                    <Badge
                      className={
                        result.valid
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      }
                      variant="outline"
                    >
                      {result.valid ? "Valid" : "Invalid"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Visiting</p>
                      <p className="text-sm font-semibold text-slate-700">{result.appointment.host_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Purpose</p>
                      <p className="text-sm font-semibold text-slate-700">{result.appointment.purpose}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Checked In</p>
                      <p className="text-sm font-mono text-slate-700">
                        {format(new Date(result.appointment.checked_in_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold">Appointment ID</p>
                      <p className="text-sm font-mono font-bold text-slate-900">{uuidToShortId(result.appointment.id) || "—"}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setResult(null);
                }}
                className="w-full rounded-xl"
              >
                Clear & Verify Another Pass
              </Button>
            </CardContent>
          </Card>
        )}

        {!result && (
          <Card className="border-dashed border-2">
            <CardContent className="pt-6 text-center text-slate-500 py-12">
              <Printer className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="font-semibold">Enter a gate PIN or appointment ID to verify</p>
              <p className="text-sm mt-1">Gate passes are valid for 8 hours after check-in</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GatePassVerification;
