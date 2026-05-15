
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookMarked, Camera, History, CalendarDays } from "lucide-react";
import { ActiveHomeworkTab } from "@/components/homework/ActiveHomeworkTab";
import { UploadHomeworkTab } from "@/components/homework/UploadHomeworkTab";
import { HolidayWorkTab } from "@/components/homework/HolidayWorkTab";

const Homework = () => {
  return (
    <DashboardLayout title="Digital Homework Portal" subtitle="Upload and track learner's books scans and holiday work">
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="active" className="gap-2">
            <BookMarked className="h-4 w-4" /> Active Homework
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Camera className="h-4 w-4" /> Upload Work
          </TabsTrigger>
          <TabsTrigger value="holiday" className="gap-2">
            <CalendarDays className="h-4 w-4" /> Holiday Work
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          <ActiveHomeworkTab />
        </TabsContent>
        <TabsContent value="upload" className="mt-4">
          <UploadHomeworkTab />
        </TabsContent>
        <TabsContent value="holiday" className="mt-4">
          <HolidayWorkTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Homework;
