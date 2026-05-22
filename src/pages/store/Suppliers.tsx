// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Search, ExternalLink, Phone, Mail, Star, Calendar, User } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Suppliers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select(`*`)
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    category: "Stationery",
    rating: 5,
  });

  const createSupplier = useMutation({
    mutationFn: async (sup: any) => {
      const { error } = await supabase.from("suppliers").insert(sup);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Authorized", description: "Supplier added to school directory" });
      setIsDialogOpen(false);
      setFormData({ name: "", contact_person: "", phone: "", email: "", category: "Stationery", rating: 5 });
    },
  });

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Supplier Management" subtitle="Vet and Manage School Vendors & Service Providers">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search suppliers..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Vendor Profile</DialogTitle>
                <DialogDescription>Register a new official supplier to the school system</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData(p => ({...p, name: e.target.value}))}
                    placeholder="e.g. Stationery World Ltd" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData(p => ({...p, category: v}))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Stationery">Stationery</SelectItem>
                        <SelectItem value="Food">Food & Beverages</SelectItem>
                        <SelectItem value="Construction">Building & Repairs</SelectItem>
                        <SelectItem value="IT">IT Services</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person</Label>
                    <Input 
                      value={formData.contact_person}
                      onChange={(e) => setFormData(p => ({...p, contact_person: e.target.value}))}
                      placeholder="Name" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      value={formData.phone}
                      onChange={(e) => setFormData(p => ({...p, phone: e.target.value}))}
                      placeholder="+256..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({...p, email: e.target.value}))}
                      placeholder="sales@vendor.com" 
                    />
                  </div>
                </div>
                <Button className="w-full gap-2" onClick={() => createSupplier.mutate(formData)} disabled={createSupplier.isPending}>
                  {createSupplier.isPending ? "Registering..." : "Confirm Vendor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center text-muted-foreground">Loading vendors...</div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="col-span-full py-20 text-center border-dashed rounded-lg space-y-2 border-2">
              <ShoppingCart className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground">No suppliers found.</p>
            </div>
          ) : (
            filteredSuppliers.map((sup) => (
              <Card key={sup.id} className="group hover:border-primary/30 transition-all">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline">{sup.category}</Badge>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-xs font-bold">{sup.rating}.0</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg mt-2">{sup.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <User className="h-3 w-3" /> {sup.contact_person || "General Contact"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {sup.phone || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" /> {sup.email || "N/A"}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t flex justify-between items-center text-xs">
                     <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>Contract Ends: </span>
                        <span className="font-bold underline">
                          {sup.contract_expiry ? format(new Date(sup.contract_expiry), "MMM yyyy") : "OPEN"}
                        </span>
                     </div>
                     <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2">
                        Profile <ExternalLink className="h-3 w-3" />
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Suppliers;
