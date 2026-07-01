// @ts-nocheck
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink, Download, BookOpen, ShieldCheck, Landmark, Link as LinkIcon, Info, AlertTriangle, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  useMinistryGuidelines,
  useCompliancePortals,
  useComplianceNotices,
  useNationalStandards,
  useComplianceContacts,
} from "@/hooks/useCompliance";

const iconMap = {
  BookOpen, FileText, ShieldCheck, Link: LinkIcon,
};

const downloadFile = async (fileUrl: string, fileName: string) => {
  if (!fileUrl) return;
  try {
    if (fileUrl.startsWith("http")) {
      window.open(fileUrl, "_blank");
      return;
    }
    const { data, error } = await supabase.storage
      .from("compliance-documents")
      .download(fileUrl);
    if (error) throw error;
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    toast.error("Download failed");
  }
};

const severityStyles = {
  info: "bg-blue-50 border-blue-200 text-blue-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
  critical: "bg-red-50 border-red-200 text-red-900",
};

const statusStyles = {
  compliant: "text-emerald-600",
  non_compliant: "text-red-600",
  pending: "text-amber-600",
};

const Ministry = () => {
  const { data: guidelines = [], isLoading: guidelinesLoading } = useMinistryGuidelines();
  const { data: portals = [], isLoading: portalsLoading } = useCompliancePortals();
  const { data: notices = [], isLoading: noticesLoading } = useComplianceNotices();
  const { data: standards = [], isLoading: standardsLoading } = useNationalStandards();
  const { data: contacts = [], isLoading: contactsLoading } = useComplianceContacts();

  return (
    <DashboardLayout title="Ministry Context" subtitle="MoES Compliance, Standards & National Regulations">
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="md:col-span-3 border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-900 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-black tracking-tight">Government Guidelines</CardTitle>
                  <CardDescription className="text-slate-400 text-xs">Official circulars and directives from MoES</CardDescription>
                </div>
                <Landmark className="h-8 w-8 text-slate-700" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {guidelinesLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <div key={i} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ))
                ) : guidelines.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm font-medium">
                    No guidelines found in the database.
                  </div>
                ) : (
                  guidelines.map((doc, i) => (
                    <div key={doc.id || i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <FileText className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-none">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-1 py-0 border-slate-300">
                              {doc.type}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {format(new Date(doc.issue_date), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-2 text-[10px] font-bold"
                          onClick={() => downloadFile(doc.file_url, doc.title)}
                        >
                          <Download className="h-3.5 w-3.5" /> {doc.file_size || "Download"}
                        </Button>
                        {doc.file_url && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => doc.file_url.startsWith("http") && window.open(doc.file_url, "_blank")}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-sm font-black flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" /> External Portals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {portalsLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full rounded-md" />
                  ))
                ) : portals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">No portals configured.</p>
                ) : (
                  portals.map((p) => {
                    const PortalIcon = iconMap[p.icon_name] || LinkIcon;
                    return (
                      <Button
                        key={p.id}
                        className="w-full justify-between h-10 px-4 text-xs font-bold"
                        variant="outline"
                        onClick={() => window.open(p.url, "_blank")}
                      >
                        <span className="flex items-center gap-2"><PortalIcon className="h-3.5 w-3.5" /> {p.name}</span>
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </Button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {notices.length > 0 && notices.map((notice) => (
              <Card key={notice.id} className={`border shadow-sm ${severityStyles[notice.severity] || severityStyles.info}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-black flex items-center gap-2">
                    {notice.severity === "critical" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                    {notice.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-[11px] leading-relaxed font-medium">{notice.message}</p>
                  {notice.action_label && (
                    <Button
                      className="w-full mt-4 h-8 font-bold text-[11px]"
                      size="sm"
                      onClick={() => window.location.href = notice.action_link || "#"}
                    >
                      {notice.action_label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight">National Standards (NCS)</CardTitle>
              <CardDescription className="text-xs">Minimum requirements for private educational institutions</CardDescription>
            </CardHeader>
            <CardContent>
              {standardsLoading ? (
                <div className="grid grid-cols-2 gap-4">
                  {Array(4).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {standards.map((s) => (
                    <div key={s.id} className="p-4 border rounded-xl bg-slate-50/50">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">{s.name}</p>
                      <p className="text-xl font-black mt-2">{s.current_value || s.requirement}</p>
                      <p className={`text-[9px] font-bold mt-1 ${statusStyles[s.status] || ""}`}>
                        {s.status === "compliant" ? "Compliant" : s.status === "non_compliant" ? "Non-Compliant" : "Pending"}
                        {s.current_value && s.requirement && s.current_value !== s.requirement
                          ? ` (Required: ${s.requirement})` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm bg-slate-900 text-white border-none">
            <CardHeader>
              <CardTitle className="text-lg font-black tracking-tight">Compliance Contacts</CardTitle>
              <CardDescription className="text-slate-400 text-xs">Assigned Inspectors & DES Officers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactsLoading ? (
                Array(2).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))
              ) : contacts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center">No compliance contacts configured.</p>
              ) : (
                contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold">{c.name}</p>
                      <p className="text-[10px] text-slate-400">{c.title}</p>
                      {c.region && <p className="text-[9px] text-slate-500">{c.region}</p>}
                    </div>
                    <div className="flex gap-1">
                      {c.phone && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-white" onClick={() => window.open(`tel:${c.phone}`)}>
                          <Phone className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {c.email && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-white" onClick={() => window.open(`mailto:${c.email}`)}>
                          <Mail className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Ministry;
