import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "../contexts/LanguageContext";
import Staff from "./Staff";
import StaffAttendance from "./StaffAttendance";
import StaffManagement from "./StaffManagement";
import IDCards from "./IDCards";
import SiteSettings from "./SiteSettings";

export default function AdminTools() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("staff");

  const TABS = [
    { id: "staff", label: t("Staff") },
    { id: "attendance", label: t("Staff Attendance") },
    { id: "assignments", label: t("Assignments") },
    { id: "id-cards", label: t("ID Cards") },
    { id: "settings", label: t("System Settings") },
  ];

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col">
      <div className="sticky top-0 z-10 bg-background border-b">
        <TabsList className="flex-wrap h-auto rounded-none border-0 bg-transparent p-0">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <div className="flex-1">
        {tab === "staff" && <Staff />}
        {tab === "attendance" && <StaffAttendance />}
        {tab === "assignments" && <StaffManagement />}
        {tab === "id-cards" && <IDCards />}
        {tab === "settings" && <SiteSettings />}
      </div>
    </Tabs>
  );
}
