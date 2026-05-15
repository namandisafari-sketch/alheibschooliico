import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  UserPlus, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Loader2,
  X
} from "lucide-react";
import { useLearners } from "@/hooks/useLearners";
import { RegisterLearnerDialog } from "@/components/students/RegisterLearnerDialog";
import { LearnerActions } from "@/components/students/LearnerActions";
import { LearnerFolderCard } from "@/components/students/LearnerFolderCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

const Students = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(searchParams.get("class"));
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    const classParam = searchParams.get("class");
    if (classParam) setSelectedClass(classParam);
  }, [searchParams]);
  
  const { data: learners = [], isLoading, error } = useLearners();

  const filteredStudents = learners.filter((student) => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (student.admission_number?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesClass = !selectedClass || student.class_name === selectedClass;
    const matchesGender = !selectedGender || student.gender === selectedGender;
    const matchesStatus = !selectedStatus || student.status === selectedStatus;
    
    return matchesSearch && matchesClass && matchesGender && matchesStatus;
  });

  const classes = Array.from(new Set(learners.map(l => l.class_name).filter(Boolean)));

  const clearFilters = () => {
    setSelectedClass(null);
    setSelectedGender(null);
    setSelectedStatus(null);
    setSearchQuery("");
  };

  return (
    <DashboardLayout title="Learners" subtitle="Manage learner records - Uganda New Curriculum">
      {/* Term Info */}
      <div className="rounded-lg border border-border bg-muted/50 p-2 sm:p-3 mb-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Current Term:</span> Term 3, 2024 | 
          <span className="font-medium text-foreground ml-1 sm:ml-2">Total:</span> {learners.length} learners
          {(selectedClass || selectedGender || selectedStatus) && (
            <span className="ml-2 text-primary">| Filtered: {filteredStudents.length}</span>
          )}
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name, class or ADM..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
                {(selectedClass || selectedGender || selectedStatus) && (
                  <Badge variant="secondary" className="ml-1 px-1 h-4 min-w-4 flex items-center justify-center">
                    !
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter Learners</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">BY CLASS</DropdownMenuLabel>
              {classes.map(c => (
                <DropdownMenuCheckboxItem
                  key={c}
                  checked={selectedClass === c}
                  onCheckedChange={() => setSelectedClass(selectedClass === c ? null : c)}
                >
                  {c}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">BY GENDER</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={selectedGender === "male"}
                onCheckedChange={() => setSelectedGender(selectedGender === "male" ? null : "male")}
              >
                Male
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedGender === "female"}
                onCheckedChange={() => setSelectedGender(selectedGender === "female" ? null : "female")}
              >
                Female
              </DropdownMenuCheckboxItem>
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground">BY STATUS</DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                checked={selectedStatus === "active"}
                onCheckedChange={() => setSelectedStatus(selectedStatus === "active" ? null : "active")}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedStatus === "inactive"}
                onCheckedChange={() => setSelectedStatus(selectedStatus === "inactive" ? null : "inactive")}
              >
                Inactive
              </DropdownMenuCheckboxItem>
              
              {/* Clear Filters */}
              {(selectedClass || selectedGender || selectedStatus) && (
                <>
                  <DropdownMenuSeparator />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={clearFilters}
                  >
                    <X className="mr-2 h-3 w-3" />
                    Clear All Filters
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <RegisterLearnerDialog>
            <Button size="sm" className="flex-1 sm:flex-none">
              <UserPlus className="mr-2 h-4 w-4" />
              <span className="sm:inline">Register</span>
            </Button>
          </RegisterLearnerDialog>
        </div>
      </div>

      {/* Students Grid - Shelf Look */}
      <div className="mt-8 sm:mt-12 animate-slide-up">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-destructive">
            Failed to load learners. Please try again.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-xl">
            <p>No learners found</p>
            <p className="text-sm">Register your first learner to get started</p>
          </div>
        ) : (
          <div className="relative">
            {/* Shelf Lines Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
                 style={{ backgroundImage: 'linear-gradient(to bottom, transparent 0px, transparent 230px, #94a3b8 230px, #94a3b8 232px)', backgroundSize: '100% 270px' }} 
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16 relative z-10">
            {filteredStudents.map((student) => (
              <div key={student.id} className="relative">
                <LearnerFolderCard student={student} />
                {/* Shelf Shadow/Base */}
                <div className="absolute -bottom-4 left-0 right-0 h-2 bg-slate-900/5 rounded-full blur-sm -z-10" />
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>Showing {filteredStudents.length} of {learners.length} learners</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Students;
