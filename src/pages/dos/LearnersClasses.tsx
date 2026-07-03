import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "../../contexts/LanguageContext";
import P7Mgt from "./P7Mgt";
import ClassTeachers from "./ClassTeachers";
import Assignments from "./Assignments";
import IPLE from "./IPLE";

export default function LearnersClasses() {
  const { t } = useLanguage();
  const [tab, setTab] = useState("p7");

  const TABS = [
    { id: "p7", label: t("P7 Management") },
    { id: "class-teachers", label: t("Class Teachers") },
    { id: "assignments", label: t("Assignments") },
    { id: "iple", label: t("IPLE") },
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
        {tab === "p7" && <P7Mgt />}
        {tab === "class-teachers" && <ClassTeachers />}
        {tab === "assignments" && <Assignments />}
        {tab === "iple" && <IPLE />}
      </div>
    </Tabs>
  );
}
