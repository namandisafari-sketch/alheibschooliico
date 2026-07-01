// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Search, CheckCircle2, XCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Essentials = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clearances = [], isLoading } = useQuery({
    queryKey: ["matron-essentials"],
    queryFn: async () => {
      const { data } = await supabase
        .from("holiday_arrival_clearances")
        .select("*, learner:learners(full_name, admission_number, class_name)")
        .order("arrival_date", { ascending: false });
      return data || [];
    },
  });

  const filtered = clearances.filter((c) =>
    c.learner?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.learner?.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const essentialFields = [
    { key: "school_uniforms", label: "Uniforms" },
    { key: "sweater", label: "Sweater" },
    { key: "shoes", label: "Shoes" },
    { key: "stockings", label: "Stockings" },
    { key: "track_suits", label: "Track Suits" },
    { key: "vests", label: "Vests" },
    { key: "casual_wears", label: "Casual Wears" },
    { key: "cap_veils", label: "Caps/Veils" },
    { key: "underwear_pants", label: "Underwear" },
    { key: "kanzu_hijab", label: "Kanzu/Hijab" },
  ];

  return (
    <DashboardLayout title="Learner Essentials" subtitle="Track learner belongings & essential items">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by learner name or admission..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {filtered.length} clearance record{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading essentials...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center border-2 border-dashed rounded-lg">
              <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">
                {searchTerm ? "No records match your search." : "No arrival clearance records found."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Essential Items Per Learner</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Learner</TableHead>
                    <TableHead>Class</TableHead>
                    {essentialFields.map((f) => (
                      <TableHead key={f.key} className="text-center text-[10px] uppercase">{f.label}</TableHead>
                    ))}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => {
                    const totalItems = essentialFields.reduce((sum, f) => sum + (Number(c[f.key]) || 0), 0);
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{c.learner?.full_name}</span>
                            <span className="text-xs text-muted-foreground">{c.learner?.admission_number}</span>
                          </div>
                        </TableCell>
                        <TableCell>{c.learner?.class_name || "—"}</TableCell>
                        {essentialFields.map((f) => (
                          <TableCell key={f.key} className="text-center">
                            {Number(c[f.key]) > 0 ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 inline" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground/30 inline" />
                            )}
                          </TableCell>
                        ))}
                        <TableCell>
                          <Badge variant={totalItems > 0 ? "default" : "outline"} className="text-[10px]">
                            {totalItems > 0 ? `${totalItems} items` : "None"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Essentials;
