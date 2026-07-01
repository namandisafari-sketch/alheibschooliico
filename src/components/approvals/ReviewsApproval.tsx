// @ts-nocheck
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp, ThumbsDown, Clock, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export const ReviewsApproval = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("pending");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews-ratings", filter],
    queryFn: async () => {
      try {
        let query = supabase
          .from("reviews_ratings")
          .select("*, profiles:reviewer_id(full_name), learners(full_name, admission_number)")
          .order("created_at", { ascending: false })
          .limit(100);

        if (filter === "pending") query = query.eq("is_approved", false);
        else if (filter === "approved") query = query.eq("is_approved", true);
        else if (filter === "rejected") query = query.is("is_approved", null);

        const { data, error } = await query;
        if (error) throw error;
        return data;
      } catch {
        return [];
      }
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      try {
        const { error } = await supabase
          .from("reviews_ratings")
          .update({
            is_approved: approve,
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (error) throw error;
      } catch {
        throw new Error("Reviews table not available");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews-ratings"] });
      toast.success("Review status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const totalFilterCount = (status: string) => {
    if (!reviews.length && !isLoading) return 0;
    return reviews.length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {["pending", "approved", "rejected", "all"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="text-xs font-bold uppercase tracking-widest h-9"
          >
            {f === "pending" && <Clock className="h-3 w-3 mr-1" />}
            {f === "approved" && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {f === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
            {f}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            Reviews & Ratings
            {filter !== "all" && (
              <Badge variant="secondary" className="ml-2">{reviews.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No {filter} reviews found.</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="p-4 border rounded-xl bg-white space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{review.profiles?.full_name || "Anonymous"}</span>
                        <Badge variant="outline" className="text-[10px]">{review.reviewer_type}</Badge>
                        {review.learners && (
                          <span className="text-xs text-muted-foreground">about {review.learners.full_name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-3.5 w-3.5 ${star <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted"}`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">({review.category})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(review.created_at), "dd MMM yyyy HH:mm")}
                      </span>
                      {review.is_approved === true && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px]">Approved</Badge>
                      )}
                      {review.is_approved === false && (
                        <Badge className="bg-red-100 text-red-700 border-none text-[10px]">Rejected</Badge>
                      )}
                      {review.is_approved === null && (
                        <Badge className="bg-amber-100 text-amber-700 border-none text-[10px]">Pending</Badge>
                      )}
                    </div>
                  </div>

                  {review.review_text && (
                    <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{review.review_text}</p>
                  )}

                  {(review.is_approved === null || review.is_approved === false) && (
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => approveMutation.mutate({ id: review.id, approve: true })}
                        disabled={approveMutation.isPending}
                      >
                        <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => approveMutation.mutate({ id: review.id, approve: false })}
                        disabled={approveMutation.isPending}
                      >
                        <ThumbsDown className="h-3.5 w-3.5 mr-1" /> Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
