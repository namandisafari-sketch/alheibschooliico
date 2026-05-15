
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Star, UserCheck, Calendar } from "lucide-react";
import { QuranTrackingTab } from "@/components/madrasa/QuranTrackingTab";
import { SalahAttendanceTab } from "@/components/madrasa/SalahAttendanceTab";
import { AkhlaaqReportingTab } from "@/components/madrasa/AkhlaaqReportingTab";
import { MadrasaTimetableTab } from "@/components/madrasa/MadrasaTimetableTab";

const Madrasa = () => {
  return (
    <DashboardLayout title="Islamic Education Suite" subtitle="Manage Quran progress, Salah attendance, and Character building">
      <Tabs defaultValue="quran" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
          <TabsTrigger value="quran" className="gap-2">
            <BookOpen className="h-4 w-4" /> Quran & Hifdh
          </TabsTrigger>
          <TabsTrigger value="salah" className="gap-2">
            <UserCheck className="h-4 w-4" /> Salah Attendance
          </TabsTrigger>
          <TabsTrigger value="akhlaaq" className="gap-2">
            <Star className="h-4 w-4" /> Akhlaaq (Conduct)
          </TabsTrigger>
          <TabsTrigger value="timetable" className="gap-2">
            <Calendar className="h-4 w-4" /> Madrasa Timetable
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="quran" className="mt-4">
          <QuranTrackingTab />
        </TabsContent>
        <TabsContent value="salah" className="mt-4">
          <SalahAttendanceTab />
        </TabsContent>
        <TabsContent value="akhlaaq" className="mt-4">
          <AkhlaaqReportingTab />
        </TabsContent>
        <TabsContent value="timetable" className="mt-4">
          <MadrasaTimetableTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Madrasa;
