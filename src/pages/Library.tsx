// @ts-nocheck
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Plus,
  Search,
  BookMarked,
  Undo2,
  Trash2,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

const MANAGER_ROLES = [
  "admin",
  "head_teacher",
  "deputy_head_teacher",
  "secretary",
  "office_manager",
  "director",
];

const Library = () => {
  const { user, role } = useAuth();
  const qc = useQueryClient();
  const canManage = MANAGER_ROLES.includes(role || "");

  const [search, setSearch] = useState("");
  const [bookDialog, setBookDialog] = useState<{ open: boolean; book?: any }>({
    open: false,
  });
  const [issueDialog, setIssueDialog] = useState<{ open: boolean; book?: any }>({
    open: false,
  });

  const { data: books = [], isLoading: booksLoading } = useQuery({
    queryKey: ["library-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_books")
        .select("*")
        .order("title");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: loans = [] } = useQuery({
    queryKey: ["library-loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_loans")
        .select("*, library_books(title, author)")
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: borrowers = [] } = useQuery({
    queryKey: ["library-borrower-candidates"],
    enabled: canManage,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .order("full_name")
        .limit(500);
      if (error) throw error;
      return data || [];
    },
  });

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b: any) =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.isbn?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q),
    );
  }, [books, search]);

  const myLoans = loans.filter((l: any) => l.borrower_id === user?.id);
  const activeLoans = loans.filter((l: any) => l.status === "active");

  const stats = useMemo(() => {
    const totalTitles = books.length;
    const totalCopies = books.reduce((s: number, b: any) => s + (b.total_copies || 0), 0);
    const available = books.reduce((s: number, b: any) => s + (b.available_copies || 0), 0);
    const onLoan = totalCopies - available;
    return { totalTitles, totalCopies, available, onLoan };
  }, [books]);

  const deleteBook = async (id: string) => {
    if (!confirm("Delete this book?")) return;
    const { error } = await supabase.from("library_books").delete().eq("id", id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Book deleted" });
    qc.invalidateQueries({ queryKey: ["library-books"] });
  };

  const returnLoan = async (loan: any) => {
    const { error } = await supabase
      .from("library_loans")
      .update({ status: "returned", returned_at: new Date().toISOString() })
      .eq("id", loan.id);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Book returned" });
    qc.invalidateQueries({ queryKey: ["library-loans"] });
    qc.invalidateQueries({ queryKey: ["library-books"] });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" /> Library
            </h1>
            <p className="text-muted-foreground text-sm">
              Catalog, borrow and return school library books.
            </p>
          </div>
          {canManage && (
            <Button onClick={() => setBookDialog({ open: true })}>
              <Plus className="h-4 w-4 mr-2" /> Add Book
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Titles", value: stats.totalTitles },
            { label: "Total Copies", value: stats.totalCopies },
            { label: "Available", value: stats.available },
            { label: "On Loan", value: stats.onLoan },
          ].map((s) => (
            <Card key={s.label} className="p-4">
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="text-2xl font-bold">{s.value}</div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="catalog">
          <TabsList>
            <TabsTrigger value="catalog">Catalog</TabsTrigger>
            {canManage && <TabsTrigger value="loans">Circulation</TabsTrigger>}
            <TabsTrigger value="my">My Loans</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search title, author, ISBN, category..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Shelf</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {booksLoading ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                  ) : filteredBooks.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No books found.</TableCell></TableRow>
                  ) : (
                    filteredBooks.map((b: any) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.title}</TableCell>
                        <TableCell>{b.author || "—"}</TableCell>
                        <TableCell>{b.category || "—"}</TableCell>
                        <TableCell>{b.shelf_location || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={b.available_copies > 0 ? "default" : "secondary"}>
                            {b.available_copies}/{b.total_copies}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {canManage && (
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
                              <Button size="sm" variant="ghost" onClick={() => deleteBook(b.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {canManage && (
            <TabsContent value="loans" className="space-y-4">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Borrower</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Due</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loans.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No loans yet.</TableCell></TableRow>
                    ) : (
                      loans.map((l: any) => {
                        const overdue = l.status === "active" && new Date(l.due_at) < new Date();
                        return (
                          <TableRow key={l.id}>
                            <TableCell className="font-medium">{l.library_books?.title || "—"}</TableCell>
                            <TableCell>{l.borrower_name || l.borrower_id?.slice(0, 8)}</TableCell>
                            <TableCell>{format(new Date(l.issued_at), "MMM d, yyyy")}</TableCell>
                            <TableCell>{format(new Date(l.due_at), "MMM d, yyyy")}</TableCell>
                            <TableCell>
                              <Badge variant={l.status === "returned" ? "secondary" : overdue ? "destructive" : "default"}>
                                {overdue ? "overdue" : l.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {l.status === "active" && (
                                <Button size="sm" variant="outline" onClick={() => returnLoan(l)}>
                                  <Undo2 className="h-3 w-3 mr-1" /> Return
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="my" className="space-y-4">
            <Card className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myLoans.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">You have no loans.</TableCell></TableRow>
                  ) : (
                    myLoans.map((l: any) => {
                      const overdue = l.status === "active" && new Date(l.due_at) < new Date();
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="font-medium">{l.library_books?.title}</TableCell>
                          <TableCell>{format(new Date(l.issued_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>{format(new Date(l.due_at), "MMM d, yyyy")}</TableCell>
                          <TableCell>
                            <Badge variant={l.status === "returned" ? "secondary" : overdue ? "destructive" : "default"}>
                              {overdue ? "overdue" : l.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BookDialog
        open={bookDialog.open}
        book={bookDialog.book}
        onOpenChange={(o) => setBookDialog({ open: o, book: o ? bookDialog.book : undefined })}
        onSaved={() => qc.invalidateQueries({ queryKey: ["library-books"] })}
        userId={user?.id}
      />
      <IssueDialog
        open={issueDialog.open}
        book={issueDialog.book}
        borrowers={borrowers}
        onOpenChange={(o) => setIssueDialog({ open: o, book: o ? issueDialog.book : undefined })}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["library-loans"] });
          qc.invalidateQueries({ queryKey: ["library-books"] });
        }}
        issuerId={user?.id}
      />
    </DashboardLayout>
  );
};

function BookDialog({ open, book, onOpenChange, onSaved, userId }: any) {
  const editing = !!book;
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Reset when dialog opens
  useMemo(() => {
    if (open) {
      setForm(
        book || {
          title: "",
          author: "",
          isbn: "",
          category: "",
          publisher: "",
          publication_year: "",
          language: "English",
          shelf_location: "",
          total_copies: 1,
          available_copies: 1,
          description: "",
          cover_url: "",
        },
      );
    }
  }, [open, book]);

  const save = async () => {
    if (!form.title?.trim()) {
      return toast({ title: "Title required", variant: "destructive" });
    }
    setSaving(true);
    const payload: any = {
      ...form,
      publication_year: form.publication_year ? Number(form.publication_year) : null,
      total_copies: Number(form.total_copies) || 1,
      available_copies: Number(form.available_copies ?? form.total_copies) || 1,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("library_books").update(payload).eq("id", book.id));
    } else {
      payload.created_by = userId;
      ({ error } = await supabase.from("library_books").insert(payload));
    }
    setSaving(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: editing ? "Book updated" : "Book added" });
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Book" : "Add Book"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <Label>Title *</Label>
            <Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label>Author</Label>
            <Input value={form.author || ""} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </div>
          <div>
            <Label>ISBN</Label>
            <Input value={form.isbn || ""} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
          </div>
          <div>
            <Label>Category</Label>
            <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <Label>Publisher</Label>
            <Input value={form.publisher || ""} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
          </div>
          <div>
            <Label>Publication Year</Label>
            <Input type="number" value={form.publication_year || ""} onChange={(e) => setForm({ ...form, publication_year: e.target.value })} />
          </div>
          <div>
            <Label>Language</Label>
            <Input value={form.language || ""} onChange={(e) => setForm({ ...form, language: e.target.value })} />
          </div>
          <div>
            <Label>Shelf Location</Label>
            <Input value={form.shelf_location || ""} onChange={(e) => setForm({ ...form, shelf_location: e.target.value })} />
          </div>
          <div>
            <Label>Total Copies</Label>
            <Input
              type="number"
              min={1}
              value={form.total_copies || 1}
              onChange={(e) => {
                const v = Number(e.target.value) || 1;
                setForm({
                  ...form,
                  total_copies: v,
                  available_copies: editing ? form.available_copies : v,
                });
              }}
            />
          </div>
          {editing && (
            <div>
              <Label>Available Copies</Label>
              <Input
                type="number"
                min={0}
                value={form.available_copies ?? 0}
                onChange={(e) => setForm({ ...form, available_copies: Number(e.target.value) })}
              />
            </div>
          )}
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IssueDialog({ open, book, borrowers, onOpenChange, onSaved, issuerId }: any) {
  const [borrowerId, setBorrowerId] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [dueDays, setDueDays] = useState(14);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useMemo(() => {
    if (open) {
      setBorrowerId("");
      setBorrowerName("");
      setDueDays(14);
      setNotes("");
    }
  }, [open]);

  const submit = async () => {
    if (!book?.id) return;
    if (!borrowerId) return toast({ title: "Select borrower", variant: "destructive" });
    setSaving(true);
    const due = new Date();
    due.setDate(due.getDate() + Number(dueDays || 14));
    const { error } = await supabase.from("library_loans").insert({
      book_id: book.id,
      borrower_id: borrowerId,
      borrower_name: borrowerName,
      issued_by: issuerId,
      due_at: due.toISOString(),
      status: "active",
      notes,
    });
    setSaving(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: "Book issued" });
    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue: {book?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Borrower</Label>
            <Select
              value={borrowerId}
              onValueChange={(v) => {
                setBorrowerId(v);
                const b = borrowers.find((x: any) => x.id === v);
                setBorrowerName(b?.full_name || b?.email || "");
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
              <SelectContent>
                {borrowers.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.full_name || b.email} {b.role ? `· ${b.role}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Loan period (days)</Label>
            <Input type="number" min={1} value={dueDays} onChange={(e) => setDueDays(Number(e.target.value))} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Issuing…" : "Issue Book"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default Library;
