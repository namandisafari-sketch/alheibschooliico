import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";

type AttendanceStatus = Database["public"]["Enums"]["attendance_status"];

export interface AttendanceRecord {
  id: string;
  learner_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
  check_in_time: string | null;
  notes: string | null;
  learner_name?: string;
}

export interface LearnerWithAttendance {
  id: string;
  full_name: string;
  class_id: string | null;
  attendance?: AttendanceRecord | null;
}

export const useAttendance = (classId: string | null, date: string) => {
  return useQuery({
    queryKey: ["attendance", classId, date],
    queryFn: async () => {
      if (!classId) return [];

      // Fetch learners in this class
      const { data: learners, error: learnersError } = await supabase
        .from("learners")
        .select("id, full_name, class_id")
        .eq("class_id", classId)
        .eq("status", "active")
        .order("full_name");

      if (learnersError) throw learnersError;

      // Fetch attendance records for this class and date
      const { data: attendance, error: attendanceError } = await supabase
        .from("attendance")
        .select("*")
        .eq("class_id", classId)
        .eq("date", date);

      if (attendanceError) throw attendanceError;

      const attendanceMap = new Map(
        attendance?.map((a) => [a.learner_id, a]) || []
      );

      return learners.map((learner) => ({
        ...learner,
        attendance: attendanceMap.get(learner.id) || null,
      })) as LearnerWithAttendance[];
    },
    enabled: !!classId,
  });
};

export const useMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      learnerId,
      classId,
      date,
      status,
      existingId,
    }: {
      learnerId: string;
      classId: string;
      date: string;
      status: AttendanceStatus;
      existingId?: string;
    }) => {
      const now = new Date();
      const checkInTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:00`;

      if (existingId) {
        // Update existing record
        const { error } = await supabase
          .from("attendance")
          .update({ status, check_in_time: status === "present" || status === "late" ? checkInTime : null })
          .eq("id", existingId);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase.from("attendance").insert({
          learner_id: learnerId,
          class_id: classId,
          date,
          status,
          check_in_time: status === "present" || status === "late" ? checkInTime : null,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance",
        variant: "destructive",
      });
    },
  });
};

export const useBulkMarkAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      classId,
      date,
      records,
    }: {
      classId: string;
      date: string;
      records: { learnerId: string; status: AttendanceStatus; existingId?: string }[];
    }) => {
      const now = new Date();
      const checkInTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:00`;

      // Separate updates and inserts
      const toUpdate = records.filter((r) => r.existingId);
      const toInsert = records.filter((r) => !r.existingId);

      // Process updates
      for (const record of toUpdate) {
        await supabase
          .from("attendance")
          .update({
            status: record.status,
            check_in_time: record.status === "present" || record.status === "late" ? checkInTime : null,
          })
          .eq("id", record.existingId!);
      }

      // Process inserts
      if (toInsert.length > 0) {
        const { error } = await supabase.from("attendance").insert(
          toInsert.map((record) => ({
            learner_id: record.learnerId,
            class_id: classId,
            date,
            status: record.status,
            check_in_time: record.status === "present" || record.status === "late" ? checkInTime : null,
          }))
        );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast({ title: "Success", description: "Attendance saved successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save attendance",
        variant: "destructive",
      });
    },
  });
};
