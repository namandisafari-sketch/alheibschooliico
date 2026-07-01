// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCurriculumPlans } from "@/hooks/useAcademicPlanning";
import { useAcademicSettings } from "@/hooks/useAcademicSettings";
import { useCurriculumTopics, useCreateCurriculumTopic, useUpdateCurriculumTopic, useDeleteCurriculumTopic } from "@/hooks/useSyllabusTracking";
import { useClasses } from "@/hooks/useClasses";
import { useSubjects } from "@/hooks/useSubjects";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookMarked, Plus, Trash2, Save, Layers, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function CurriculumSetup() {
  const qc = useQueryClient();
  const { data: academicSettings } = useAcademicSettings();
  const currentTerm = academicSettings?.current_term_id ?? "term_1";
  const currentYear = academicSettings?.current_year ?? new Date().getFullYear();
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [activePlanId, setActivePlanId] = useState("");
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newSubTopics, setNewSubTopics] = useState("");
  const [newExpectedLessons, setNewExpectedLessons] = useState("1");
  const [editTopicId, setEditTopicId] = useState("");
  const [editTopicTitle, setEditTopicTitle] = useState("");
  const [editSubTopics, setEditSubTopics] = useState("");

  const { data: classes = [] } = useClasses();
  const { data: subjects = [] } = useSubjects();
  const { data: plans = [] } = useCurriculumPlans(selectedClass, selectedSubject, currentTerm, currentYear);
  const { data: topics = [], refetch: refetchTopics } = useCurriculumTopics(activePlanId);
  const createTopic = useCreateCurriculumTopic();
  const updateTopic = useUpdateCurriculumTopic();
  const deleteTopic = useDeleteCurriculumTopic();

  const handleAddTopic = async () => {
    if (!activePlanId || !newTopicTitle.trim()) return;
    await createTopic.mutateAsync({
      curriculum_plan_id: activePlanId,
      title: newTopicTitle.trim(),
      sub_topics: newSubTopics.split(",").map(s => s.trim()).filter(Boolean),
      expected_lessons: parseInt(newExpectedLessons) || 1,
      sequence_order: (topics?.length || 0) + 1,
    });
    setNewTopicTitle("");
    setNewSubTopics("");
    setNewExpectedLessons("1");
    refetchTopics();
    toast.success("Topic added");
  };

  const handleUpdateTopic = async (id: string) => {
    await updateTopic.mutateAsync({
      id,
      title: editTopicTitle,
      sub_topics: editSubTopics.split(",").map(s => s.trim()).filter(Boolean),
    });
    setEditTopicId("");
    refetchTopics();
    toast.success("Topic updated");
  };

  const handleDeleteTopic = async (id: string) => {
    await deleteTopic.mutateAsync(id);
    refetchTopics();
    toast.success("Topic removed");
  };

  return (
    <DashboardLayout title="Curriculum Setup" subtitle={`Manage topics, sub-topics, and expected lessons for ${currentTerm.replace("term_", "Term ")} ${currentYear}`}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookMarked className="h-5 w-5" /> Select Curriculum
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Curriculum Topic</Label>
              <Select value={activePlanId} onValueChange={(v) => { setActivePlanId(v); setNewTopicTitle(""); setNewSubTopics(""); }}>
                <SelectTrigger><SelectValue placeholder="Select topic plan" /></SelectTrigger>
                <SelectContent>
                  {plans.map(p => <SelectItem key={p.id} value={p.id}>{p.topic_title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {activePlanId && (
              <div className="p-3 bg-slate-50 rounded-xl border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider">Add Sub-Topics</h4>
                <div className="space-y-2">
                  <Label className="text-[10px]">Topic Title</Label>
                  <Input value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} placeholder="e.g. Addition of Fractions" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px]">Sub-Topics (comma-separated)</Label>
                  <Textarea value={newSubTopics} onChange={e => setNewSubTopics(e.target.value)} placeholder="Like fractions, Unlike fractions, Mixed numbers" className="text-xs min-h-[60px]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px]">Expected Lessons</Label>
                  <Input type="number" min="1" value={newExpectedLessons} onChange={e => setNewExpectedLessons(e.target.value)} />
                </div>
                <Button size="sm" className="w-full gap-2" onClick={handleAddTopic} disabled={!newTopicTitle.trim() || createTopic.isPending}>
                  <Plus className="h-4 w-4" /> Add Topic
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {!activePlanId ? (
            <Card>
              <CardContent className="py-20 text-center text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Select a class, subject, and curriculum topic above to manage sub-topics.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">
                  Topics for {plans.find(p => p.id === activePlanId)?.topic_title}
                </h3>
                <Badge variant="outline">{topics?.length || 0} topics</Badge>
              </div>
              {topics?.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No sub-topics added yet. Use the form on the left to add topics with sub-topics.</p>
                  </CardContent>
                </Card>
              ) : (
                topics?.map(topic => (
                  <Card key={topic.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{topic.title}</CardTitle>
                          <p className="text-xs text-muted-foreground">{topic.expected_lessons} expected lesson(s) | Order: {topic.sequence_order}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditTopicId(topic.id); setEditTopicTitle(topic.title); setEditSubTopics((topic.sub_topics || []).join(", ")); }}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => handleDeleteTopic(topic.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editTopicId === topic.id ? (
                        <div className="space-y-2">
                          <Input value={editTopicTitle} onChange={e => setEditTopicTitle(e.target.value)} className="text-sm" />
                          <Textarea value={editSubTopics} onChange={e => setEditSubTopics(e.target.value)} className="text-xs min-h-[60px]" placeholder="Comma-separated sub-topics" />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateTopic(topic.id)}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditTopicId("")}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {(topic.sub_topics || []).map((st: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-[10px]">{st}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
