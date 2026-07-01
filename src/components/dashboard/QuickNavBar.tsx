// @ts-nocheck
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, BookOpen, Users, Stethoscope, Bed, ShoppingCart, FileText, Calendar, BarChart3, ClipboardCheck } from "lucide-react";

const links = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: BookOpen, label: "Classes", path: "/classes" },
  { icon: Users, label: "Students", path: "/students" },
  { icon: Stethoscope, label: "Health Center", path: "/nurse" },
  { icon: Bed, label: "Dormitories", path: "/hostel" },
  { icon: ShoppingCart, label: "Store", path: "/store" },
  { icon: FileText, label: "Syllabus", path: "/dos/syllabus" },
  { icon: Calendar, label: "Timetable", path: "/dos/timetable" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: ClipboardCheck, label: "Attendance", path: "/attendance" },
];

export const QuickNavBar = () => (
  <div className="mb-4 lg:mb-6 overflow-x-auto">
    <div className="flex gap-2 min-w-max pb-2">
      {links.map(l => (
        <Button key={l.path} asChild variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-bold rounded-xl whitespace-nowrap border-slate-200 hover:border-primary/40 hover:bg-primary/5">
          <Link to={l.path}>
            <l.icon className="h-3.5 w-3.5" />
            {l.label}
          </Link>
        </Button>
      ))}
    </div>
  </div>
);
