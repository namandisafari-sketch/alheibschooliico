import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, Search, Users, ChevronDown, ChevronUp, GraduationCap, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Dormitories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filterClass, setFilterClass] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: learners = [], isLoading } = useQuery({
    queryKey: ["matron-learners-with-dormitory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("learners")
        .select("id, full_name, admission_number, dormitory, class_id, gender, status")
        .order("dormitory");
      return data || [];
    },
  });

  const { data: classList = [] } = useQuery({
    queryKey: ["matron-classes"],
    queryFn: async () => {
      const { data } = await supabase.from("classes").select("id, name").order("name");
      return data || [];
    },
  });

  const classMap = useMemo(() => {
    const m = new Map<string, string>();
    classList.forEach((c: any) => m.set(c.id, c.name));
    return m;
  }, [classList]);

  const filteredLearners = useMemo(() => {
    return learners.filter((l: any) => {
      if (!l.dormitory) return false;
      if (filterClass !== "all" && l.class_id !== filterClass) return false;
      if (filterGender !== "all" && l.gender !== filterGender) return false;
      if (filterStatus !== "all" && l.status !== filterStatus) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        if (!l.full_name?.toLowerCase().includes(q) && !l.admission_number?.toLowerCase().includes(q) && !l.dormitory?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [learners, filterClass, filterGender, filterStatus, searchTerm]);

  const dormList = useMemo(() => {
    const byDorm: Record<string, any[]> = {};
    filteredLearners.forEach((l: any) => {
      if (!byDorm[l.dormitory]) byDorm[l.dormitory] = [];
      byDorm[l.dormitory].push(l);
    });
    return Object.entries(byDorm)
      .map(([name, residents]) => ({
        id: name,
        name,
        gender: "N/A",
        capacity: residents.length,
        location: null,
        residents: residents.map((r: any) => ({
          id: r.id,
          learner_id: r.id,
          bed_number: null,
          learner: {
            full_name: r.full_name,
            admission_number: r.admission_number || "",
            class_name: classMap.get(r.class_id) || "",
            gender: r.gender,
            status: r.status,
          },
        })),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredLearners, classMap]);

  const hasFilters = filterClass !== "all" || filterGender !== "all" || filterStatus !== "all";

  const clearFilters = () => {
    setFilterClass("all");
    setFilterGender("all");
    setFilterStatus("all");
    setSearchTerm("");
  };

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <DashboardLayout title="Dormitories" subtitle="Boarding dormitories and their residents">
      <div className="space-y-6">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dormitory or learner..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[150px] h-9">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classList.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="transferred">Transferred</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 px-2">
                <X className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-muted-foreground">Loading...</div>
        ) : dormList.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center border-2 border-dashed rounded-lg">
              <Building className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No dormitories found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {dormList.map((dorm) => {
              const total = dorm.residents.length;
              const isExpanded = expanded[dorm.id];
              return (
                <Card key={dorm.id} className="hover:shadow-md transition-all">
                  <CardHeader
                    className="pb-3 cursor-pointer select-none"
                    onClick={() => toggle(dorm.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building className="h-4 w-4 text-indigo-500 shrink-0" />
                          {dorm.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3 w-3" /> {total}
                          </span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      {total === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No residents assigned</p>
                      ) : (
                        <div className="space-y-1">
                          {dorm.residents.map((r) => (
                            <div
                              key={r.id}
                              className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-2 text-sm"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{r.learner?.full_name || "Unknown"}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {r.learner?.admission_number}
                                  {r.learner?.class_name && <>&nbsp;&middot; {r.learner.class_name}</>}
                                  {r.learner?.gender && <>&nbsp;&middot; {r.learner.gender}</>}
                                  {r.learner?.status && r.learner.status !== "active" && (
                                    <>&nbsp;&middot; <span className="text-amber-600">{r.learner.status}</span></>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <GraduationCap className="h-3 w-3 text-muted-foreground" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dormitories;
