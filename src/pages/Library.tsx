// @ts-nocheck
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { usePrayerTimes } from "@/hooks/usePrayerTimes";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BookOpen,
  Plus,
  Search,
  BookMarked,
  Undo2,
  Trash2,
  Pencil,
  Users,
  AlertTriangle,
  DollarSign,
  XCircle,
  CheckCircle2,
  Ban,
  Clock,
  AlertCircle,
  RefreshCw,
  Moon,
  Zap,
} from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { format } from "date-fns";
import { BookDialog } from "@/components/library/BookDialog";
import { IssueDialog } from "@/components/library/IssueDialog";
import { MemberDialog } from "@/components/library/MemberDialog";
import { FineDialog } from "@/components/library/FineDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MANAGER_ROLES = [
  "admin", "head_teacher", "deputy_head_teacher", "secretary",
  "office_manager", "director", "teacher", "nurse",
  "accountant", "storekeeper",
];

const useLibraryData = () => {
  const books = useQuery({
    queryKey: ["library-books"],
    queryFn: async () => {
      const { data, error } = await supabase.from("library_books").select("*").order("title");
      if (error) throw error;
      return data || [];
    },
    retry: 1,
  });

  const loans = useQuery({
    queryKey: ["library-loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_loans")
        .select("*, library_books(title, author)")
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const members = useQuery({
    queryKey: ["library-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_members")
        .select("*, profiles:profile_id(full_name, email, role)")
        .order("id_card_number");
      if (error) throw error;
      return data || [];
    },
    retry: 1,
  });

  const fines = useQuery({
    queryKey: ["library-fines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_fines")
        .select("*, library_members!inner(id_card_number, member_type, profiles:profile_id(full_name))")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
    retry: 1,
  });

  return { books, loans, members, fines };
};

const StatCard = ({ label, value, icon: Icon, variant = "default" }) => (
  <Card className="p-3">
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">{label}</div>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <div className={`text-xl font-bold mt-1 ${variant === "destructive" ? "text-destructive" : ""}`}>
      {value}
    </div>
  </Card>
);

export default function Library() {
  const { user, role } = useAuth();
  const { books, loans, members, fines } = useLibraryData();
  const { isPrayerTime, prayerStatus, prayerTimes, isLoading: prayerLoading } = usePrayerTimes();
  const canManage = MANAGER_ROLES.includes(role || "");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [tab, setTab] = useState("catalog");

  const [bookDialog, setBookDialog] = useState({ open: false, book: null });
  const [issueDialog, setIssueDialog] = useState({ open: false, book: null });
  const [memberDialog, setMemberDialog] = useState({ open: false, member: null });
  const [fineDialog, setFineDialog] = useState({ open: false, loanId: null, memberId: null });

  const categories = useMemo(() => {
    const cats = new Set((books.data || []).map((b) => b.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [books.data]);

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (books.data || []).filter((b) => {
      if (q && !b.title?.toLowerCase().includes(q) &&
          !b.author?.toLowerCase().includes(q) &&
          !b.isbn?.toLowerCase().includes(q) &&
          !b.category?.toLowerCase().includes(q)) return false;
      if (categoryFilter && b.category !== categoryFilter) return false;
      return true;
    });
  }, [books.data, search, categoryFilter]);

  const stats = useMemo(() => {
    const data = books.data || [];
    return {
      totalTitles: data.length,
      totalCopies: data.reduce((s, b) => s + (b.total_copies || 0), 0),
      available: data.reduce((s, b) => s + (b.available_copies || 0), 0),
      onLoan: data.reduce((s, b) => s + (b.total_copies || 0), 0) - data.reduce((s, b) => s + (b.available_copies || 0), 0),
      overdueCount: (loans.data || []).filter((l) => l.status === "active" && new Date(l.due_at) < new Date()).length,
      activeMembers: (members.data || []).filter((m) => m.status === "active").length,
      pendingFines: (fines.data || []).filter((f) => f.status === "pending").reduce((s, f) => s + Number(f.amount) - Number(f.paid_amount), 0),
    };
  }, [books.data, loans.data, members.data, fines.data]);

  const myLoans = (loans.data || []).filter((l) => l.borrower_id === user?.id);
  const activeLoans = (loans.data || []).filter((l) => l.status === "active");
  const totalRevenue = useMemo(
    () => (fines.data || []).filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.paid_amount), 0),
    [fines.data],
  );

  const hasError = books.error || loans.error || members.error;
  const isLoading = books.isLoading || loans.isLoading || members.isLoading;

  return (
    <DashboardLayout title="Library" subtitle="Catalog, borrow, return, and manage library resources">
      {/* Prayer Times Status Bar - Global blocker is now in PrayerTimesProvider */}
      {!prayerLoading && prayerTimes && (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
                <Moon className="h-4 w-4 text-emerald-600" />
                Daily Prayer Times
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((prayer) => (
                  <div
                    key={prayer}
                    className={`text-center px-3 py-2 rounded-lg ${
                      prayerStatus.currentPrayer === prayer
                        ? 'bg-white border-2 border-emerald-600 shadow-md'
                        : 'bg-white/50 border border-emerald-200'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase text-slate-500">{prayer}</p>
                    <p className={`text-sm font-black font-mono mt-1 ${
                      prayerStatus.currentPrayer === prayer ? 'text-emerald-700' : 'text-slate-700'
                    }`}>
                      {prayerTimes[prayer]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Prayer Status */}
            {prayerStatus.currentPrayer ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 border border-red-300">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div className="text-sm">
                  <p className="font-bold text-red-900">Prayer Time Active</p>
                  <p className="text-xs text-red-700">{prayerStatus.currentPrayer.toUpperCase()}</p>
                </div>
              </div>
            ) : prayerStatus.nextPrayer ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-100 border border-blue-300">
                <Clock className="h-5 w-5 text-blue-600" />
                <div className="text-sm">
                  <p className="font-bold text-blue-900">Next Prayer</p>
                  <p className="text-xs text-blue-700">{prayerStatus.nextPrayer.toUpperCase()} in {prayerStatus.timeUntilNext} min</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className={`space-y-6 ${isPrayerTime ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black">Library</h1>
              <p className="text-sm text-muted-foreground">
                Catalog, borrow, return, and manage library resources.
              </p>
            </div>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setMemberDialog({ open: true })}>
                <Users className="h-4 w-4 mr-2" /> Add Member
              </Button>
              <Button variant="outline" onClick={() => setFineDialog({ open: true })}>
                <DollarSign className="h-4 w-4 mr-2" /> Add Fine
              </Button>
              <Button onClick={() => setBookDialog({ open: true })}>
                <Plus className="h-4 w-4 mr-2" /> Add Book
              </Button>
            </div>
          )}
        </div>

        {/* Error alert */}
        {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some library data failed to load. The module may need to be set up.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-3">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-10" />
              </Card>
            ))
          ) : (
            <>
              <StatCard label="Titles" value={stats.totalTitles} icon={BookOpen} />
              <StatCard label="Total Copies" value={stats.totalCopies} icon={BookMarked} />
              <StatCard label="Available" value={stats.available} icon={CheckCircle2} />
              <StatCard label="On Loan" value={stats.onLoan} icon={BookMarked} />
              <StatCard
                label="Overdue"
                value={stats.overdueCount}
                icon={AlertTriangle}
                variant={stats.overdueCount > 0 ? "destructive" : "default"}
              />
              <StatCard label="Members" value={stats.activeMembers} icon={Users} />
            </>
          )}
        </div>

        {!hasError && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="catalog">Catalog</TabsTrigger>
              {canManage && <TabsTrigger value="members">Members ({members.data?.length || 0})</TabsTrigger>}
              {canManage && <TabsTrigger value="loans">Circulation</TabsTrigger>}
              {canManage && <TabsTrigger value="fines">Fines (UGX {stats.pendingFines.toLocaleString()})</TabsTrigger>}
              <TabsTrigger value="my">My Loans ({myLoans.length})</TabsTrigger>
            </TabsList>

            {/* Catalog Tab */}
            <TabsContent value="catalog" className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search title, author, ISBN, category..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                {categories.length > 0 && (
                  <SearchableSelect
                    options={[
                      { value: "", label: "All Categories" },
                      ...categories.map((c) => ({ value: c, label: c })),
                    ]}
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                    placeholder="All Categories"
                    searchPlaceholder="Search categories…"
                    className="w-48"
                  />
                )}
                <div className="text-xs text-muted-foreground">
                  {filteredBooks.length} of {books.data?.length || 0} books
                </div>
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Shelf</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {books.isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i}>
                            {Array.from({ length: 7 }).map((_, j) => (
                              <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : filteredBooks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <div className="flex flex-col items-center">
                              <BookOpen className="h-8 w-8 text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                {search || categoryFilter ? "No books match your filters" : "No books in the library yet"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {search || categoryFilter ? "Try different search terms" : "Click 'Add Book' to add the first one"}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredBooks.map((b) => (
                          <TableRow key={b.id}>
                            <TableCell className="font-medium max-w-[200px] truncate" title={b.title}>
                              {b.title}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate">{b.author || "—"}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{b.category || "—"}</Badge>
                            </TableCell>
                            <TableCell>{b.class_level || "—"}</TableCell>
                            <TableCell>{b.shelf_location || "—"}</TableCell>
                            <TableCell>
                              <Badge variant={b.available_copies > 0 ? "default" : "secondary"}>
                                {b.available_copies}/{b.total_copies}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {canManage ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    disabled={b.available_copies <= 0}
                                    onClick={() => setIssueDialog({ open: true, book: b })}
                                  >
                                    <BookMarked className="h-3 w-3 mr-1" /> Issue
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setBookDialog({ open: true, book: b })}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => deleteBook?.mutate(b.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : b.available_copies > 0 ? (
                                <Badge variant="default">Available</Badge>
                              ) : (
                                <Badge variant="secondary">Checked Out</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            {canManage && (
              <TabsContent value="members" className="space-y-4">
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Card #</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Active Loans</TableHead>
                          <TableHead>Total Fines</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.isLoading ? (
                          <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                        ) : (members.data || []).length === 0 ? (
                          <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No members registered.</TableCell></TableRow>
                        ) : (
                          (members.data || []).map((m) => (
                            <TableRow key={m.id}>
                              <TableCell className="font-mono text-xs">{m.id_card_number}</TableCell>
                              <TableCell>{m.profiles?.full_name || "—"}</TableCell>
                              <TableCell><Badge variant="outline">{m.member_type}</Badge></TableCell>
                              <TableCell>
                                <Badge variant={m.active_loans >= m.max_loans ? "destructive" : "default"}>
                                  {m.active_loans}/{m.max_loans}
                                </Badge>
                              </TableCell>
                              <TableCell>UGX {m.total_fines?.toLocaleString() || 0}</TableCell>
                              <TableCell><Badge variant={m.status === "active" ? "default" : "secondary"}>{m.status}</Badge></TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" onClick={() => setMemberDialog({ open: true, member: m })}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </TabsContent>
            )}

            {/* Loans Tab */}
            {canManage && (
              <TabsContent value="loans" className="space-y-4">
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Book</TableHead>
                          <TableHead>Borrower</TableHead>
                          <TableHead>Issued</TableHead>
                          <TableHead>Due</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(loans.data || []).length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-12 text-muted-foreground">No loans yet.</TableCell></TableRow>
                        ) : (
                          (loans.data || []).map((l) => {
                            const overdue = l.status === "active" && new Date(l.due_at) < new Date();
                            const daysOverdue = overdue ? Math.floor((Date.now() - new Date(l.due_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                            return (
                              <TableRow key={l.id}>
                                <TableCell className="font-medium max-w-[180px] truncate">{l.library_books?.title || "—"}</TableCell>
                                <TableCell>{l.borrower_name || l.borrower_id?.slice(0, 8)}</TableCell>
                                <TableCell className="text-xs">{format(new Date(l.issued_at), "MMM d, yyyy")}</TableCell>
                                <TableCell className="text-xs">
                                  <span className={overdue ? "text-destructive font-semibold" : ""}>
                                    {format(new Date(l.due_at), "MMM d, yyyy")}
                                    {overdue && <span className="ml-1">({daysOverdue}d overdue)</span>}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge variant={l.status === "returned" ? "secondary" : l.status === "lost" ? "destructive" : overdue ? "destructive" : "default"}>
                                    {l.status === "active" && overdue ? "overdue" : l.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                  {l.status === "active" && (
                                    <>
                                      <Button size="sm" variant="outline" onClick={() => returnLoan?.mutate(l.id)}>
                                        <Undo2 className="h-3 w-3 mr-1" /> Return
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => markLost?.mutate(l.id)} title="Mark as lost">
                                        <XCircle className="h-3 w-3 text-destructive" />
                                      </Button>
                                      <Button size="sm" variant="ghost" onClick={() => setFineDialog({ open: true, loanId: l.id, memberId: l.borrower_id })} title="Issue fine">
                                        <DollarSign className="h-3 w-3" />
                                      </Button>
                                    </>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </TabsContent>
            )}

            {/* Fines Tab */}
            {canManage && (
              <TabsContent value="fines" className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-sm">Total Collected: UGX {totalRevenue.toLocaleString()}</Badge>
                  <Badge variant="outline" className="text-sm">Pending: UGX {stats.pendingFines.toLocaleString()}</Badge>
                </div>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Member</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Paid</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(fines.data || []).length === 0 ? (
                          <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No fines recorded.</TableCell></TableRow>
                        ) : (
                          (fines.data || []).map((f) => (
                            <TableRow key={f.id}>
                              <TableCell>{f.library_members?.profiles?.full_name || f.member_id?.slice(0, 8)}</TableCell>
                              <TableCell>UGX {Number(f.amount).toLocaleString()}</TableCell>
                              <TableCell>UGX {Number(f.paid_amount).toLocaleString()}</TableCell>
                              <TableCell className="max-w-[150px] truncate">{f.reason}</TableCell>
                              <TableCell>
                                <Badge variant={f.status === "paid" ? "default" : f.status === "waived" ? "secondary" : "destructive"}>
                                  {f.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">{format(new Date(f.created_at), "MMM d, yyyy")}</TableCell>
                              <TableCell className="text-right whitespace-nowrap">
                                {f.status === "pending" && (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => payFine?.mutate({ id: f.id, amount: f.amount })}>
                                      <DollarSign className="h-3 w-3 mr-1" /> Pay
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => waiveFine?.mutate({ id: f.id, waived_by: user?.id || "" })}>
                                      <Ban className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              </TabsContent>
            )}

            {/* My Loans Tab */}
            <TabsContent value="my" className="space-y-4">
              {myLoans.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm font-medium text-muted-foreground">You have no active loans.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-3">
                  {myLoans.map((l) => {
                    const overdue = l.status === "active" && new Date(l.due_at) < new Date();
                    const daysOverdue = overdue ? Math.floor((Date.now() - new Date(l.due_at).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                    return (
                      <Card key={l.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <div className="font-medium">{l.library_books?.title || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Issued {format(new Date(l.issued_at), "MMM d, yyyy")} · Due{" "}
                              <span className={overdue ? "text-destructive font-semibold" : ""}>
                                {format(new Date(l.due_at), "MMM d, yyyy")}
                                {overdue && ` (${daysOverdue}d overdue)`}
                              </span>
                            </div>
                          </div>
                          <Badge variant={l.status === "returned" ? "secondary" : overdue ? "destructive" : "default"}>
                            {overdue ? "overdue" : l.status}
                          </Badge>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <BookDialog
        open={bookDialog.open}
        book={bookDialog.book}
        onOpenChange={(o) => setBookDialog({ open: o, book: o ? bookDialog.book : null })}
        userId={user?.id}
      />
      <IssueDialog
        open={issueDialog.open}
        book={issueDialog.book}
        onOpenChange={(o) => setIssueDialog({ open: o, book: o ? issueDialog.book : null })}
        issuerId={user?.id}
      />
      <MemberDialog
        open={memberDialog.open}
        member={memberDialog.member}
        onOpenChange={(o) => setMemberDialog({ open: o, member: o ? memberDialog.member : null })}
      />
      <FineDialog
        open={fineDialog.open}
        loanId={fineDialog.loanId}
        memberId={fineDialog.memberId}
        onOpenChange={(o) => setFineDialog({ open: o })}
        userId={user?.id}
      />
    </DashboardLayout>
  );
}
