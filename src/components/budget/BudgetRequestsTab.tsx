// @ts-nocheck

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Wallet, Clock, CheckCircle2, XCircle, Loader2, X, FileUp, Trash2, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const BudgetRequestsTab = () => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState("");
  const [amount, setAmount] = useState("");
  const [details, setDetails] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("operations");
  const [justification, setJustification] = useState("");
  const [requiredByDate, setRequiredByDate] = useState("");
  const [department, setDepartment] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [lineItems, setLineItems] = useState([]);
  const [newLineItem, setNewLineItem] = useState({ description: "", quantity: "", unitCost: "" });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000 // Real-time updates every 5 seconds
  });
  const { data: requests, isLoading } = useQuery({
    queryKey: ["budget-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`*, projects(name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 5000 // Real-time updates every 5 seconds
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("purchase_orders")
        .update({ status: "head_office" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-requests"] });
      toast.success("Request approved for Head Office endorsement");
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("purchase_orders").insert({
        title,
        project_id: projectId || null,
        total_amount: parseFloat(amount || "0"),
        description: details,
        status: "committee"
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-requests"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Budget request created successfully");
      resetForm();
      setIsAdding(false);
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to create request");
    }
  });

  const resetForm = () => {
    setTitle("");
    setProjectId("");
    setAmount("");
    setDetails("");
    setPriority("medium");
    setCategory("operations");
    setJustification("");
    setRequiredByDate("");
    setDepartment("");
    setEstimatedDuration("");
    setLineItems([]);
    setNewLineItem({ description: "", quantity: "", unitCost: "" });
    setUploadedFiles([]);
  };

  const setupStorageBucket = async () => {
    try {
      const response = await fetch('/api/storage/setup-budget-bucket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      return response.ok;
    } catch (err) {
      console.error('Bucket setup request failed:', err);
      return false;
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsUploading(true);
    try {
      // Attempt to setup bucket if needed
      await setupStorageBucket();

      for (const file of files) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is too large (max 10MB)`);
          continue;
        }

        // Validate file type
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
          toast.error(`${file.name} is not a supported file type. Use PDF, Word, Excel, or images.`);
          continue;
        }

        // Upload to Supabase storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `quotations/${fileName}`;

        const { data, error } = await supabase.storage
          .from('budget-files')
          .upload(filePath, file);

        // Handle bucket not found error
        if (error?.message?.includes('not found') || error?.statusCode === 404) {
          toast.error(
            `Storage bucket not configured. Contact your administrator to run: POST /api/storage/setup-budget-bucket`,
            {
              duration: 5000
            }
          );
          console.error('Bucket setup error:', error);
          break; // Stop trying other files
        }

        if (error) {
          console.error(`Upload error for ${file.name}:`, error);
          toast.error(`Failed to upload ${file.name}: ${error.message || 'Unknown error'}`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('budget-files')
          .getPublicUrl(filePath);

        setUploadedFiles(prev => [...prev, {
          id: fileName,
          name: file.name,
          size: file.size,
          type: file.type,
          url: urlData?.publicUrl,
          path: filePath,
          uploadedAt: new Date().toISOString()
        }]);

        toast.success(`${file.name} uploaded successfully`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(`Upload failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = async (fileId, filePath) => {
    try {
      const { error } = await supabase.storage
        .from('budget-files')
        .remove([filePath]);

      if (error) throw error;

      setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success("File removed");
    } catch (err) {
      toast.error("Failed to remove file");
      console.error(err);
    }
  };

  const addLineItem = () => {
    if (newLineItem.description && newLineItem.quantity && newLineItem.unitCost) {
      const total = parseFloat(newLineItem.quantity) * parseFloat(newLineItem.unitCost);
      setLineItems([...lineItems, { ...newLineItem, total }]);
      setNewLineItem({ description: "", quantity: "", unitCost: "" });
    }
  };

  const removeLineItem = (idx) => {
    setLineItems(lineItems.filter((_, i) => i !== idx));
  };

  // Calculate summary statistics
  const pendingRequests = requests?.filter(r => r.status === 'committee') || [];
  const approvedRequests = requests?.filter(r => r.status === 'approved' || r.status === 'head_office') || [];
  const rejectedRequests = requests?.filter(r => r.status === 'rejected') || [];
  
  const pendingAmount = pendingRequests.reduce((acc, req) => acc + (req.total_amount || 0), 0);
  const approvedAmount = approvedRequests.reduce((acc, req) => acc + (req.total_amount || 0), 0);
  const rejectedAmount = rejectedRequests.reduce((acc, req) => acc + (req.total_amount || 0), 0);
  const totalAmount = (requests || []).reduce((acc, req) => acc + (req.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-blue-700 uppercase tracking-wide">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-blue-900">{requests?.length || 0}</p>
            <p className="text-xs text-blue-600 mt-2">UGX {totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-amber-50 to-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-amber-700 uppercase tracking-wide">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-amber-900">{pendingRequests.length}</p>
            <p className="text-xs text-amber-600 mt-2">UGX {pendingAmount.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-green-700 uppercase tracking-wide">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-green-900">{approvedRequests.length}</p>
            <p className="text-xs text-green-600 mt-2">UGX {approvedAmount.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-red-700 uppercase tracking-wide">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-red-900">{rejectedRequests.length}</p>
            <p className="text-xs text-red-600 mt-2">UGX {rejectedAmount.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Request Status Overview */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" /> Request Status Overview
            </CardTitle>
            <Button onClick={() => setIsAdding(true)} className="gap-2 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" /> Create Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 mb-6 md:grid-cols-3">
            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-700 font-semibold uppercase">Pending Approvals</p>
                  <p className="text-2xl font-black text-amber-900 mt-1">{pendingRequests.length}</p>
                  <p className="text-xs text-amber-600 mt-1">Awaiting committee review</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500 opacity-50" />
              </div>
              <div className="mt-4 bg-amber-200 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full" style={{width: `${(pendingRequests.length / (requests?.length || 1)) * 100}%`}} />
              </div>
            </div>

            <div className="p-4 rounded-lg border border-green-200 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 font-semibold uppercase">Approved</p>
                  <p className="text-2xl font-black text-green-900 mt-1">{approvedRequests.length}</p>
                  <p className="text-xs text-green-600 mt-1">Ready for procurement</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
              </div>
              <div className="mt-4 bg-green-200 h-2 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full" style={{width: `${(approvedRequests.length / (requests?.length || 1)) * 100}%`}} />
              </div>
            </div>

            <div className="p-4 rounded-lg border border-red-200 bg-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-700 font-semibold uppercase">Rejected</p>
                  <p className="text-2xl font-black text-red-900 mt-1">{rejectedRequests.length}</p>
                  <p className="text-xs text-red-600 mt-1">Awaiting resubmission</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500 opacity-50" />
              </div>
              <div className="mt-4 bg-red-200 h-2 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full" style={{width: `${(rejectedRequests.length / (requests?.length || 1)) * 100}%`}} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Requests Grid */}
      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Recent Budget Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin text-slate-200" /></div>
            ) : requests && requests.length > 0 ? requests.slice(0, 9).map((req) => (
              <Card key={req.id} className="border-none shadow-md overflow-hidden group hover:shadow-lg transition-shadow">
                <div className={`h-1 w-full ${
                  req.status === 'approved' || req.status === 'head_office' ? 'bg-success' : 
                  req.status === 'committee' ? 'bg-amber-400' : 'bg-destructive'
                }`} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="font-mono text-[10px]">PO-{req.id.slice(0, 8)}</Badge>
                    {req.status === 'approved' || req.status === 'head_office' ? <CheckCircle2 className="h-4 w-4 text-success" /> : 
                     req.status === 'committee' ? <Clock className="h-4 w-4 text-amber-500 animate-pulse" /> : 
                     <XCircle className="h-4 w-4 text-destructive" />}
                  </div>
                  <CardTitle className="text-sm font-bold mt-2 line-clamp-2">{req.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="text-[10px]">{req.status === 'approved' || req.status === 'head_office' ? 'Approved' : req.status === 'committee' ? 'Pending' : 'Rejected'}</Badge>
                    <p className="text-xs text-muted-foreground">{req.projects?.name || 'General'}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Amount</p>
                    <p className="text-2xl font-black text-primary">UGX {req.total_amount?.toLocaleString()}</p>
                  </div>
                  {req.description && (
                    <div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>
                    </div>
                  )}
                  <div className="pt-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" className="flex-1 text-xs">Details</Button>
                    {req.status === 'committee' && (
                      <Button size="sm" onClick={() => approveMutation.mutate(req.id)} className="flex-1 text-xs bg-success hover:bg-success/90">Approve</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )) : (
              <div className="col-span-full py-10 text-center">
                <p className="text-muted-foreground">No budget requests yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Request Dialog - Detailed Form */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary to-primary/80 text-white p-6 flex justify-between items-center border-b">
              <div>
                <h2 className="text-2xl font-black">New Budget Request</h2>
                <p className="text-xs text-white/80 mt-1">Complete all required fields marked with *</p>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-1 hover:bg-white/20 rounded">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-6">
              {/* Section 1: Basic Information */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">1</span>
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Request Title *</label>
                    <input 
                      className="w-full border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary" 
                      placeholder="e.g., Office Equipment Purchase" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700">Project *</label>
                      <select className="w-full border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary" value={projectId} onChange={e => setProjectId(e.target.value)}>
                        <option value="">Select Project</option>
                        {projects?.map((p:any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700">Department *</label>
                      <select className="w-full border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary" value={department} onChange={e => setDepartment(e.target.value)}>
                        <option value="">Select Department</option>
                        <option value="academic">Academic</option>
                        <option value="administration">Administration</option>
                        <option value="facilities">Facilities</option>
                        <option value="hostel">Hostel</option>
                        <option value="it">IT & Technology</option>
                        <option value="library">Library</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700">Priority Level *</label>
                      <select className="w-full border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary" value={priority} onChange={e => setPriority(e.target.value)}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700">Budget Category *</label>
                      <select className="w-full border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary" value={category} onChange={e => setCategory(e.target.value)}>
                        <option value="operations">Operations</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="equipment">Equipment</option>
                        <option value="infrastructure">Infrastructure</option>
                        <option value="personnel">Personnel</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Budget Details */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">2</span>
                  Budget Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-bold text-slate-700">Estimated Total Amount (UGX) *</label>
                      <input 
                        className="w-full border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary" 
                        placeholder="0" 
                        value={amount} 
                        onChange={e => setAmount(e.target.value)} 
                        type="number" 
                      />
                      {amount && <p className="text-xs text-slate-600 mt-1">Total: UGX {parseFloat(amount).toLocaleString()}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-bold text-slate-700">Required By Date *</label>
                      <input 
                        className="w-full border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary" 
                        type="date" 
                        value={requiredByDate} 
                        onChange={e => setRequiredByDate(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">Estimated Duration</label>
                    <input 
                      className="w-full border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary" 
                      placeholder="e.g., 2-3 weeks" 
                      value={estimatedDuration} 
                      onChange={e => setEstimatedDuration(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Line Items */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">3</span>
                  Line Items (Optional)
                </h3>
                <div className="space-y-4">
                  {lineItems.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Description</th>
                            <th className="text-right py-2">Qty</th>
                            <th className="text-right py-2">Unit Cost</th>
                            <th className="text-right py-2">Total</th>
                            <th className="text-center py-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-slate-50">
                              <td className="py-2">{item.description}</td>
                              <td className="text-right">{item.quantity}</td>
                              <td className="text-right">UGX {parseFloat(item.unitCost).toLocaleString()}</td>
                              <td className="text-right font-bold">UGX {item.total.toLocaleString()}</td>
                              <td className="text-center">
                                <button onClick={() => removeLineItem(idx)} className="text-red-600 hover:text-red-800 text-xs font-bold">Remove</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="p-3 bg-slate-50 rounded-lg space-y-3">
                    <p className="text-xs font-semibold text-slate-600">Add Line Item</p>
                    <div className="grid grid-cols-3 gap-2">
                      <input 
                        className="border border-slate-300 rounded p-2 text-sm" 
                        placeholder="Description" 
                        value={newLineItem.description}
                        onChange={e => setNewLineItem({...newLineItem, description: e.target.value})}
                      />
                      <input 
                        className="border border-slate-300 rounded p-2 text-sm" 
                        placeholder="Qty" 
                        type="number"
                        value={newLineItem.quantity}
                        onChange={e => setNewLineItem({...newLineItem, quantity: e.target.value})}
                      />
                      <input 
                        className="border border-slate-300 rounded p-2 text-sm" 
                        placeholder="Unit Cost" 
                        type="number"
                        value={newLineItem.unitCost}
                        onChange={e => setNewLineItem({...newLineItem, unitCost: e.target.value})}
                      />
                    </div>
                    <Button 
                      size="sm" 
                      onClick={addLineItem}
                      disabled={!newLineItem.description || !newLineItem.quantity || !newLineItem.unitCost}
                      className="w-full"
                    >
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>

              {/* Section 4: Justification & Details */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">4</span>
                  Justification & Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700">Business Justification *</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary" 
                      placeholder="Explain why this budget request is needed, its impact, and expected outcomes..."
                      rows={4}
                      value={justification} 
                      onChange={e => setJustification(e.target.value)} 
                    />
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-700">Additional Details & Notes</label>
                    <textarea 
                      className="w-full border border-slate-300 rounded-lg p-3 mt-1 focus:outline-none focus:ring-2 focus:ring-primary" 
                      placeholder="Any additional information, vendor names, specifications, etc..."
                      rows={3}
                      value={details} 
                      onChange={e => setDetails(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Quotations & Attachments */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-sm">5</span>
                  Quotations & Attachments
                </h3>
                <div className="space-y-4">
                  {/* File Upload Area */}
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition">
                    <label className="cursor-pointer">
                      <input 
                        type="file" 
                        multiple 
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <FileUp className={`h-8 w-8 ${isUploading ? 'text-slate-400' : 'text-primary'}`} />
                        <p className="text-sm font-bold text-slate-700">Upload Quotations</p>
                        <p className="text-xs text-slate-600">PDF, Word, Excel, or images (max 10MB each)</p>
                        {isUploading && <p className="text-xs text-primary font-semibold animate-pulse">Uploading...</p>}
                      </div>
                    </label>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700">Attached Files ({uploadedFiles.length})</p>
                      <div className="space-y-2">
                        {uploadedFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 hover:bg-slate-100 transition">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                                <FileUp className="h-5 w-5 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                                <p className="text-xs text-slate-600">{(file.size / 1024).toFixed(2)} KB</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <a 
                                href={file.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-slate-200 rounded text-slate-600 hover:text-primary transition"
                                title="Download file"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                              <button 
                                onClick={() => removeFile(file.id, file.path)}
                                className="p-2 hover:bg-red-100 rounded text-slate-600 hover:text-red-600 transition"
                                title="Remove file"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <h3 className="text-sm font-bold text-primary mb-3">Request Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Amount:</p>
                    <p className="text-lg font-black text-primary">{amount ? `UGX ${parseFloat(amount).toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Priority:</p>
                    <Badge className={priority === 'urgent' ? 'bg-red-500' : priority === 'high' ? 'bg-orange-500' : priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}>
                      {priority.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Line Items:</p>
                    <p className="font-bold">{lineItems.length} items added</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Required By:</p>
                    <p className="font-bold">{requiredByDate ? new Date(requiredByDate).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Attachments:</p>
                    <p className="font-bold text-primary">{uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 p-6 flex justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsAdding(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button 
                disabled={!title || !amount || !priority || !category || !justification || createMutation.isPending} 
                onClick={() => createMutation.mutate()} 
                className="bg-primary hover:bg-primary/90 text-white px-6"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Request'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};