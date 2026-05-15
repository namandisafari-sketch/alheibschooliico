
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ShieldAlert, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Scale,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Trash2, CheckCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Discipline() {
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<any>(null);

  // Form State
  const [selectedLearner, setSelectedLearner] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [severity, setSeverity] = useState("minor");
  const [description, setDescription] = useState("");
  const [actionTaken, setActionTaken] = useState("");
  const [incidentDate, setIncidentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [status, setStatus] = useState("pending");
  const [witnesses, setWitnesses] = useState("");
  const [victims, setVictims] = useState("");
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [parentNotified, setParentNotified] = useState(false);

  const { data: cases, isLoading } = useQuery({
    queryKey: ["discipline-cases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discipline_cases")
        .select("*, learners(full_name, admission_number, photo_url, classes(name))")
        .order("incident_date", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: learners } = useQuery({
    queryKey: ["learners-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learners")
        .select("id, full_name, admission_number")
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data;
    }
  });

  const logCaseMutation = useMutation({
    mutationFn: async (newCase: any) => {
      if (editingCase) {
        const { error } = await supabase.from("discipline_cases").update(newCase).eq("id", editingCase.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("discipline_cases").insert(newCase);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discipline-cases"] });
      toast.success(editingCase ? "Case updated successfully" : "Discipline case logged successfully");
      setIsLogDialogOpen(false);
      setEditingCase(null);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message)
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from("discipline_cases").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discipline-cases"] });
      toast.success("Case status updated");
    },
    onError: (e: any) => toast.error(e.message)
  });

  const deleteCaseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("discipline_cases").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discipline-cases"] });
      toast.success("Case record deleted");
    },
    onError: (e: any) => toast.error(e.message)
  });

  const resetForm = () => {
    setSelectedLearner("");
    setIncidentType("");
    setSeverity("minor");
    setDescription("");
    setActionTaken("");
    setIncidentDate(format(new Date(), "yyyy-MM-dd"));
    setStatus("pending");
    setWitnesses("");
    setVictims("");
    setEvidencePhotos([]);
    setParentNotified(false);
  };

  const filteredCases = cases?.filter(c => 
    c.learners?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.incident_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditCase = (c: any) => {
    setEditingCase(c);
    setSelectedLearner(c.learner_id);
    setIncidentType(c.incident_type);
    setSeverity(c.severity);
    setDescription(c.description);
    setActionTaken(c.action_taken);
    setIncidentDate(c.incident_date);
    setStatus(c.status);
    setWitnesses(c.witnesses || "");
    setVictims(c.victims || "");
    setEvidencePhotos(c.evidence_photos || []);
    setParentNotified(c.parent_notified);
    setIsLogDialogOpen(true);
  };

  const isAuthorized = role === "admin" || role === "head_teacher";

  return (
    <DashboardLayout 
      title="Discipline Management" 
      subtitle="Manage student conduct and discipline records - Alheib Mixed Day & Boarding School"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by student or incident type..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest">
            <Filter className="h-4 w-4" /> Filter
          </Button>
          <Dialog open={isLogDialogOpen} onOpenChange={setIsLogDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2 bg-slate-900 font-black uppercase text-[10px] tracking-widest">
                <Plus className="h-4 w-4" /> Log Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  {editingCase ? "Edit Case File" : "Log Discipline Incident"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {editingCase ? `Modifying File ID: ${editingCase.case_number}` : "Record a new discipline case for a learner. All fields are tracked for the school dossier."}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Student (Offender)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between text-xs font-bold h-10 border-2"
                      >
                        {selectedLearner
                          ? learners?.find((l) => l.id === selectedLearner)?.full_name
                          : "Search student..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Type name or ADM..." className="h-9" />
                        <CommandEmpty>No learner found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {learners?.map((l) => (
                            <CommandItem
                              key={l.id}
                              value={l.full_name}
                              onSelect={() => setSelectedLearner(l.id)}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedLearner === l.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {l.full_name} ({l.admission_number})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Incident Date</label>
                    <Input 
                      type="date"
                      className="text-xs font-bold h-10 border-2"
                      value={incidentDate}
                      onChange={(e) => setIncidentDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Case Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="text-xs font-bold h-10 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="appealed">Appealed</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Incident Type</label>
                    <Input 
                      placeholder="e.g. Bullying" 
                      className="text-xs font-bold h-10 border-2"
                      value={incidentType}
                      onChange={(e) => setIncidentType(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Severity</label>
                    <Select value={severity} onValueChange={setSeverity}>
                      <SelectTrigger className="text-xs font-bold h-10 border-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minor">Minor</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="major">Major</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Description</label>
                  <Textarea 
                    placeholder="Provide details of what happened..." 
                    className="text-xs font-bold min-h-[80px] border-2"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Witnesses (Must be current learners)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-start text-xs font-bold h-auto min-h-10 py-2 border-2 flex-wrap gap-1"
                      >
                        {!witnesses ? (
                          <span className="text-slate-400">Search & select witnesses...</span>
                        ) : (
                          witnesses.split(", ").map(w => (
                            <Badge key={w} variant="secondary" className="text-[9px] font-black uppercase">
                              {w}
                            </Badge>
                          ))
                        )}
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search witness name..." className="h-9" />
                        <CommandEmpty>No learner found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {learners?.map((l) => (
                            <CommandItem
                              key={l.id}
                              value={l.full_name}
                              onSelect={() => {
                                const current = witnesses ? witnesses.split(", ") : [];
                                if (current.includes(l.full_name)) {
                                  setWitnesses(current.filter(w => w !== l.full_name).join(", "));
                                } else {
                                  setWitnesses([...current, l.full_name].join(", "));
                                }
                              }}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  witnesses?.includes(l.full_name) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {l.full_name} ({l.admission_number})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Victims (Optional)</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-start text-xs font-bold h-auto min-h-10 py-2 border-2 flex-wrap gap-1"
                      >
                        {!victims ? (
                          <span className="text-slate-400">Search & select victims...</span>
                        ) : (
                          victims.split(", ").map(v => (
                            <Badge key={v} variant="secondary" className="text-[9px] font-black uppercase bg-red-50 text-red-700">
                              {v}
                            </Badge>
                          ))
                        )}
                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search victim name..." className="h-9" />
                        <CommandEmpty>No learner found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {learners?.map((l) => (
                            <CommandItem
                              key={l.id}
                              value={l.full_name}
                              onSelect={() => {
                                const current = victims ? victims.split(", ") : [];
                                if (current.includes(l.full_name)) {
                                  setVictims(current.filter(v => v !== l.full_name).join(", "));
                                } else {
                                  setVictims([...current, l.full_name].join(", "));
                                }
                              }}
                              className="text-xs"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  victims?.includes(l.full_name) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {l.full_name} ({l.admission_number})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Evidence Photo URL (Optional)</label>
                  <Input 
                    placeholder="https://..." 
                    className="text-xs font-bold h-10 border-2"
                    onChange={(e) => setEvidencePhotos(e.target.value ? [e.target.value] : [])}
                  />
                </div>

                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-dashed">
                   <input 
                     type="checkbox" 
                     id="parentNotified"
                     className="h-4 w-4 rounded border-gray-300"
                     checked={parentNotified}
                     onChange={(e) => setParentNotified(e.target.checked)}
                   />
                   <label htmlFor="parentNotified" className="text-[10px] font-black uppercase tracking-widest text-slate-600 cursor-pointer">
                     Parent / Guardian has been notified
                   </label>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setIsLogDialogOpen(false)} className="text-[10px] font-black uppercase tracking-widest">
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  className="bg-slate-900 text-[10px] font-black uppercase tracking-widest px-8"
                  onClick={() => logCaseMutation.mutate({
                    learner_id: selectedLearner,
                    incident_type: incidentType,
                    severity,
                    description,
                    action_taken: actionTaken,
                    incident_date: incidentDate,
                    status,
                    witnesses,
                    victims,
                    evidence_photos: evidencePhotos,
                    parent_notified: parentNotified
                  })}
                  disabled={!selectedLearner || !incidentType || logCaseMutation.isPending}
                >
                  {logCaseMutation.isPending ? "Saving..." : editingCase ? "Update File" : "Save Record"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
             <Clock className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : filteredCases?.length ? (
          filteredCases.map(c => (
            <div key={c.id} className="p-5 bg-white border-2 border-slate-50 rounded-3xl hover:border-slate-200 transition-all group relative overflow-hidden">
               <div className={cn(
                 "absolute top-0 left-0 bottom-0 w-1.5",
                 c.severity === 'critical' ? 'bg-red-600' :
                 c.severity === 'major' ? 'bg-orange-600' :
                 c.severity === 'moderate' ? 'bg-yellow-600' : 'bg-slate-400'
               )} />
               
               <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                  <p className="font-mono text-[10px] font-black tracking-widest text-slate-400">FILE ID: {c.case_number || "PENDING"}</p>
               </div>
               
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                     <div className="h-16 w-14 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                        {c.learners?.photo_url ? (
                          <img src={c.learners.photo_url} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-slate-400" />
                        )}
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <h4 className="font-black text-slate-900 uppercase tracking-tight">{c.learners?.full_name}</h4>
                           <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">
                              {c.learners?.classes?.name}
                           </Badge>
                           {['major', 'critical'].includes(c.severity) && (
                             <Badge className="bg-red-600 text-white animate-pulse text-[8px] font-black uppercase tracking-widest">
                               Serious Offense
                             </Badge>
                           )}
                        </div>
                        <div className="flex flex-col gap-1 mt-2">
                           <div className="flex items-center gap-2">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Offense:</p>
                             <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{c.incident_type}</p>
                             <Badge className={cn(
                               "text-[8px] font-black uppercase px-1.5 h-4 border-none",
                               c.severity === 'critical' ? 'bg-red-100 text-red-700' :
                               c.severity === 'major' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                             )}>
                               {c.severity}
                             </Badge>
                           </div>
                           {c.victims && (
                             <div className="flex items-center gap-2">
                               <p className="text-[10px] font-black uppercase text-red-400 tracking-widest">Victims:</p>
                               <div className="flex gap-1 flex-wrap">
                                 {c.victims.split(", ").map(v => (
                                   <Badge key={v} variant="secondary" className="text-[8px] font-black uppercase h-4 bg-red-50 text-red-600 border-red-100">
                                     {v}
                                   </Badge>
                                 ))}
                               </div>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-6">
                     <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Status</p>
                        <Badge className={cn(
                          "text-[9px] font-black uppercase h-5",
                          c.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        )}>
                           {c.status}
                        </Badge>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Case ID</p>
                        <p className="text-xs font-mono font-black text-slate-900">{c.case_number || "---"}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Incident Date</p>
                        <p className="text-xs font-black text-slate-900">{format(new Date(c.incident_date), "dd MMM yyyy")}</p>
                     </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-[10px] font-black uppercase">Manage Case</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {isAuthorized && (
                              <DropdownMenuItem 
                                onClick={() => handleEditCase(c)}
                                className="font-bold"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Edit File
                              </DropdownMenuItem>
                            )}
                            {isAuthorized && c.status !== 'resolved' && (
                              <DropdownMenuItem 
                                onClick={() => updateStatusMutation.mutate({ id: c.id, status: 'resolved' })}
                                className="text-emerald-600 font-bold"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Resolved
                              </DropdownMenuItem>
                            )}
                            {isAuthorized && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => deleteCaseMutation.mutate(c.id)}
                                  className="text-red-600 font-bold"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Record
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                  </div>
               </div>

               <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4 border-slate-50">
                  <div className="md:col-span-1">
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Incident Description</p>
                     <p className="text-xs text-slate-600 line-clamp-3">{c.description || "No description provided."}</p>
                  </div>
                  <div className="md:col-span-1">
                     <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Action & Resolution</p>
                        <p className="text-xs font-bold text-slate-800">{c.action_taken || "Action pending..."}</p>
                     </div>
                  </div>
                  <div className="md:col-span-1">
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-2">Evidence Photos</p>
                     <div className="flex gap-2 overflow-x-auto pb-2">
                        {c.evidence_photos?.length ? c.evidence_photos.map((p, idx) => (
                           <div key={idx} className="h-16 w-20 rounded-xl bg-slate-100 border overflow-hidden shrink-0">
                              <img src={p} className="h-full w-full object-cover" />
                           </div>
                        )) : (
                           <div className="h-16 w-full rounded-xl bg-slate-50 border border-dashed flex items-center justify-center">
                              <p className="text-[8px] font-black uppercase text-slate-300">No photos</p>
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </div>
          ))
        ) : (
          <div className="p-20 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center text-center text-slate-400">
             <Scale className="h-16 w-16 mb-6 opacity-10" />
             <h3 className="text-lg font-black uppercase tracking-widest text-slate-900">Justice & Conduct</h3>
             <p className="text-sm mt-2 max-w-xs font-medium">No discipline cases recorded. Every student is currently maintaining exemplary conduct.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
