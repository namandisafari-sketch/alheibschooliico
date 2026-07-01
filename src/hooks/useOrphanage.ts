import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// ===== TYPE DEFINITIONS =====
export interface Sponsor {
  id: string; sponsor_number: string; full_name: string; email?: string; phone?: string;
  address?: string; city?: string; country: string; organization?: string;
  sponsor_type: "individual" | "corporate" | "ngo" | "government" | "foundation";
  status: "active" | "inactive" | "suspended"; tax_id?: string; notes?: string;
  photo_url?: string; created_at: string; updated_at: string;
}

export interface Sponsorship {
  id: string; sponsor_id: string; learner_id: string; sponsorship_number: string;
  type: "full" | "partial" | "educational" | "medical" | "emergency";
  start_date: string; end_date?: string; monthly_amount: number; currency: string;
  status: "active" | "paused" | "ended" | "cancelled"; notes?: string;
  created_at: string; sponsor?: Sponsor; learner?: any;
}

export interface SponsorshipPayment {
  id: string; sponsorship_id: string; amount: number; currency: string;
  payment_date: string; payment_method?: string; reference_number?: string;
  receipt_number?: string; notes?: string; created_at: string;
}

export interface EducationalSupport {
  id: string; learner_id: string; term: string; academic_year: string;
  school_fees_paid: number; school_fees_balance: number; supplies_provided?: string;
  supplies_cost: number; tutoring_hours: number; tutoring_notes?: string;
  performance_score?: number; performance_grade?: string; attendance_rate?: number;
  teacher_comments?: string; created_at: string;
}

export interface LivingHealthcare {
  id: string; learner_id: string; assessment_date: string;
  living_condition_score?: number; living_condition_notes?: string; health_status?: string;
  medical_visit_count: number; last_medical_visit_date?: string;
  counselor_visit_count: number; last_counselor_visit_date?: string;
  nutrition_status?: string; bmi?: number; next_checkup_date?: string; notes?: string;
}

export interface ReligiousDevelopment {
  id: string; learner_id: string; term: string; academic_year: string;
  quran_memorization?: string; quran_pages: number; islamic_studies_score?: number;
  salah_attendance_rate?: number; tarbiyah_score?: number; conduct_rating?: number;
  madrasa_attendance_rate?: number; teacher_notes?: string;
}

export interface SocialSport {
  id: string; learner_id: string; activity_type: string; activity_name: string;
  activity_date: string; participation_level?: string; achievement?: string;
  notes?: string; supervised_by?: string;
}

export interface SponsorReport {
  id: string; sponsorship_id: string; report_type: string; report_date: string;
  period_start: string; period_end: string; title: string; summary?: string;
  academic_progress?: string; health_update?: string; religious_progress?: string;
  social_activities?: string; photo_urls?: string[]; status: "draft" | "final" | "sent";
  sent_at?: string; sponsorship?: Sponsorship;
}

export interface OrphanAlert {
  id: string; learner_id?: string; alert_type: string; severity: string;
  title: string; message?: string; is_resolved: boolean; created_at: string;
  learner?: any;
}

export interface OrphanCaseNote {
  id: string; learner_id: string; note_type: string; title: string;
  content: string; is_confidential: boolean; created_at: string; created_by?: string;
}

// ===== HELPERS =====
const currentTerm = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  if (month >= 2 && month <= 5) return "Term 1";
  if (month >= 6 && month <= 9) return "Term 2";
  return "Term 3";
};
const currentAcademicYear = () => `${new Date().getFullYear()}`;

