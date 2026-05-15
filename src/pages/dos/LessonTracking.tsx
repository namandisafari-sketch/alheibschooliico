
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileCheck, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Calendar,
  User,
  BookOpen
} from "lucide-react";
import { useLessonPlans, useUpdateLessonPlan } from "@/hooks/useLessonPlans";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";

const LessonTracking = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [reviewPlan, setReviewPlan] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  
  const { data: allPlans = [], isLoading } = useLessonPlans();
  const updatePlan = useUpdateLessonPlan();

  const filteredPlans = allPlans.filter(p => {
    const matchesSearch = p.teacher?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!reviewPlan) return;
    
    try {
      await updatePlan.mutateAsync({
        id: reviewPlan.id,
        status,
        dos_feedback: feedback,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      });
      toast.success(`Lesson plan ${status}`);
      setReviewPlan(null);
      setFeedback("");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <DashboardLayout title="Lesson Plan Tracking" subtitle="Review and approve teacher instructional materials">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-end bg-card p-4 rounded-xl border shadow-sm">
           <div className="relative w-full sm:w-[300px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input 
               placeholder="Search teacher or title..." 
               className="pl-9"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
             {['all', 'pending', 'approved', 'rejected'].map((status) => (
                <Button
                  key={status}
                  variant={selectedStatus === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStatus(status)}
                  className="capitalize h-8"
                >
                  {status}
                </Button>
             ))}
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center text-muted-foreground">
               Loading lesson plans...
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl">
               <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/20 mb-2" />
               <p className="text-muted-foreground font-bold">No lesson plans found</p>
               <p className="text-xs text-muted-foreground">Adjust your filters or search terms</p>
            </div>
          ) : (
            filteredPlans.map((plan) => (
              <Card key={plan.id} className="group hover:shadow-md transition-all border-slate-200">
                <CardHeader className="pb-3 bg-slate-50/50 rounded-t-xl border-b mb-3">
                   <div className="flex justify-between items-start">
                     <Badge 
                       variant={plan.status === 'approved' ? 'success' : plan.status === 'pending' ? 'warning' : 'destructive'}
                       className="capitalize text-[10px] font-bold"
                     >
                       {plan.status}
                     </Badge>
                     <span className="text-[10px] font-mono text-muted-foreground">Week {plan.week_number}</span>
                   </div>
                   <CardTitle className="text-base line-clamp-1 mt-2 text-slate-800">{plan.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <User className="h-3 w-3 text-primary" />
                      <span className="font-bold text-slate-700">{plan.teacher?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <BookOpen className="h-3 w-3 text-blue-500" />
                      <span>{plan.class?.name} • {plan.subject?.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Submitted: {format(new Date(plan.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-3 bg-slate-50 p-2 rounded italic">
                    {plan.objectives || "No objectives defined"}
                  </p>

                  <Button 
                    className="w-full gap-2 h-9" 
                    variant={plan.status === 'pending' ? 'default' : 'outline'}
                    onClick={() => {
                      setReviewPlan(plan);
                      setFeedback(plan.dos_feedback || "");
                    }}
                  >
                    {plan.status === 'pending' ? 'Review & Approve' : 'View Details'}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={!!reviewPlan} onOpenChange={(o) => !o && setReviewPlan(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lesson Plan Review</DialogTitle>
            <DialogDescription>
              Detailed view and approval panel for instructional materials
            </DialogDescription>
          </DialogHeader>
          
          {reviewPlan && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Teacher</p>
                  <p className="font-black">{reviewPlan.teacher?.full_name}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Class / Subject</p>
                  <p className="font-black">{reviewPlan.class?.name} • {reviewPlan.subject?.name}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-bold border-b pb-1">Instructional Details</h4>
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">TITLE: {reviewPlan.title}</p>
                  <div className="bg-slate-50 p-3 rounded-lg overflow-y-auto max-h-[150px]">
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Objectives:</p>
                    <p className="text-sm whitespace-pre-wrap">{reviewPlan.objectives}</p>
                  </div>
                  {reviewPlan.content && (
                    <div className="bg-slate-50 p-3 rounded-lg overflow-y-auto max-h-[150px]">
                      <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Content Summary:</p>
                      <p className="text-sm whitespace-pre-wrap">{reviewPlan.content}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold">DOS Feedback / Comments</label>
                <Textarea 
                  placeholder="Provide guidance or reasons for approval/rejection..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  variant="destructive" 
                  className="flex-1 gap-2"
                  onClick={() => handleReview('rejected')}
                  disabled={updatePlan.isPending}
                >
                  <XCircle className="h-4 w-4" /> Reject Plan
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => handleReview('approved')}
                  disabled={updatePlan.isPending}
                >
                  <CheckCircle className="h-4 w-4" /> Approve & Sign
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default LessonTracking;
