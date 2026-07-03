import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "../../contexts/LanguageContext";
import Exams from "./Exams";
import SeatingPlanManagement from "./SeatingPlanManagement";
import GradingScaleConfig from "./GradingScaleConfig";
import Analysis from "./Analysis";

export default function ExamsGrading() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("exams");

  const TABS = [
    { id: "exams", label: t("Exams") },
    { id: "seating", label: t("Seating Plans") },
    { id: "grading", label: t("Grading Scales") },
    { id: "analysis", label: t("Analysis") },
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
        {tab === "exams" && <Exams />}
        {tab === "seating" && <SeatingPlanManagement />}
        {tab === "grading" && <GradingScaleConfig />}
        {tab === "analysis" && <Analysis />}
      </div>
    </Tabs>
  );
}
