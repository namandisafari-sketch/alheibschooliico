import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Subjects from "./Subjects";
import CurriculumSetup from "./CurriculumSetup";
import SubjectLoad from "./SubjectLoad";
import SchemeOfWork from "./SchemeOfWork";
import Syllabus from "./Syllabus";
import SyllabusCoverageDashboard from "./SyllabusCoverageDashboard";
import SyllabusReports from "./SyllabusReports";
import LessonTracking from "./LessonTracking";

const TABS = [
  { id: "subjects", label: "Subjects" },
  { id: "curriculum", label: "Curriculum" },
  { id: "subject-load", label: "Subject Load" },
  { id: "scheme-of-work", label: "Scheme of Work" },
  { id: "syllabus", label: "Syllabus" },
  { id: "coverage", label: "Coverage" },
  { id: "reports", label: "Reports" },
  { id: "lesson-tracking", label: "Lesson Tracking" },
];

export default function AcademicTools() {
  const [tab, setTab] = useState("subjects");

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
