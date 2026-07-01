// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus, Search, Folder, Download, ExternalLink, Archive, MapPin, Upload, FileUp, Eye, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LogDocumentWizard } from "@/components/office/LogDocumentWizard";

const BUCKET = "document_scans";

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
        .select("*, logger:profiles(full_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
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
      toast({ title: "Logged", description: "Document recorded in registry" });
      setIsDialogOpen(false);
    },
  });

  const handleWizardSubmit = async (formData: any, file: File | null) => {
    let fileUrl = null;
    if (file) {
      const ext = file.name.split(".").pop();
      const filePath = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file);
      if (uploadErr) {
        toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
        return;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
      fileUrl = urlData?.publicUrl || null;
    }

    createDoc.mutate({ ...formData, file_url: fileUrl });
  };

  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.ref_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Document Registry" subtitle="Manage School Documentation & File Archive">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <p className="text-xs font-bold text-muted-foreground uppercase">With Scans</p>
                <p className="text-xl font-bold">{documents.filter(d => d.file_url).length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-50/50">
            <CardContent className="pt-4 flex items-center gap-4">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Outbound</p>
                <p className="text-xl font-bold">
                  {documents.filter(d => d.direction === 'outbound').length}
                </p>
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
          <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Log Document
          </Button>
        </div>

        <LogDocumentWizard
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={handleWizardSubmit}
          isLoading={createDoc.isPending}
        />

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
                    <TableHead className="text-center">Scan</TableHead>
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
                      <TableCell className="text-center">
                        {doc.file_url ? (
                          <TooltipProvider delayDuration={200}>
                            <div className="flex items-center justify-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                                      <Eye className="h-4 w-4 text-blue-600" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>View scan</p></TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                    <a href={doc.file_url} download>
                                      <Download className="h-4 w-4 text-emerald-600" />
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Download scan</p></TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">No scan</span>
                        )}
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