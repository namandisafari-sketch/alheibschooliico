
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  BookOpen, 
  Wallet, 
  ClipboardCheck, 
  IdCard,
  Shield,
  School,
  HeartPulse
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLearnerDossier } from "@/hooks/useLearnerDossier";
import { PackageOpen, Clock, AlertCircle, History as HistoryIcon, Loader2, Scale } from "lucide-react";
import { formatUGX } from "@/hooks/useFees";

interface LearnerDetailsDialogProps {
  student: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LearnerDetailsDialog({ student: basicStudent, open, onOpenChange }: LearnerDetailsDialogProps) {
  const { data: dossier, isLoading } = useLearnerDossier(basicStudent?.id);
  
  if (!basicStudent) return null;
  const student = dossier?.learner || basicStudent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <div className="h-20 w-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0">
              {student.photo_url ? (
                <img src={student.photo_url} alt={student.full_name} className="h-full w-full object-cover rounded-2xl" />
              ) : (
                <User className="h-10 w-10 text-white/50" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <DialogTitle className="text-2xl font-black uppercase tracking-tight truncate">
                  {student.full_name}
                </DialogTitle>
                <Badge className="bg-emerald-500 text-white border-none uppercase text-[10px] font-black">
                  {student.status || "Active"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-400 text-sm">
                <div className="flex items-center gap-1.5 font-bold">
                  <School className="h-3.5 w-3.5" />
                  {student.class_name || "Unassigned"}
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <IdCard className="h-3.5 w-3.5" />
                  ADM: {student.admission_number || "PENDING"}
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  <Shield className="h-3.5 w-3.5" />
                  {student.religion || "Islam"}
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="bio" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b bg-slate-50">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-6 rounded-none p-0">
              <TabsTrigger value="bio" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <User className="h-3.5 w-3.5" /> Bio-Data
              </TabsTrigger>
              <TabsTrigger value="academics" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <BookOpen className="h-3.5 w-3.5" /> Academics
              </TabsTrigger>
              <TabsTrigger value="finance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <Wallet className="h-3.5 w-3.5" /> Finance
              </TabsTrigger>
              <TabsTrigger value="attendance" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <ClipboardCheck className="h-3.5 w-3.5" /> Attendance
              </TabsTrigger>
              <TabsTrigger value="inventory" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <PackageOpen className="h-3.5 w-3.5" /> Items Issued
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <HistoryIcon className="h-3.5 w-3.5" /> History
              </TabsTrigger>
              <TabsTrigger value="discipline" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <Shield className="h-3.5 w-3.5" /> Discipline
              </TabsTrigger>
              <TabsTrigger value="health" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-slate-900 rounded-none px-0 gap-2 font-black uppercase text-[10px] tracking-widest transition-none">
                <HeartPulse className="h-3.5 w-3.5" /> Health
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="bio" className="mt-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Info */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoItem label="Gender" value={student.gender} icon={User} />
                    <InfoItem label="Date of Birth" value={student.date_of_birth && !isNaN(new Date(student.date_of_birth).getTime()) ? format(new Date(student.date_of_birth), "PPP") : "Not Set"} icon={Calendar} />
                    <InfoItem label="Religion" value={student.religion} icon={Shield} />
                    <InfoItem label="Enrollment Date" value={student.enrollment_date && !isNaN(new Date(student.enrollment_date).getTime()) ? format(new Date(student.enrollment_date), "PPP") : "Not Set"} icon={Calendar} />
                  </div>
                </section>

                {/* Guardian Info */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Guardian / Parental Info</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <InfoItem label="Guardian Name" value={student.guardian_name} icon={User} />
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="Phone Number" value={student.guardian_phone} icon={Phone} />
                      <InfoItem label="Relationship" value={student.relationship || "Parent"} icon={Shield} />
                    </div>
                  </div>
                </section>
              </div>

              {/* Location */}
              <section className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b pb-2">Residential Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoItem label="District" value={student.district} icon={MapPin} />
                  <InfoItem label="Address" value={student.address} icon={MapPin} className="md:col-span-2" />
                </div>
              </section>
            </TabsContent>

            <TabsContent value="academics" className="mt-0 space-y-6">
               <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                  <BookOpen className="h-12 w-12 mb-4 opacity-20" />
                  <h5 className="font-black uppercase tracking-widest text-slate-900">Academic Records</h5>
                  <p className="text-sm mt-1 max-w-xs">Detailed termly assessments and competency progress will appear here.</p>
               </div>
            </TabsContent>

            <TabsContent value="finance" className="mt-0 space-y-6">
               <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Total Fees</p>
                     <p className="text-lg font-black text-slate-900">{formatUGX(dossier?.financials?.totalFees || 0)}</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                     <p className="text-[9px] font-black uppercase text-emerald-600 mb-1">Total Paid</p>
                     <p className="text-lg font-black text-emerald-700">{formatUGX(dossier?.financials?.totalPaid || 0)}</p>
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl border",
                    (dossier?.financials?.balance || 0) > 0 ? "bg-red-50 border-red-100" : "bg-emerald-50 border-emerald-100"
                  )}>
                     <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Balance</p>
                     <p className={cn("text-lg font-black", (dossier?.financials?.balance || 0) > 0 ? "text-red-600" : "text-emerald-700")}>
                        {formatUGX(dossier?.financials?.balance || 0)}
                     </p>
                  </div>
               </div>

               {dossier?.learner?.status !== 'active' && (
                 <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-4">
                    <AlertCircle className="h-6 w-6 text-orange-500" />
                    <div>
                       <p className="text-sm font-black text-orange-900 uppercase">Exit Summary</p>
                       <p className="text-xs text-orange-700">
                         Learner left the school on {dossier?.exitDate ? format(new Date(dossier.exitDate), "PPP") : "Unknown Date"} with a 
                         balance of {formatUGX(dossier?.financials?.balance || 0)}.
                       </p>
                    </div>
                 </div>
               )}

               <div className="space-y-3">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent Payment History</h5>
                  {dossier?.financials?.payments?.length ? (
                    <div className="border rounded-xl overflow-hidden">
                       <table className="w-full text-xs">
                          <thead className="bg-slate-50 border-b">
                             <tr className="text-left font-black uppercase text-[9px] tracking-widest text-slate-500">
                                <th className="p-3">Date</th>
                                <th className="p-3">Receipt</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Method</th>
                             </tr>
                          </thead>
                          <tbody>
                             {dossier.financials.payments.map((p: any) => (
                               <tr key={p.id} className="border-b last:border-0">
                                  <td className="p-3 font-medium">{format(new Date(p.payment_date), "dd MMM yyyy")}</td>
                                  <td className="p-3 font-mono text-slate-400">{p.receipt_number}</td>
                                  <td className="p-3 font-bold">{formatUGX(p.amount)}</td>
                                  <td className="p-3 uppercase text-[10px] font-black text-slate-400">{p.payment_method}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed rounded-3xl text-center text-slate-400">
                       No payments recorded yet.
                    </div>
                  )}
               </div>
            </TabsContent>

            <TabsContent value="inventory" className="mt-0 space-y-6">
               <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Items Currently Issued</h5>
                  {dossier?.issuedItems?.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {dossier.issuedItems.map((trans: any) => (
                         <div key={trans.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
                                  <BookOpen className="h-5 w-5 text-slate-600" />
                               </div>
                               <div>
                                  <p className="text-sm font-black text-slate-900">{trans.item?.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {trans.quantity} {trans.item?.unit} • Issued {format(new Date(trans.transaction_date), "dd MMM yyyy")}
                                  </p>
                               </div>
                            </div>
                            <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200">Tracked</Badge>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                       <PackageOpen className="h-12 w-12 mb-4 opacity-20" />
                       <p className="text-sm font-bold uppercase tracking-widest">No School Property Issued</p>
                    </div>
                  )}
               </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 space-y-6">
               <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Academic Journey & Enrollment History</h5>
                  {dossier?.history?.length ? (
                    <div className="space-y-2">
                       {dossier.history.map((h: string, i: number) => (
                         <div key={i} className="flex items-center gap-4 group">
                            <div className="h-12 w-1 h-full bg-slate-100 group-hover:bg-slate-900 transition-colors rounded-full" />
                            <div className="flex-1 p-4 bg-slate-50 group-hover:bg-slate-100 rounded-2xl transition-colors flex items-center justify-between">
                               <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{h}</p>
                               <Clock className="h-4 w-4 text-slate-300" />
                            </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                       <Clock className="h-12 w-12 mb-4 opacity-20" />
                       <p className="text-sm font-bold uppercase tracking-widest">Initial Enrollment: {student.enrollment_date ? format(new Date(student.enrollment_date), "yyyy") : "Unknown"}</p>
                    </div>
                  )}
               </div>
            </TabsContent>

            <TabsContent value="attendance" className="mt-0 space-y-6">
               <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                  <ClipboardCheck className="h-12 w-12 mb-4 opacity-20" />
                  <h5 className="font-black uppercase tracking-widest text-slate-900">Attendance Log</h5>
                  <p className="text-sm mt-1 max-w-xs">A comprehensive view of presence and absence will appear here.</p>
               </div>
            </TabsContent>

            <TabsContent value="discipline" className="mt-0 space-y-6">
               <div className="space-y-4">
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conduct & Discipline Incidents</h5>
                  {dossier?.discipline?.length ? (
                    <div className="space-y-4">
                       {dossier.discipline.map((case_item: any) => (
                         <div key={case_item.id} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm relative overflow-hidden group">
                            <div className={cn(
                              "absolute top-0 left-0 bottom-0 w-1.5",
                              case_item.severity === 'critical' ? 'bg-red-600' :
                              case_item.severity === 'major' ? 'bg-orange-600' :
                              case_item.severity === 'moderate' ? 'bg-yellow-600' : 'bg-slate-400'
                            )} />
                            <div className="flex items-start justify-between mb-2">
                               <div>
                                  <div className="flex items-center gap-2 mb-1">
                                     <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{case_item.incident_type}</p>
                                     <Badge className={cn(
                                       "text-[8px] font-black uppercase px-1.5 h-4 border-none",
                                       case_item.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                       case_item.severity === 'major' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                                     )}>
                                       {case_item.severity}
                                     </Badge>
                                  </div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {format(new Date(case_item.incident_date), "dd MMM yyyy")} • Reported by Admin
                                  </p>
                               </div>
                               <Badge variant="outline" className={cn(
                                 "text-[9px] font-black uppercase",
                                 case_item.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500'
                               )}>
                                 {case_item.status}
                               </Badge>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed mb-4">{case_item.description}</p>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                               <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Action Taken</p>
                               <p className="text-xs font-bold text-slate-800">{case_item.action_taken || "Pending investigation"}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  ) : (
                    <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                       <Shield className="h-12 w-12 mb-4 opacity-20 text-emerald-500" />
                       <p className="text-sm font-black uppercase tracking-widest text-slate-900">Exemplary Conduct</p>
                       <p className="text-xs mt-1">No discipline cases found for this learner.</p>
                    </div>
                  )}
               </div>
            </TabsContent>
            
            <TabsContent value="health" className="mt-0 space-y-6">
               <div className="p-12 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center text-slate-400">
                  <HeartPulse className="h-12 w-12 mb-4 opacity-20" />
                  <h5 className="font-black uppercase tracking-widest text-slate-900">Medical History</h5>
                  <p className="text-sm mt-1 max-w-xs">Infirmary visits, allergies, and health notes will appear here.</p>
               </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-4 bg-slate-50 border-t flex items-center justify-between shrink-0">
           <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
             Property of Alheib Mixed Day & Boarding School
           </p>
           <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest border-slate-200">
               Print Dossier
             </Button>
             <Button size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest bg-slate-900">
               Edit Learner
             </Button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoItem({ label, value, icon: Icon, className }: { label: string, value: string, icon: any, className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center gap-2 text-slate-400">
        <Icon className="h-3 w-3" />
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-bold text-slate-900 truncate">
        {value || "Not Provided"}
      </p>
    </div>
  );
}