// ===== SPONSORS =====
export function useSponsors(search?: string) {
  return useQuery({
    queryKey: ["sponsors", search],
    queryFn: async () => {
      let q = supabase.from("sponsors").select("*").order("full_name");
      if (search) q = q.or(`full_name.ilike.%${search}%,organization.ilike.%${search}%,sponsor_number.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Sponsor[];
    },
  });
}

export function useSponsor(id?: string) {
  return useQuery({
    queryKey: ["sponsor", id], enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("sponsors").select("*").eq("id", id).single();
      if (error) throw error;
      return data as Sponsor;
    },
  });
}

export function useSaveSponsor() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Partial<Sponsor> & { id?: string }) => {
      if (payload.id) {
        const { error } = await supabase.from("sponsors").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const num = `SP-${Date.now().toString(36).toUpperCase()}`;
        const { error } = await supabase.from("sponsors").insert({ ...payload, sponsor_number: num });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sponsors"] }); toast({ title: "Sponsor saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ===== SPONSORSHIPS =====
export function useSponsorships(filters?: { learner_id?: string; sponsor_id?: string; status?: string }) {
  return useQuery({
    queryKey: ["sponsorships", filters],
    queryFn: async () => {
      let q = supabase.from("sponsorships").select("*, sponsor:sponsors(*), learner:learners(id,full_name,admission_number,photo_url,class_id)");
      if (filters?.learner_id) q = q.eq("learner_id", filters.learner_id);
      if (filters?.sponsor_id) q = q.eq("sponsor_id", filters.sponsor_id);
      if (filters?.status) q = q.eq("status", filters.status);
      const { data, error } = await q.order("created_at", { ascending: false });
      if (error) throw error;
      return data as Sponsorship[];
    },
  });
}

export function useSaveSponsorship() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Partial<Sponsorship> & { id?: string }) => {
      if (payload.id) {
        const { error } = await supabase.from("sponsorships").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const num = `SPON-${Date.now().toString(36).toUpperCase()}`;
        const { error } = await supabase.from("sponsorships").insert({ ...payload, sponsorship_number: num });
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sponsorships"] }); toast({ title: "Sponsorship saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ===== SPONSORSHIP PAYMENTS =====
export function useSponsorshipPayments(sponsorshipId?: string) {
  return useQuery({
    queryKey: ["sponsorship-payments", sponsorshipId],
    enabled: !!sponsorshipId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sponsorship_payments").select("*").eq("sponsorship_id", sponsorshipId).order("payment_date", { ascending: false });
      if (error) throw error;
      return data as SponsorshipPayment[];
    },
  });
}

export function useSavePayment() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Partial<SponsorshipPayment>) => {
      const { error } = await supabase.from("sponsorship_payments").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sponsorship-payments"] }); toast({ title: "Payment recorded" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ===== EDUCATIONAL SUPPORT =====
export function useEducationalSupport(learnerId?: string) {
  return useQuery({
    queryKey: ["educational-support", learnerId],
    enabled: !!learnerId,
    queryFn: async () => {
      const { data, error } = await supabase.from("orphan_educational_support").select("*").eq("learner_id", learnerId).order("academic_year", { ascending: false }).order("term", { ascending: false });
      if (error) throw error;
      return data as EducationalSupport[];
    },
  });
}

export function useSaveEducationalSupport() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Partial<EducationalSupport> & { id?: string }) => {
      if (payload.id) {
        const { error } = await supabase.from("orphan_educational_support").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("orphan_educational_support").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["educational-support"] }); toast({ title: "Educational record saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ===== LIVING & HEALTHCARE =====
export function useLivingHealthcare(learnerId?: string) {
  return useQuery({
    queryKey: ["living-healthcare", learnerId],
    enabled: !!learnerId,
    queryFn: async () => {
      const { data, error } = await supabase.from("orphan_living_healthcare").select("*").eq("learner_id", learnerId).order("assessment_date", { ascending: false });
      if (error) throw error;
      return data as LivingHealthcare[];
    },
  });
}

export function useSaveLivingHealthcare() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Partial<LivingHealthcare> & { id?: string }) => {
      if (payload.id) {
        const { error } = await supabase.from("orphan_living_healthcare").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("orphan_living_healthcare").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["living-healthcare"] }); toast({ title: "Assessment saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ===== RELIGIOUS DEVELOPMENT =====
export function useReligiousDevelopment(learnerId?: string) {
  return useQuery({
    queryKey: ["religious-development", learnerId],
    enabled: !!learnerId,
    queryFn: async () => {
      const { data, error } = await supabase.from("orphan_religious_development").select("*").eq("learner_id", learnerId).order("academic_year", { ascending: false });
      if (error) throw error;
      return data as ReligiousDevelopment[];
    },
  });
}

export function useSaveReligiousDevelopment() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Partial<ReligiousDevelopment> & { id?: string }) => {
      if (payload.id) {
        const { error } = await supabase.from("orphan_religious_development").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("orphan_religious_development").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["religious-development"] }); toast({ title: "Religious record saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ===== SOCIAL & SPORTS =====
export function useSocialSports(learnerId?: string) {
  return useQuery({
    queryKey: ["social-sports", learnerId],
    enabled: !!learnerId,
    queryFn: async () => {
      let q = supabase.from("orphan_social_sports").select("*, learner:learners(id,full_name)").order("activity_date", { ascending: false });
      if (learnerId) q = q.eq("learner_id", learnerId);
      const { data, error } = await q;
      if (error) throw error;
      return data as SocialSport[];
    },
  });
}

export function useSaveSocialSport() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Partial<SocialSport>) => {
      const { error } = await supabase.from("orphan_social_sports").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["social-sports"] }); toast({ title: "Activity recorded" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ===== SPONSOR REPORTS =====
export function useSponsorReports(sponsorshipId?: string) {
  return useQuery({
    queryKey: ["sponsor-reports", sponsorshipId],
    enabled: !!sponsorshipId,
    queryFn: async () => {
      const { data, error } = await supabase.from("sponsor_reports").select("*, sponsorship:sponsorships(*)").eq("sponsorship_id", sponsorshipId).order("report_date", { ascending: false });
      if (error) throw error;
      return data as SponsorReport[];
    },
  });
}

export function useSaveSponsorReport() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Partial<SponsorReport> & { id?: string }) => {
      if (payload.id) {
        const { error } = await supabase.from("sponsor_reports").update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sponsor_reports").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sponsor-reports"] }); toast({ title: "Report saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ===== ORPHAN ALERTS =====
export function useOrphanAlerts(unresolvedOnly?: boolean) {
  return useQuery({
    queryKey: ["orphan-alerts", unresolvedOnly],
    queryFn: async () => {
      let q = supabase.from("orphan_alerts").select("*, learner:learners(id,full_name,admission_number)").order("created_at", { ascending: false }).limit(100);
      if (unresolvedOnly) q = q.eq("is_resolved", false);
      const { data, error } = await q;
      if (error) throw error;
      return data as OrphanAlert[];
    },
  });
}

export function useResolveAlert() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orphan_alerts").update({ is_resolved: true, resolved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orphan-alerts"] }); toast({ title: "Alert resolved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useCreateAlert() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Partial<OrphanAlert>) => {
      const { error } = await supabase.from("orphan_alerts").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orphan-alerts"] }); toast({ title: "Alert created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ===== CASE NOTES =====
export function useCaseNotes(learnerId?: string) {
  return useQuery({
    queryKey: ["case-notes", learnerId],
    enabled: !!learnerId,
    queryFn: async () => {
      const { data, error } = await supabase.from("orphan_case_notes").select("*, creator:profiles!created_by(full_name)").eq("learner_id", learnerId).order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useSaveCaseNote() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async (payload: Partial<OrphanCaseNote>) => {
      const { error } = await supabase.from("orphan_case_notes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["case-notes"] }); toast({ title: "Case note saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ===== DASHBOARD STATS =====
export function useOrphanageStats() {
  return useQuery({
    queryKey: ["orphanage-stats"],
    queryFn: async () => {
      const [orphansRes, sponsorsRes, sponsorshipsRes, alertsRes] = await Promise.all([
        supabase.from("learners").select("id", { count: "exact", head: true }).eq("is_orphan", true),
        supabase.from("sponsors").select("id", { count: "exact", head: true }),
        supabase.from("sponsorships").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("orphan_alerts").select("id", { count: "exact", head: true }).eq("is_resolved", false),
      ]);
      return {
        totalOrphans: orphansRes.count || 0,
        totalSponsors: sponsorsRes.count || 0,
        activeSponsorships: sponsorshipsRes.count || 0,
        unresolvedAlerts: alertsRes.count || 0,
      };
    },
  });
}

// ===== ORPHAN LEARNERS =====
export function useOrphanLearners(search?: string) {
  return useQuery({
    queryKey: ["orphan-learners", search],
    queryFn: async () => {
      let q = supabase.from("learners").select("*, class:classes(name)").eq("is_orphan", true).order("full_name");
      if (search) q = q.or(`full_name.ilike.%${search}%,admission_number.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useAllLearners(search?: string) {
  return useQuery({
    queryKey: ["all-learners-for-orphanage", search],
    queryFn: async () => {
      let q = supabase.from("learners").select("id,full_name,admission_number,class:classes(name),is_orphan,orphan_status").order("full_name");
      if (search) q = q.or(`full_name.ilike.%${search}%,admission_number.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useMarkOrphan() {
  const qc = useQueryClient(); const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ learnerId, isOrphan, orphanStatus, notes }: { learnerId: string; isOrphan: boolean; orphanStatus?: string; notes?: string }) => {
      const { error } = await supabase.from("learners").update({ is_orphan: isOrphan, orphan_status: orphanStatus, orphan_notes: notes }).eq("id", learnerId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["orphan-learners"] }); qc.invalidateQueries({ queryKey: ["all-learners-for-orphanage"] }); toast({ title: "Learner status updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

// ===== SPONSOR ANALYTICS =====
export function useSponsorAnalytics() {
  return useQuery({
    queryKey: ["sponsor-analytics"],
    queryFn: async () => {
      const [paymentsRes, sponsorshipsRes, reportsRes] = await Promise.all([
        supabase.from("sponsorship_payments").select("amount,payment_date"),
        supabase.from("sponsorships").select("type,status,monthly_amount"),
        supabase.from("sponsor_reports").select("status"),
      ]);
      const payments = paymentsRes.data || [];
      const sponsorships = sponsorshipsRes.data || [];
      const reports = reportsRes.data || [];

      const totalPaid = payments.reduce((s, p: any) => s + Number(p.amount), 0);
      const monthlyTotal = sponsorships.filter((s: any) => s.status === "active").reduce((s, sp: any) => s + Number(sp.monthly_amount), 0);
      const reportsSent = reports.filter((r: any) => r.status === "sent").length;
      const reportsDraft = reports.filter((r: any) => r.status === "draft").length;

      const paymentsByMonth: Record<string, number> = {};
      payments.forEach((p: any) => {
        const key = p.payment_date?.substring(0, 7) || "unknown";
        paymentsByMonth[key] = (paymentsByMonth[key] || 0) + Number(p.amount);
      });

      return { totalPaid, monthlyTotal, reportsSent, reportsDraft, paymentsByMonth, totalPayments: payments.length, activeSponsorships: sponsorships.filter((s: any) => s.status === "active").length };
    },
  });
}
