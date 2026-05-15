// @ts-nocheck

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClipboardCheck, Search, Filter, User, Calendar, Database, Eye, ArrowRight, ShieldAlert, CheckCircle2, AlertCircle, Trash2, Edit, PlusCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const AuditLog = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Query Audit Logs with User Profiles
  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit_log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select(`*, profiles:user_id(full_name, role)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'INSERT': return <PlusCircle className="h-4 w-4 text-emerald-500" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-amber-500" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return <Database className="h-4 w-4 text-slate-400" />;
    }
  };

  const filteredLogs = logs?.filter(log => 
    log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title={t("auditLog")} subtitle="Immutable record of every financial and structural modification">
      <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all" 
              placeholder="Search by user, table (e.g. donations), or action type..." 
            />
          </div>
          <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-100 gap-2 font-bold text-slate-600">
            <Calendar className="h-4 w-4" /> Date Range
          </Button>
          <Button className="h-14 px-8 rounded-2xl bg-slate-900 gap-2 font-black uppercase tracking-widest">
            <ShieldAlert className="h-5 w-5 text-amber-400" /> Integrity Report
          </Button>
        </div>

        <div className="rounded-[32px] border border-slate-50 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-400">
               <tr>
                  <th className="px-6 py-5">Action</th>
                  <th className="px-6 py-5">Initiated By</th>
                  <th className="px-6 py-5">Source Table</th>
                  <th className="px-6 py-5">Timestamp</th>
                  <th className="px-6 py-5 text-right">Details</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {isLoading ? (
                 <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto text-slate-200" /></td></tr>
               ) : filteredLogs?.length ? (
                 filteredLogs.map(log => (
                   <tr key={log.id} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                               {getActionIcon(log.action)}
                            </div>
                            <span className="text-sm font-black text-slate-900">{log.action}</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                               <User className="h-4 w-4" />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-slate-700">{log.profiles?.full_name || 'System Auto'}</p>
                               <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">{log.profiles?.role || 'trigger'}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <Badge variant="outline" className="font-mono text-[10px] px-2 border-slate-200 bg-white text-slate-600">
                            {log.table_name.toUpperCase()}
                         </Badge>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-slate-500">
                         {format(new Date(log.created_at), 'MMM dd, HH:mm:ss')}
                      </td>
                      <td className="px-6 py-5 text-right">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={() => setSelectedLog(log)}
                           className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 bg-slate-900 text-white transition-all"
                         >
                            <Eye className="h-4 w-4" />
                         </Button>
                      </td>
                   </tr>
                 ))
               ) : (
                 <tr>
                   <td colSpan={5} className="p-32 text-center">
                      <ClipboardCheck className="h-16 w-16 mx-auto mb-4 text-slate-100" />
                      <h3 className="text-lg font-black uppercase tracking-tight text-slate-900">No History Recorded</h3>
                      <p className="text-sm text-slate-400 max-w-xs mx-auto">Database triggers are active. Actions will appear here as they occur in real-time.</p>
                   </td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl rounded-[40px] border-none shadow-2xl p-10 overflow-hidden">
           <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                 <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                    {selectedLog && getActionIcon(selectedLog.action)}
                 </div>
                 Forensic Analysis
              </DialogTitle>
           </DialogHeader>

           {selectedLog && (
             <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Transaction ID</p>
                      <p className="font-mono text-xs font-bold text-slate-900 truncate bg-slate-50 p-2 rounded-lg">{selectedLog.id}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Affected Table</p>
                      <p className="font-mono text-xs font-bold text-slate-900 bg-slate-50 p-2 rounded-lg">{selectedLog.table_name.toUpperCase()}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                         <AlertCircle className="h-3 w-3" /> Previous State
                      </div>
                      <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100 font-mono text-[10px] text-slate-500 h-48 overflow-auto">
                         {selectedLog.old_data ? JSON.stringify(selectedLog.old_data, null, 2) : "NULL (New Entry)"}
                      </div>
                   </div>
                   <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-500 tracking-widest">
                         <CheckCircle2 className="h-3 w-3" /> New State
                      </div>
                      <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-100 font-mono text-[10px] text-emerald-900 h-48 overflow-auto shadow-inner">
                         {selectedLog.new_data ? JSON.stringify(selectedLog.new_data, null, 2) : "NULL (Deleted Record)"}
                      </div>
                   </div>
                </div>

                <div className="p-6 rounded-3xl bg-slate-900 text-white flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                         <User className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified By</p>
                         <p className="text-sm font-black">{selectedLog.profiles?.full_name || 'System Kernel'}</p>
                      </div>
                   </div>
                   <ArrowRight className="h-5 w-5 text-slate-700" />
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final Commit</p>
                      <p className="text-sm font-black">{format(new Date(selectedLog.created_at), 'MMM dd, HH:mm')}</p>
                   </div>
                </div>
             </div>
           )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AuditLog;