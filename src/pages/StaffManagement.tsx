
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useStaff } from "@/hooks/useStaff";
import { useGeoDistricts } from "@/hooks/useGeoNames";
import { LocationSelector } from "@/components/common/LocationSelector";
import { useSchools } from "@/hooks/useSchools";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, MapPin, School as SchoolIcon, Users, Settings2, Globe } from "lucide-react";

export default function StaffManagement() {
  const { role: currentUserRole, profile: currentUserProfile } = useAuth();
  const { data: staff = [], refetch } = useStaff();
  const { data: schools = [] } = useSchools();
  
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [form, setForm] = useState({
    scope: "school",
    district_id: "",
    school_id: "",
    role: "staff"
  });

  const handleEdit = (user: any) => {
    setEditingStaff(user);
    setForm({
      scope: user.scope || "school",
      district_id: user.district_id || "",
      school_id: user.school_id || "",
      role: user.role || "staff"
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          scope: form.scope,
          district_id: form.scope === "district" ? form.district_id : null,
          school_id: form.scope === "school" ? form.school_id : null
        })
        .eq("id", editingStaff.id);

      if (profileError) throw profileError;

      // Update role
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert([{
          user_id: editingStaff.id,
          role: form.role
        }] as any, { onConflict: "user_id" });

      if (roleError) throw roleError;

      toast.success("Staff assignment updated successfully");
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (currentUserRole !== "admin" || currentUserProfile?.scope !== "global") {
    return (
      <DashboardLayout title="Access Denied">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <Shield className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold">Global Admin Access Required</h1>
          <p className="text-muted-foreground">You do not have permission to manage hierarchical assignments.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Hierarchical Staff Management" 
      subtitle="Assign organizational scope and permissions to users"
    >
      <div className="grid gap-6">
        <Card className="border-none shadow-xl bg-slate-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary" />
                  Staff Directory
                </CardTitle>
                <CardDescription>Manage regional and school-level access</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Staff Member</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Role</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Scope</TableHead>
                  <TableHead className="font-bold uppercase text-[10px] tracking-widest py-4">Assignment</TableHead>
                  <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest py-4">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id} className="group hover:bg-white transition-colors border-b border-slate-100">
                    <TableCell className="py-4">
                      <div className="font-black text-slate-900 uppercase tracking-tight">{s.full_name}</div>
                      <div className="text-[10px] text-slate-500 font-bold">{s.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white border-slate-200 text-slate-700 font-black uppercase text-[9px] tracking-widest">
                        {s.role || "staff"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.scope === "global" && <Globe className="h-3 w-3 text-blue-500" />}
                        {s.scope === "district" && <MapPin className="h-3 w-3 text-emerald-500" />}
                        {s.scope === "school" && <SchoolIcon className="h-3 w-3 text-amber-500" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {s.scope || "school"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-600">
                        {s.scope === "district" ? (s.district_id || "Multiple Districts") : 
                         s.scope === "school" ? (schools.find(sc => sc.id === s.school_id)?.name || "Primary School") : 
                         "Full System Access"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}>
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Assignment Scoping</DialogTitle>
              <DialogDescription>Set boundaries for {editingStaff?.full_name}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">System Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger className="rounded-xl border-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="head_teacher">Head Teacher</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Administrative Scope</Label>
                <Select value={form.scope} onValueChange={(v: any) => setForm({ ...form, scope: v })}>
                  <SelectTrigger className="rounded-xl border-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (Full Access)</SelectItem>
                    <SelectItem value="district">District (Regional Admin)</SelectItem>
                    <SelectItem value="school">School (Single Institution)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.scope === "district" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <LocationSelector 
                    districtValue={form.district_id} 
                    onDistrictChange={(v) => setForm({ ...form, district_id: v })} 
                    label="Assign District (GeoNames)"
                    useId={true}
                  />
                </div>
              )}

              {form.scope === "school" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 text-amber-600">Assign School</Label>
                  <Select value={form.school_id} onValueChange={(v) => setForm({ ...form, school_id: v })}>
                    <SelectTrigger className="rounded-xl border-2 border-amber-100 bg-amber-50/30">
                      <SelectValue placeholder="Select a school..." />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button className="rounded-xl bg-slate-900" onClick={handleSave}>Save Assignment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
