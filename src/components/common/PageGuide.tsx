import { useEffect } from "react";
import { 
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface GuideStep {
  title: string;
  description: string;
  icon?: any;
  element?: string; // CSS selector for driver.js
  side?: "top" | "left" | "right" | "bottom";
  align?: "start" | "center" | "end";
}

interface PageGuideConfig {
  [key: string]: GuideStep[];
}

const DEFAULT_STEPS: GuideStep[] = [
  {
    title: "Welcome to Alheib",
    description: "Welcome to the Alheib Mixed Day & Boarding School Management System. You can navigate through the sidebar to access different modules.",
    element: "#primary-sidebar",
    side: "right"
  },
  {
    title: "Need Help?",
    description: "If you're unsure where to go, please contact the system administrator or check the documentation in the settings.",
    element: "#dashboard-main-content",
    side: "top"
  }
];

const GUIDE_CONFIG: PageGuideConfig = {
  "/": [
    {
      title: "Alheib Command Center",
      description: "Welcome to your central dashboard. Here you can monitor school performance, finances, and system health in real-time.",
      element: "#dashboard-main-content",
      side: "top"
    },
    {
      title: "Smart Navigation",
      description: "Quickly access pupils, staff, finance, and logistics from the primary sidebar.",
      element: "#primary-sidebar",
      side: "right"
    },
    {
      title: "Operational Pulse",
      description: "Track system stability and academic progress metrics here.",
      element: "#system-health-widget",
      side: "right"
    },
    {
      title: "Financial Overview",
      description: "Monitor real-time fee collection totals and outstanding balances.",
      element: "#financial-control-hub",
      side: "top"
    },
    {
      title: "Quick Action Center",
      description: "Speed matters. Use these buttons to register visitors or log discipline incidents instantly.",
      element: "#quick-actions-bar",
      side: "left"
    }
  ],
  "/students": [
    {
      title: "Student Registry",
      description: "Manage all learners from a single pane of glass. You can filter by class, gender, or status.",
      element: "#student-registry-container",
      side: "top"
    },
    {
      title: "Registration Hub",
      description: "Click here to enroll a new pupil. The system will guide you through capturing their bio-data and parent info.",
      element: "#register-pupil-btn",
      side: "bottom"
    }
  ],
  "/staff": [
    {
      title: "Staff Overview",
      description: "A birds-eye view of your workforce distribution across different roles and departments.",
      element: "#staff-stats-overview",
      side: "bottom"
    },
    {
      title: "Recruitment",
      description: "Easily onboard new staff members and assign their initial roles here.",
      element: "#add-staff-btn",
      side: "left"
    },
    {
      title: "Staff Members",
      description: "Detailed cards for all non-teaching staff. You can view certifications and contact details.",
      element: "#staff-directory-grid",
      side: "top"
    }
  ],
  "/inventory": [
    {
      title: "Stock Control",
      description: "Monitor all school supplies. Items in red are below the critical threshold and need reordering.",
      element: "#inventory-grid",
      side: "top"
    },
    {
      title: "New Item Receipt",
      description: "Click here to add new stock types or fixed assets to the school registry.",
      element: "#new-item-btn",
      side: "bottom"
    }
  ],
  "/accountant/fees-tracking": [
    {
      title: "Financial Pulse",
      description: "Real-time summary of collected vs outstanding fee amounts.",
      element: "#fee-stats-cards",
      side: "bottom"
    },
    {
      title: "Transaction Log",
      description: "Full history of all fee payments received. You can search by reference or student name.",
      element: "#fee-payments-table",
      side: "top"
    }
  ],
  "/visitors": [
    {
      title: "Security Monitoring",
      description: "Track all campus entries and exits. Ensure every visitor has a valid purpose logged.",
      element: "#visitor-log-container",
      side: "top"
    }
  ],
  "/attendance": [
    {
      title: "Student Attendance",
      description: "Take and view daily attendance for all classes. Essential for tracking pupil reliability.",
      element: "#dashboard-main-content",
      side: "top"
    }
  ],
  "/reports": [
    {
      title: "Academic Reports",
      description: "Generate and download report cards, merit lists, and overall school performance analytics.",
      element: "#dashboard-main-content",
      side: "top"
    }
  ],
  "/health": [
    {
      title: "Clinic Operations",
      description: "Track student health visits and medication logs to maintain a healthy campus.",
      element: "#dashboard-main-content",
      side: "top"
    }
  ],
  "/manager/performance": [
    {
      title: "Performance Monitoring",
      description: "Track attendance reliability and syllabus coverage for all teachers and staff members across departments.",
      element: "#performance-overview-cards",
      side: "bottom"
    },
    {
      title: "Staff Scorecards",
      description: "Detailed individual metrics for each staff member, including attendance, parent feedback, and discipline cases.",
      element: "#staff-scorecards-list",
      side: "top"
    },
    {
      title: "Performance Exports",
      description: "Easily export quarterly reviews in CSV format for appraisals or administrative records.",
      element: "#export-report-btn",
      side: "left"
    }
  ],
  "/dos": [
    {
      title: "Director of Studies Hub",
      description: "Centralized control for timetables, exams, and syllabus coverage tracking.",
      element: "#dashboard-main-content",
      side: "top"
    }
  ],
  "/nurse": [
    {
      title: "Medical Center",
      description: "Monitor school infirmary activities, medication inventory, and student health records.",
      element: "#dashboard-main-content",
      side: "top"
    }
  ],
  "/store": [
    {
      title: "Store Management",
      description: "Manage inventory receiving, supplier tracking, and low-stock alerts.",
      element: "#dashboard-main-content",
      side: "top"
    }
  ],
  "/gate": [
    {
      title: "Campus Security",
      description: "Manage vehicle logs, exit passes, and security handovers at the main gate.",
      element: "#dashboard-main-content",
      side: "top"
    }
  ],
  "/tailor": [
    {
      title: "Tailor Workshop",
      description: "Manage uniform production, learner measurements, and repair services for the school.",
      element: "#tailor-stats",
      side: "top"
    },
    {
      title: "Task Board",
      description: "Track all tailor tasks from measurement to delivery. Filter by status or priority.",
      element: "#tailor-task-board",
      side: "top"
    },
    {
      title: "New Tailor Task",
      description: "Create a new uniform or repair order for a learner. Select the learner, take measurements, set a priority and cost.",
      element: "#new-tailor-task-btn",
      side: "bottom"
    }
  ],
  "/teacher/theology": [
    {
      title: "Theology Teacher Dashboard",
      description: "Assalamu Alaikum! This is your command center for Islamic Studies & IPLE. Track your subjects, candidates, and oral exams at a glance.",
      element: "#theology-welcome",
      side: "bottom"
    },
    {
      title: "Quick Access Links",
      description: "Jump directly to Islamic Marks Entry, Madrasa & Quran, Oral Assessments, and Lesson Planning — all your daily tools in one place.",
      element: "#theology-quick-links",
      side: "top"
    },
    {
      title: "IPLE Core Subjects",
      description: "The four pillars of IPLE: Holy Quran (Tajweed, Hifz, Tafseer), Al Fiqh (Salah, Rituals), Arabic Language (Nahw, Sarf), and Tarbia (Seerah, Ethics).",
      element: "#theology-iple-subjects",
      side: "top"
    }
  ],
  "/teacher/lesson-planner": [
    {
      title: "Lesson Planner Overview",
      description: "Create and manage detailed daily lesson plans here. Each plan captures objectives, activities, resources, and homework for a single lesson.",
      element: "#lesson-planner-form",
      side: "top"
    },
    {
      title: "1. Choose Your Assignment",
      description: "Select the class and subject you are assigned to teach. This links your plan to the correct curriculum track.",
      element: "#lp-assignment-select",
      side: "bottom"
    },
    {
      title: "2. Week & Date",
      description: "Set the week number from the academic calendar and the date the lesson will be delivered.",
      element: "#lp-week-date",
      side: "bottom"
    },
    {
      title: "3. Lesson Details",
      description: "Fill in the title, learning objectives, teaching activities, required resources, and homework assignment. Be specific so another teacher could deliver the same lesson.",
      element: "#lesson-planner-form",
      side: "top"
    },
    {
      title: "4. Create Plan",
      description: "Click to save your plan as a draft. You can edit or submit it for review later.",
      element: "#lp-create-btn",
      side: "bottom"
    },
    {
      title: "5. Your Plans List",
      description: "All your saved plans appear here. Each card shows the class, subject, week, status, and full lesson breakdown.",
      element: "#lp-plans-header",
      side: "bottom"
    },
    {
      title: "6. Duplicate a Plan",
      description: "Click the copy icon to duplicate a plan to the next week. Great for recurring lesson structures — just tweak what changed.",
      element: 'button[title="Duplicate"]',
      side: "left"
    },
    {
      title: "7. Track Status",
      description: "Toggle status with the check-circle button: Draft (not ready) → Submitted (ready for DOS review) → Approved (signed off). This keeps your Head of Studies in the loop.",
      element: 'button[title="Toggle Status"]',
      side: "right"
    }
  ],
  "/teacher/lesson-register": [
    {
      title: "Lesson Register Overview",
      description: "Record what actually happened in each lesson — whether it was fully taught, partially taught, or not taught. Essential for syllabus coverage tracking.",
      element: "#lr-stat-cards",
      side: "top"
    },
    {
      title: "Coverage Snapshot",
      description: "At a glance: how many lessons you've fully taught, partially covered, or missed. Keep these numbers balanced for good syllabus progress.",
      element: "#lr-stat-cards",
      side: "top"
    },
    {
      title: "1. Choose Assignment",
      description: "Select the class and subject you taught. The lesson plan dropdown will filter to match.",
      element: "#lr-assignment-select",
      side: "bottom"
    },
    {
      title: "2. Link a Lesson Plan",
      description: "Optionally link this register entry to a specific lesson plan you already created. This connects your planning to your actual delivery.",
      element: "#lr-plan-select",
      side: "bottom"
    },
    {
      title: "3. Mark Status",
      description: "Choose what happened: Taught (completed fully), Partially Taught (interrupted or ran out of time), or Not Taught (lesson was skipped). Be honest — this data drives curriculum reviews.",
      element: "#lr-status-select",
      side: "bottom"
    },
    {
      title: "4. Reflect & Report",
      description: "Note challenges faced, how learners participated, and what follow-up actions are needed. These notes help DOS adjust support and inform your next lesson.",
      element: "#lesson-register-form",
      side: "top"
    },
    {
      title: "5. Filter Entries",
      description: "Use these buttons to filter your register by status — focus on lessons you still need to teach or follow up on.",
      element: "#lr-filter-bar",
      side: "bottom"
    },
    {
      title: "6. Entries Timeline",
      description: "All your lesson register entries shown in chronological order. Each entry shows the topic, status, and your observation notes.",
      element: "#lr-entries-list",
      side: "top"
    }
  ]
};

interface PageGuideProps {
  pageName?: string;
  steps?: GuideStep[];
}

export const PageGuide = ({ pageName, steps: customSteps }: PageGuideProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const steps = customSteps || GUIDE_CONFIG[currentPath] || DEFAULT_STEPS;

  const startTour = () => {
    // Filter steps to ensure elements exist in DOM before trying to highlight them
    const filteredSteps = steps.filter(s => !s.element || document.querySelector(s.element));
    
    // If no filtered steps, use default
    const finalSteps = filteredSteps.length > 0 ? filteredSteps : DEFAULT_STEPS;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(16, 24, 40, 0.6)",
      steps: finalSteps.map(s => ({
        element: s.element,
        popover: {
          title: s.title,
          description: s.description,
          side: s.side || "bottom",
          align: s.align || "center"
        }
      }))
    });

    driverObj.drive();
    
    // Mark as seen
    const seenGuides = JSON.parse(localStorage.getItem("seen_guides") || "[]");
    const guideKey = pageName || currentPath;
    if (!seenGuides.includes(guideKey)) {
      seenGuides.push(guideKey);
      localStorage.setItem("seen_guides", JSON.stringify(seenGuides));
    }
  };

  useEffect(() => {
    const seenGuides = JSON.parse(localStorage.getItem("seen_guides") || "[]");
    const guideKey = pageName || currentPath;
    
    // Auto-start only for defined guides that haven't been seen yet
    const hasDefinedConfig = !!GUIDE_CONFIG[currentPath] || !!customSteps;
    
    if (hasDefinedConfig && !seenGuides.includes(guideKey)) {
      const timer = setTimeout(startTour, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentPath, pageName]);

  return (
    <Button
      onClick={startTour}
      variant="outline"
      size="sm"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 gap-2 pr-4 transition-all duration-300"
    >
      <div className="bg-emerald-100 p-1.5 rounded-full">
        <Lightbulb className="h-4 w-4" />
      </div>
      <span className="font-medium">Page Tour</span>
    </Button>
  );
};
