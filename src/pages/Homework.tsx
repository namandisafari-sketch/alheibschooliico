
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookMarked, Camera, CalendarDays, Library } from "lucide-react";
import { ActiveHomeworkTab } from "@/components/homework/ActiveHomeworkTab";
import { UploadHomeworkTab } from "@/components/homework/UploadHomeworkTab";
import { HolidayWorkTab } from "@/components/homework/HolidayWorkTab";
import { HomeworkResourcesTab } from "@/components/homework/HomeworkResourcesTab";

const Homework = () => {
  return (
    <DashboardLayout title="Digital Homework Portal" subtitle="Upload and track learner's books scans and holiday work">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto p-1 bg-slate-100/50">
          <TabsTrigger value="active" className="gap-2 py-2.5">
            <BookMarked className="h-4 w-4" /> Active Homework
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2 py-2.5">
            <Camera className="h-4 w-4" /> Upload Work
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2 py-2.5">
            <Library className="h-4 w-4" /> Resources
          </TabsTrigger>
          <TabsTrigger value="holiday" className="gap-2 py-2.5">
            <CalendarDays className="h-4 w-4" /> Holiday Work
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-6">
          <ActiveHomeworkTab />
        </TabsContent>
        <TabsContent value="upload" className="mt-6">
          <UploadHomeworkTab />
        </TabsContent>
        <TabsContent value="resources" className="mt-6">
          <HomeworkResourcesTab />
        </TabsContent>
        <TabsContent value="holiday" className="mt-6">
          <HolidayWorkTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Homework;
