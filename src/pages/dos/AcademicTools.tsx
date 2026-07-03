import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "../../contexts/LanguageContext";
import Subjects from "./Subjects";
import CurriculumSetup from "./CurriculumSetup";
import SubjectLoad from "./SubjectLoad";
import SchemeOfWork from "./SchemeOfWork";
import Syllabus from "./Syllabus";
import SyllabusCoverageDashboard from "./SyllabusCoverageDashboard";
import SyllabusReports from "./SyllabusReports";
import LessonTracking from "./LessonTracking";

export default function AcademicTools() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("subjects");

  const TABS = [
    { id: "subjects", label: t("Subjects") },
    { id: "curriculum", label: t("Curriculum") },
    { id: "subject-load", label: t("Subject Load") },
    { id: "scheme-of-work", label: t("Scheme of Work") },
    { id: "syllabus", label: t("Syllabus") },
    { id: "coverage", label: t("Coverage") },
    { id: "reports", label: t("Reports") },
    { id: "lesson-tracking", label: t("Lesson Tracking") },
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
        {tab === "subjects" && <Subjects />}
        {tab === "curriculum" && <CurriculumSetup />}
        {tab === "subject-load" && <SubjectLoad />}
        {tab === "scheme-of-work" && <SchemeOfWork />}
        {tab === "syllabus" && <Syllabus />}
        {tab === "coverage" && <SyllabusCoverageDashboard />}
        {tab === "reports" && <SyllabusReports />}
        {tab === "lesson-tracking" && <LessonTracking />}
      </div>
    </Tabs>
  );
}
