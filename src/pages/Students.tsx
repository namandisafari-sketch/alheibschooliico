// @ts-nocheck
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  UserPlus, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  Loader2,
  X,
  FileSpreadsheet,
  ArrowUpCircle,
  Trash2,
} from "lucide-react";
import { useLearners, useDeleteAllLearners, useDeleteLearner } from "@/hooks/useLearners";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { RegisterLearnerDialog } from "@/components/students/RegisterLearnerDialog";
import { ImportLearnersDialog } from "@/components/students/ImportLearnersDialog";
import { PromotionDialog } from "@/components/students/PromotionDialog";
import { Upload } from "lucide-react";
import { LearnerActions } from "@/components/students/LearnerActions";
import { LearnerFolderCard } from "@/components/students/LearnerFolderCard";
import { DataTable } from "@/components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useRealtime } from "@/hooks/useRealtime";
import { LayoutGrid, List, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PasswordConfirmDialog } from "@/components/ui/PasswordConfirmDialog";

const Students = () => {
  const { role } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(searchParams.get("class"));
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>("active");
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null);
  const [selectedPupilStatus, setSelectedPupilStatus] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [viewMode, setViewMode] = useState<"shelf" | "table">("shelf");
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const deleteAllLearners = useDeleteAllLearners();
  const deleteLearner = useDeleteLearner();
  const queryClient = useQueryClient();

  useEffect(() => {
    const classParam = searchParams.get("class");
    if (classParam) setSelectedClass(classParam);
  }, [searchParams]);
  
  const { data: learners = [], isLoading, error } = useLearners();
  const { data: academicSettings } = useAcademicSettings();

  // Real-time updates
  useRealtime("learners", [["learners"]]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    let success = 0;
    for (const id of ids) {
      try {
        await deleteLearner.mutateAsync(id);
        success++;
      } catch (e: any) {
        console.error("Failed to delete learner", id, e);
      }
    }
    toast({
      title: `${success} learner(s) deleted`,
      description: `${ids.length - success} failed.`,
      variant: success === ids.length ? "default" : "destructive",
    });
    queryClient.invalidateQueries({ queryKey: ["learners"] });
    queryClient.invalidateQueries({ queryKey: ["classes"] });
    setSelectedIds(new Set());
    setShowDeleteSelectedDialog(false);
  };

  const columns: ColumnDef<any>[] = [
    ...(role !== "orphan_supervisor" ? [{
      id: "select",
      header: () => (
        <Checkbox
          checked={allSelected}
          onCheckedChange={toggleSelectAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }: any) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => toggleSelect(row.original.id)}
          aria-label="Select row"
        />
      ),
    }] : []),
    {
      accessorKey: "admission_number",
      header: "ADM",
      cell: ({ row }) => <span className="font-mono text-xs font-bold text-slate-500">{row.original.admission_number || "—"}</span>
    },
    {
      accessorKey: "full_name",
      header: "Learner",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-500">
            {((row.original.full_name || "").split(" ").map((n: string) => n[0] || "").join("").slice(0, 2)) || "?"}
          </div>
          <div className="min-w-0">
            <div className="font-black text-slate-900 uppercase tracking-tight text-xs">{row.original.full_name}</div>
            <div className="text-[10px] text-slate-500 font-bold">{row.original.class_name}</div>
          </div>
        </div>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5">
          <div className={cn("h-1.5 w-1.5 rounded-full", row.original.status === "active" ? "bg-emerald-500" : "bg-slate-300")} />
          <span className="text-[10px] font-bold text-slate-600 capitalize">{row.original.status}</span>
        </div>
      )
    },
    {
      accessorKey: "dormitory",
      header: "Dormitory",
      cell: ({ row }) => (
        <span className="text-[10px] font-medium text-indigo-600">{row.original.dormitory || "—"}</span>
      )
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="text-right">
          <LearnerActions learner={row.original} />
        </div>
      )
    }
  ];

  const filteredStudents = learners.filter((student) => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (student.class_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (student.admission_number?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    const matchesClass = !selectedClass || student.class_name === selectedClass;
    const matchesGender = !selectedGender || student.gender === selectedGender;
    const matchesStatus = !selectedStatus || student.status === selectedStatus;
    const matchesHouse = !selectedHouse || (student.house || "").toUpperCase() === selectedHouse;
    const matchesPupilStatus = !selectedPupilStatus || student.pupil_status === selectedPupilStatus;
    
    return matchesSearch && matchesClass && matchesGender && matchesStatus && matchesHouse && matchesPupilStatus;
  });

  const classes = Array.from(new Set(learners.map(l => l.class_name).filter(Boolean)));

  const allSelected = filteredStudents.length > 0 && selectedIds.size === filteredStudents.length;

  const clearFilters = () => {
    setSelectedClass(null);
    setSelectedGender(null);
    setSelectedStatus("active");
    setSelectedHouse(null);
    setSelectedPupilStatus(null);
    setSearchQuery("");
    setFilterSearch("");
  };

  return (
    <DashboardLayout title="Learners" subtitle="Manage learner records - Uganda New Curriculum">
      {/* Term Info */}
      <div className="rounded-lg border border-border bg-muted/50 p-2 sm:p-3 mb-4">
        <p className="text-xs sm:text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Academic Year:</span> {academicSettings?.current_year ?? new Date().getFullYear()} |
          <span className="font-medium text-foreground ml-1 sm:ml-2">Total:</span> {learners.length} learners
          {(selectedClass || selectedGender || selectedStatus || selectedHouse || selectedPupilStatus) && (
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
          {(selectedClass || selectedGender || selectedStatus || selectedHouse || selectedPupilStatus) && (
                  <Badge variant="secondary" className="ml-1 px-1 h-4 min-w-4 flex items-center justify-center">
                    !
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 overflow-y-auto max-h-[80vh]">
              <DropdownMenuLabel>Filter Learners</DropdownMenuLabel>
              <div className="flex items-center border-b px-2 pb-1">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  placeholder="Search filters..."
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  className="flex h-8 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") setFilterSearch("");
                  }}
                />
                {filterSearch && (
                  <button onClick={() => setFilterSearch("")} className="ml-1 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              
              <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground uppercase">By Class</DropdownMenuLabel>
              {classes.filter(c => !filterSearch || c.toLowerCase().includes(filterSearch.toLowerCase())).map(c => (
                <DropdownMenuCheckboxItem
                  key={c}
                  checked={selectedClass === c}
                  onCheckedChange={() => setSelectedClass(selectedClass === c ? null : c)}
                >
                  {c}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground uppercase">By Pupil Status</DropdownMenuLabel>
              {(!filterSearch || "Teacher's Child".toLowerCase().includes(filterSearch.toLowerCase())) && (
              <DropdownMenuCheckboxItem
                checked={selectedPupilStatus === "Teacher's Child"}
                onCheckedChange={() => setSelectedPupilStatus(selectedPupilStatus === "Teacher's Child" ? null : "Teacher's Child")}
              >
                Teacher's Child
              </DropdownMenuCheckboxItem>
              )}
              {(!filterSearch || "Orphan Scholarships".toLowerCase().includes(filterSearch.toLowerCase()) || "Orphan".toLowerCase().includes(filterSearch.toLowerCase())) && (
              <DropdownMenuCheckboxItem
                checked={selectedPupilStatus === "Orphan"}
                onCheckedChange={() => setSelectedPupilStatus(selectedPupilStatus === "Orphan" ? null : "Orphan")}
              >
                Orphan Scholarships
              </DropdownMenuCheckboxItem>
              )}
              {(!filterSearch || "Buytuzaka (Bait Zakat)".toLowerCase().includes(filterSearch.toLowerCase()) || "Bait Zakat".toLowerCase().includes(filterSearch.toLowerCase())) && (
              <DropdownMenuCheckboxItem
                checked={selectedPupilStatus === "Bait Zakat"}
                onCheckedChange={() => setSelectedPupilStatus(selectedPupilStatus === "Bait Zakat" ? null : "Bait Zakat")}
              >
                Buytuzaka (Bait Zakat)
              </DropdownMenuCheckboxItem>
              )}
              {(!filterSearch || "IICO".toLowerCase().includes(filterSearch.toLowerCase())) && (
              <DropdownMenuCheckboxItem
                checked={selectedPupilStatus === "IICO"}
                onCheckedChange={() => setSelectedPupilStatus(selectedPupilStatus === "IICO" ? null : "IICO")}
              >
                IICO
              </DropdownMenuCheckboxItem>
              )}
              {(!filterSearch || "Community".toLowerCase().includes(filterSearch.toLowerCase())) && (
              <DropdownMenuCheckboxItem
                checked={selectedPupilStatus === "Community"}
                onCheckedChange={() => setSelectedPupilStatus(selectedPupilStatus === "Community" ? null : "Community")}
              >
                Community
              </DropdownMenuCheckboxItem>
              )}
              {(!filterSearch || "Paying Pupils".toLowerCase().includes(filterSearch.toLowerCase()) || "Paying".toLowerCase().includes(filterSearch.toLowerCase())) && (
              <DropdownMenuCheckboxItem
                checked={selectedPupilStatus === "Paying"}
                onCheckedChange={() => setSelectedPupilStatus(selectedPupilStatus === "Paying" ? null : "Paying")}
              >
                Paying Pupils
              </DropdownMenuCheckboxItem>
              )}
              {(!filterSearch || "Other".toLowerCase().includes(filterSearch.toLowerCase())) && (
              <DropdownMenuCheckboxItem
                checked={selectedPupilStatus === "Other"}
                onCheckedChange={() => setSelectedPupilStatus(selectedPupilStatus === "Other" ? null : "Other")}
              >
                Other
              </DropdownMenuCheckboxItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground uppercase">By Gender</DropdownMenuLabel>
              {(!filterSearch || "Male".toLowerCase().includes(filterSearch.toLowerCase())) && (
              <DropdownMenuCheckboxItem
                checked={selectedGender === "male"}
                onCheckedChange={() => setSelectedGender(selectedGender === "male" ? null : "male")}
              >
                Male
              </DropdownMenuCheckboxItem>
              )}
              {(!filterSearch || "Female".toLowerCase().includes(filterSearch.toLowerCase())) && (
              <DropdownMenuCheckboxItem
                checked={selectedGender === "female"}
                onCheckedChange={() => setSelectedGender(selectedGender === "female" ? null : "female")}
              >
                Female
              </DropdownMenuCheckboxItem>
              )}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-normal text-muted-foreground uppercase">By Status</DropdownMenuLabel>
              {(!filterSearch || "Active".toLowerCase().includes(filterSearch.toLowerCase())) && (
              <DropdownMenuCheckboxItem
                checked={selectedStatus === "active"}
                onCheckedChange={() => setSelectedStatus(selectedStatus === "active" ? null : "active")}
              >
                Active
              </DropdownMenuCheckboxItem>
              )}
              {(!filterSearch || "Inactive".toLowerCase().includes(filterSearch.toLowerCase())) && (
              <DropdownMenuCheckboxItem
                checked={selectedStatus === "inactive"}
                onCheckedChange={() => setSelectedStatus(selectedStatus === "inactive" ? null : "inactive")}
              >
                Inactive
              </DropdownMenuCheckboxItem>
              )}
              
              {/* Clear Filters */}
                {(selectedClass || selectedGender || selectedStatus || selectedHouse || selectedPupilStatus) && (
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
                <Button id="register-pupil-btn" size="sm" className="flex-1 sm:flex-none">
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span className="sm:inline">Register</span>
                </Button>
              </RegisterLearnerDialog>
              {role !== "orphan_supervisor" && (
                <ImportLearnersDialog>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="sm:inline">Import</span>
                  </Button>
                </ImportLearnersDialog>
              )}

              {role !== "orphan_supervisor" && (
                <PromotionDialog>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    <span className="sm:inline">Promote</span>
                  </Button>
                </PromotionDialog>
              )}

              {role !== "orphan_supervisor" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 sm:flex-none text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/40"
                  onClick={() => setShowDeleteAllDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span className="sm:inline">Delete All</span>
                </Button>
              )}

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <Button 
                  variant={viewMode === "shelf" ? "secondary" : "ghost"} 
                  size="sm" 
                  className={cn("h-7 px-2", viewMode === "shelf" && "bg-white shadow-sm")}
                  onClick={() => setViewMode("shelf")}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
                <Button 
                  variant={viewMode === "table" ? "secondary" : "ghost"} 
                  size="sm" 
                  className={cn("h-7 px-2", viewMode === "table" && "bg-white shadow-sm")}
                  onClick={() => setViewMode("table")}
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectedIds.size > 0 && role !== "orphan_supervisor" && (
        <div className="mt-3 flex items-center justify-between bg-primary/5 border border-primary/20 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-primary">
            {selectedIds.size} learner(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteSelectedDialog(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Students Registry Container */}
      <div id="student-registry-container" className="mt-8 sm:mt-12 animate-slide-up">
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
        ) : viewMode === "shelf" ? (
          <div className="relative">
            {/* Select All */}
            {role !== "orphan_supervisor" && (
            <div className="mb-4 flex items-center gap-2">
              <Checkbox
                id="select-all-shelf"
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
              />
              <label htmlFor="select-all-shelf" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                {allSelected ? "Deselect all" : "Select all"} ({filteredStudents.length} learners)
              </label>
            </div>
            )}
            {/* Shelf Lines Background */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
                 style={{ backgroundImage: 'linear-gradient(to bottom, transparent 0px, transparent 230px, #94a3b8 230px, #94a3b8 232px)', backgroundSize: '100% 270px' }} 
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-16 relative z-10">
            {filteredStudents.map((student) => (
              <div key={student.id} className="relative">
                {role !== "orphan_supervisor" && (
                <div className="absolute -top-2 -left-2 z-20">
                  <Checkbox
                    checked={selectedIds.has(student.id)}
                    onCheckedChange={() => toggleSelect(student.id)}
                    aria-label={`Select ${student.full_name}`}
                  />
                </div>
                )}
                <LearnerFolderCard student={student} />
                {/* Shelf Shadow/Base */}
                <div className="absolute -bottom-4 left-0 right-0 h-2 bg-slate-900/5 rounded-full blur-sm -z-10" />
              </div>
            ))}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border-none shadow-xl bg-slate-50/50 p-6">
            <DataTable columns={columns} data={filteredStudents} />
          </div>
        )}
      </div>

      {role !== "orphan_supervisor" && (
        <>
      {/* Delete All Confirmation */}
      <PasswordConfirmDialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
        title="Delete All Learners?"
        description={
          <>
            This will permanently delete <strong>all {learners.length} learner records</strong> and their
            associated data. This action cannot be undone. We recommend exporting your data first.
          </>
        }
        actionLabel="Delete All"
        loading={deleteAllLearners.isPending}
        onSuccess={async () => {
          await deleteAllLearners.mutateAsync();
          toast({ title: "All learners deleted", description: "All learner records have been permanently removed." });
        }}
      />

      {/* Delete Selected Confirmation */}
      <PasswordConfirmDialog
        open={showDeleteSelectedDialog}
        onOpenChange={setShowDeleteSelectedDialog}
        title={"Delete " + selectedIds.size + " Selected Learner(s)?"}
        description={
          <>
            This will permanently delete <strong>{selectedIds.size} learner record(s)</strong>.
            This action cannot be undone.
          </>
        }
        actionLabel="Delete"
        loading={deleteLearner.isPending}
        onSuccess={handleDeleteSelected}
      />
        </>
      )}

      {/* Summary */}
      <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>Showing {filteredStudents.length} of {learners.length} learners</span>
      </div>
    </DashboardLayout>
  );
};

export default Students;
