import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface LibraryBook {
  id: string;
  title: string;
  author: string | null;
  isbn: string | null;
  category: string | null;
  class_level: string | null;
  publisher: string | null;
  publication_year: number | null;
  language: string | null;
  description: string | null;
  cover_url: string | null;
  shelf_location: string | null;
  total_copies: number;
  available_copies: number;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryLoan {
  id: string;
  book_id: string;
  borrower_id: string;
  borrower_name: string | null;
  issued_by: string | null;
  issued_at: string;
  due_at: string;
  returned_at: string | null;
  status: "active" | "returned" | "overdue" | "lost";
  notes: string | null;
  created_at: string;
  updated_at: string;
  library_books?: Pick<LibraryBook, "title" | "author">;
}

export interface LibraryMember {
  id: string;
  profile_id: string | null;
  learner_id: string | null;
  id_card_number: string;
  member_type: "student" | "teacher" | "staff" | "external";
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  max_loans: number;
  active_loans: number;
  total_fines: number;
  status: "active" | "suspended" | "expired" | "banned";
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string; email: string; role: string } | null;
}

export interface LibraryReservation {
  id: string;
  book_id: string;
  member_id: string;
  reserved_at: string;
  expires_at: string;
  fulfilled_at: string | null;
  cancelled_at: string | null;
  status: "active" | "fulfilled" | "expired" | "cancelled";
  notes: string | null;
  created_at: string;
  library_books?: Pick<LibraryBook, "title" | "author">;
  library_members?: Pick<LibraryMember, "id_card_number" | "member_type"> & {
    profiles?: { full_name: string };
  };
}

export interface LibraryFine {
  id: string;
  loan_id: string | null;
  member_id: string;
  amount: number;
  paid_amount: number;
  reason: string;
  status: "pending" | "paid" | "waived";
  issued_by: string | null;
  waived_by: string | null;
  waived_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  library_members?: Pick<LibraryMember, "id_card_number" | "member_type"> & {
    profiles?: { full_name: string };
  };
}

export const MANAGER_ROLES = [
  "admin",
  "head_teacher",
  "deputy_head_teacher",
  "secretary",
  "office_manager",
  "director",
  "teacher",
  "nurse",
  "accountant",
  "storekeeper",
];

