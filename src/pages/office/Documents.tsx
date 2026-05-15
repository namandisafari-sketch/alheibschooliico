import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Folder, Download, ExternalLink, Archive, MapPin } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Documents = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["document-registry"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_registry")
        .select(`*, logger:profiles(full_name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    ref_number: "",
    direction: "inbound",
    category: "General",
    physical_location: "",
    sender_receiver_name: "",
  });

  const createDoc = useMutation({
    mutationFn: async (doc: any) => {
      const { error } = await supabase.from("document_registry").insert({
        ...doc,
        logged_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-registry"] });
      toast({ title: "Logged", description: "Document successfully recorded in registry" });
      setIsDialogOpen(false);
      setFormData({ title: "", ref_number: "", direction: "inbound", category: "General", physical_location: "", sender_receiver_name: "" });
    },
  });

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.ref_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Document Registry" subtitle="Manage School Documentation & File Archive">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-50/50">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                <Folder className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Total Records</p>
                <p className="text-xl font-bold">{documents.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50/50">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                <Download className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Inbound Today</p>
                <p className="text-xl font-bold">
                  {documents.filter(d => d.direction === 'inbound' && format(new Date(d.created_at), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50/50">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600">
                <Archive className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Physical Archive</p>
                <p className="text-xl font-bold">Active</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by title or ref..." 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Log Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Registry Entry</DialogTitle>
                <DialogDescription>Add a new inbound or outbound document record</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Direction</Label>
                    <Select onValueChange={(v) => setFormData(p => ({...p, direction: v}))}>
                      <SelectTrigger><SelectValue placeholder="Inbound" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inbound">Inbound</SelectItem>
                        <SelectItem value="outbound">Outbound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={(v) => setFormData(p => ({...p, category: v}))}>
                      <SelectTrigger><SelectValue placeholder="Circular" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Circular">Circular</SelectItem>
                        <SelectItem value="Invoice">Invoice</SelectItem>
                        <SelectItem value="Letter">Letter</SelectItem>
                        <SelectItem value="Policy">Policy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Document Title</Label>
                  <Input 
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({...p, title: e.target.value}))}
                    placeholder="e.g. Ministry of Education Guidelines" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reference Number</Label>
                  <Input 
                    value={formData.ref_number}
                    onChange={(e) => setFormData(p => ({...p, ref_number: e.target.value}))}
                    placeholder="e.g. MOE/2024/001" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sender / Recipient Name</Label>
                  <Input 
                    value={formData.sender_receiver_name}
                    onChange={(e) => setFormData(p => ({...p, sender_receiver_name: e.target.value}))}
                    placeholder="Entity name..." 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Physical Location (Shelf/Folder)</Label>
                  <Input 
                    value={formData.physical_location}
                    onChange={(e) => setFormData(p => ({...p, physical_location: e.target.value}))}
                    placeholder="e.g. Cabinet B, Tray 1" 
                  />
                </div>
                <Button className="w-full gap-2" onClick={() => createDoc.mutate(formData)} disabled={createDoc.isPending}>
                  {createDoc.isPending ? "Logging..." : "Confirm Entry"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Loading registry...</div>
            ) : filteredDocs.length === 0 ? (
              <div className="py-20 text-center border-dashed rounded-lg space-y-2">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">No matching documents found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Ref / Date</TableHead>
                    <TableHead>Document Title</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-xs uppercase">{doc.ref_number || "No Ref"}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(doc.created_at), "MMM d, yyyy")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{doc.title}</TableCell>
                      <TableCell>
                        <Badge variant={doc.direction === 'inbound' ? 'secondary' : 'outline'} className="text-[10px] capitalize">
                          {doc.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{doc.category}</TableCell>
                      <TableCell className="text-xs">{doc.sender_receiver_name || "Internal"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {doc.physical_location || "Not tracked"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Documents;
