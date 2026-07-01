import { useState, useEffect, JSX } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLibrary, LibraryBook } from "@/hooks/useLibrary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WizardForm, WizardStep } from "@/components/ui/wizard-form";

const formSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().optional().default(""),
  isbn: z.string().optional().default(""),
  category: z.string().optional().default(""),
  class_level: z.string().optional().default(""),
  publisher: z.string().optional().default(""),
  publication_year: z.coerce.number().int().optional(),
  language: z.string().default("English"),
  shelf_location: z.string().optional().default(""),
  total_copies: z.coerce.number().int().min(1).default(1),
  available_copies: z.coerce.number().int().min(0).default(1),
  description: z.string().optional().default(""),
  cover_url: z.string().optional().default(""),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS: WizardStep[] = [
  { id: "bibliographic", title: "Bibliographic", description: "Title, author, ISBN" },
  { id: "library", title: "Library Info", description: "Copies, shelf, description" },
];

interface BookDialogProps {
  open: boolean;
  book?: LibraryBook | null;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function BookDialog({ open, book, onOpenChange, userId }: BookDialogProps): JSX.Element {
  const editing = !!book;
  const { addBook, updateBook } = useLibrary();
  const [currentStep, setCurrentStep] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      author: "",
      isbn: "",
      category: "",
      class_level: "",
      publisher: "",
      publication_year: undefined,
      language: "English",
      shelf_location: "",
      total_copies: 1,
      available_copies: 1,
      description: "",
      cover_url: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (book) {
        form.reset({
          title: book.title || "",
          author: book.author || "",
          isbn: book.isbn || "",
          category: book.category || "",
          class_level: book.class_level?.toString() || "",
          publisher: book.publisher || "",
          publication_year: book.publication_year || undefined,
          language: book.language || "English",
          shelf_location: book.shelf_location || "",
          total_copies: book.total_copies || 1,
          available_copies: book.available_copies ?? book.total_copies ?? 1,
          description: book.description || "",
          cover_url: book.cover_url || "",
        });
      } else {
        form.reset();
      }
      setCurrentStep(0);
    }
  }, [open, book, form]);

  const save = async (values: FormValues) => {
    const payload = {
      ...values,
      publication_year: values.publication_year || null,
    };
    if (editing) {
      await updateBook.mutateAsync({ id: book!.id, ...payload } as any);
    } else {
      await addBook.mutateAsync({ ...payload, created_by: userId } as any);
    }
    onOpenChange(false);
  };

  const handleNext = async () => {
    const fields: (keyof FormValues)[][] = [
      ["title", "author", "isbn", "category", "publisher", "publication_year", "language"],
      ["class_level", "shelf_location", "total_copies", "available_copies", "description", "cover_url"],
    ];
    const valid = await form.trigger(fields[currentStep], { shouldFocus: true });
    if (valid) setCurrentStep((c) => c + 1);
  };

  const isLoading = addBook.isPending || updateBook.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Book" : "Add Book"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(save)}>
            <WizardForm
              steps={STEPS}
              currentStep={currentStep}
              onNext={handleNext}
              onBack={() => setCurrentStep((c) => Math.max(0, c - 1))}
              isFirstStep={currentStep === 0}
              isLastStep={currentStep === STEPS.length - 1}
              isLoading={isLoading}
              submitLabel={editing ? "Save Changes" : "Add Book"}
            >
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Title *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="author" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isbn" render={({ field }) => (
                    <FormItem>
                      <FormLabel>ISBN</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="publisher" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publisher</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="publication_year" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publication Year</FormLabel>
                      <FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="language" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              )}

              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="class_level" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Level</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="shelf_location" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shelf Location</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="total_copies" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Copies</FormLabel>
                      <FormControl><Input type="number" min={1} {...field} onChange={e => { field.onChange(Number(e.target.value)); if (!editing) form.setValue("available_copies", Number(e.target.value)); }} /></FormControl>
                    </FormItem>
                  )} />
                  {editing && (
                    <FormField control={form.control} name="available_copies" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Available Copies</FormLabel>
                        <FormControl><Input type="number" min={0} {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                      </FormItem>
                    )} />
                  )}
                  {!editing && (
                    <FormField control={form.control} name="cover_url" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cover Image URL</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                      </FormItem>
                    )} />
                  )}
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl><Textarea {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              )}
            </WizardForm>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