export const useLibrary = (role?: string) => {
  const qc = useQueryClient();
  const canManage = MANAGER_ROLES.includes(role || "");

  const books = useQuery<LibraryBook[]>({
    queryKey: ["library-books"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_books")
        .select("*")
        .order("title");
      if (error) throw error;
      return (data || []) as LibraryBook[];
    },
  });

  const loans = useQuery<LibraryLoan[]>({
    queryKey: ["library-loans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_loans")
        .select("*, library_books(title, author)")
        .order("issued_at", { ascending: false });
      if (error) throw error;
      return (data || []) as LibraryLoan[];
    },
    refetchInterval: 30000,
  });

  const members = useQuery<LibraryMember[]>({
    queryKey: ["library-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_members")
        .select("*, profiles:profile_id(full_name, email, role)")
        .order("id_card_number");
      if (error) throw error;
      return (data || []) as LibraryMember[];
    },
  });

  const reservations = useQuery<LibraryReservation[]>({
    queryKey: ["library-reservations"],
    enabled: canManage,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_reservations")
        .select("*, library_books(title, author), library_members!inner(id_card_number, member_type, profiles:profile_id(full_name))")
        .order("reserved_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as LibraryReservation[];
    },
  });

  const fines = useQuery<LibraryFine[]>({
    queryKey: ["library-fines"],
    enabled: canManage,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("library_fines")
        .select("*, library_members!inner(id_card_number, member_type, profiles:profile_id(full_name))")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as LibraryFine[];
    },
  });

  const borrowerCandidates = useQuery({
    queryKey: ["library-borrower-candidates"],
    enabled: canManage,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .order("full_name")
        .limit(500);
      if (error) throw error;
      return (data || []) as { id: string; full_name: string | null; email: string; role: string | null }[];
    },
  });

  const addBook = useMutation({
    mutationFn: async (book: Partial<LibraryBook> & { title: string }) => {
      const { error } = await supabase.from("library_books").insert(book);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-books"] });
      toast({ title: "Book added successfully" });
    },
    onError: (err: any) => toast({ title: "Failed to add book", description: err.message, variant: "destructive" }),
  });

  const updateBook = useMutation({
    mutationFn: async ({ id, ...book }: Partial<LibraryBook> & { id: string }) => {
      const { error } = await supabase.from("library_books").update(book).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-books"] });
      toast({ title: "Book updated" });
    },
    onError: (err: any) => toast({ title: "Failed to update book", description: err.message, variant: "destructive" }),
  });

  const deleteBook = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("library_books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-books"] });
      toast({ title: "Book deleted" });
    },
    onError: (err: any) => toast({ title: "Failed to delete book", description: err.message, variant: "destructive" }),
  });

  const issueLoan = useMutation({
    mutationFn: async (loan: {
      book_id: string;
      borrower_id: string;
      borrower_name: string;
      due_at: string;
      issued_by: string;
      notes?: string;
    }) => {
      const { error } = await supabase.from("library_loans").insert({
        ...loan,
        status: "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-loans"] });
      qc.invalidateQueries({ queryKey: ["library-books"] });
      toast({ title: "Book issued" });
    },
    onError: (err: any) => toast({ title: "Failed to issue book", description: err.message, variant: "destructive" }),
  });

  const returnLoan = useMutation({
    mutationFn: async (loanId: string) => {
      const { error } = await supabase
        .from("library_loans")
        .update({ status: "returned", returned_at: new Date().toISOString() })
        .eq("id", loanId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-loans"] });
      qc.invalidateQueries({ queryKey: ["library-books"] });
      toast({ title: "Book returned" });
    },
    onError: (err: any) => toast({ title: "Failed to return book", description: err.message, variant: "destructive" }),
  });

  const markLost = useMutation({
    mutationFn: async (loanId: string) => {
      const { error } = await supabase
        .from("library_loans")
        .update({ status: "lost", returned_at: new Date().toISOString() })
        .eq("id", loanId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-loans"] });
      qc.invalidateQueries({ queryKey: ["library-books"] });
      toast({ title: "Book marked as lost" });
    },
    onError: (err: any) => toast({ title: "Failed to update", description: err.message, variant: "destructive" }),
  });

  const reserveBook = useMutation({
    mutationFn: async ({ book_id, member_id }: { book_id: string; member_id: string }) => {
      const { error } = await supabase.from("library_reservations").insert({
        book_id,
        member_id,
        expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-reservations"] });
      toast({ title: "Book reserved" });
    },
    onError: (err: any) => toast({ title: "Failed to reserve", description: err.message, variant: "destructive" }),
  });

  const cancelReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("library_reservations")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-reservations"] });
      toast({ title: "Reservation cancelled" });
    },
    onError: (err: any) => toast({ title: "Failed to cancel", description: err.message, variant: "destructive" }),
  });

  const addFine = useMutation({
    mutationFn: async (fine: {
      loan_id?: string;
      member_id: string;
      amount: number;
      reason: string;
      issued_by: string;
    }) => {
      const { error } = await supabase.from("library_fines").insert(fine);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-fines"] });
      qc.invalidateQueries({ queryKey: ["library-members"] });
      toast({ title: "Fine added" });
    },
    onError: (err: any) => toast({ title: "Failed to add fine", description: err.message, variant: "destructive" }),
  });

  const payFine = useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount: number }) => {
      const { error } = await supabase
        .from("library_fines")
        .update({ paid_amount: amount, status: "paid", paid_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-fines"] });
      qc.invalidateQueries({ queryKey: ["library-members"] });
      toast({ title: "Fine paid" });
    },
    onError: (err: any) => toast({ title: "Failed to pay fine", description: err.message, variant: "destructive" }),
  });

  const waiveFine = useMutation({
    mutationFn: async ({ id, waived_by }: { id: string; waived_by: string }) => {
      const { error } = await supabase
        .from("library_fines")
        .update({ status: "waived", waived_by, waived_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-fines"] });
      qc.invalidateQueries({ queryKey: ["library-members"] });
      toast({ title: "Fine waived" });
    },
    onError: (err: any) => toast({ title: "Failed to waive fine", description: err.message, variant: "destructive" }),
  });

  const addMember = useMutation({
    mutationFn: async (member: Partial<LibraryMember> & { id_card_number: string; member_type: LibraryMember["member_type"] }) => {
      const { error } = await supabase.from("library_members").insert(member);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-members"] });
      toast({ title: "Member added" });
    },
    onError: (err: any) => toast({ title: "Failed to add member", description: err.message, variant: "destructive" }),
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...member }: Partial<LibraryMember> & { id: string }) => {
      const { error } = await supabase.from("library_members").update(member).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["library-members"] });
      toast({ title: "Member updated" });
    },
    onError: (err: any) => toast({ title: "Failed to update member", description: err.message, variant: "destructive" }),
  });

  return {
    books,
    loans,
    members,
    reservations,
    fines,
    borrowerCandidates,
    canManage,
    addBook,
    updateBook,
    deleteBook,
    issueLoan,
    returnLoan,
    markLost,
    reserveBook,
    cancelReservation,
    addFine,
    payFine,
    waiveFine,
    addMember,
    updateMember,
  };
};
