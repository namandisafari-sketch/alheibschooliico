import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAllStaff } from "@/hooks/useStaff";
import {
  useSalaryRecords,
  useSalaryPayments,
  useCreateSalaryRecord,
  useCreateSalaryPayment,
} from "@/hooks/useSalary";
import {
  DollarSign,
  Plus,
  Search,
  Wallet,
  TrendingUp,
  Users,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";

const Salary = () => {
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const { data: staff = [] } = useAllStaff();
  const { data: salaryRecords = [], isLoading: loadingRecords } = useSalaryRecords();
  const { data: payments = [], isLoading: loadingPayments } = useSalaryPayments();
  const createSalaryRecord = useCreateSalaryRecord();
  const createPayment = useCreateSalaryPayment();

  const [newSalary, setNewSalary] = useState({
    staff_id: "",
    basic_salary: 0,
    allowances: 0,
    deductions: 0,
    currency: "UGX",
    effective_from: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [newPayment, setNewPayment] = useState({
    salary_record_id: "",
    staff_id: "",
    amount: 0,
    payment_date: new Date().toISOString().split("T")[0],
    payment_method: "bank_transfer",
    reference_number: "",
    status: "completed",
    notes: "",
  });

  const filteredRecords = salaryRecords.filter((record) =>
    record.staff?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPayroll = salaryRecords.reduce((sum, r) => sum + (r.net_salary || 0), 0);
  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const handleCreateSalary = async () => {
    try {
      await createSalaryRecord.mutateAsync(newSalary);
      toast.success(t("success"));
      setSalaryDialogOpen(false);
      setNewSalary({
        staff_id: "",
        basic_salary: 0,
        allowances: 0,
        deductions: 0,
        currency: "UGX",
        effective_from: new Date().toISOString().split("T")[0],
        notes: "",
      });
    } catch {
      toast.error(t("error"));
    }
  };

  const handleCreatePayment = async () => {
    try {
      await createPayment.mutateAsync(newPayment);
      toast.success(t("success"));
      setPaymentDialogOpen(false);
      setNewPayment({
        salary_record_id: "",
        staff_id: "",
        amount: 0,
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "bank_transfer",
        reference_number: "",
        status: "completed",
        notes: "",
      });
    } catch {
      toast.error(t("error"));
    }
  };

  const formatCurrency = (amount: number, currency = "UGX") => {
    return new Intl.NumberFormat(isRTL ? "ar-EG" : "en-UG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout title={t("salary")} subtitle={isRTL ? "إدارة رواتب الموظفين" : "Manage staff salaries"}>
      <div className="space-y-4 sm:space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-primary/10 rounded-lg shrink-0">
                  <Users className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("staff")}</p>
                  <p className="text-lg sm:text-2xl font-bold">{salaryRecords.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg shrink-0">
                  <DollarSign className="h-4 w-4 sm:h-6 sm:w-6 text-green-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{isRTL ? "الرواتب" : "Payroll"}</p>
                  <p className="text-sm sm:text-2xl font-bold truncate">{formatCurrency(totalPayroll)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-blue-500/10 rounded-lg shrink-0">
                  <Wallet className="h-4 w-4 sm:h-6 sm:w-6 text-blue-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{isRTL ? "المدفوع" : "Paid"}</p>
                  <p className="text-sm sm:text-2xl font-bold truncate">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="p-2 sm:p-3 bg-amber-500/10 rounded-lg shrink-0">
                  <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{isRTL ? "المدفوعات" : "Payments"}</p>
                  <p className="text-lg sm:text-2xl font-bold">{payments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="records">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="records" className="flex-1 sm:flex-none text-xs sm:text-sm">{isRTL ? "الرواتب" : "Records"}</TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 sm:flex-none text-xs sm:text-sm">{isRTL ? "المدفوعات" : "Payments"}</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between">
              <div className="relative flex-1 max-w-full sm:max-w-sm">
                <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground`} />
                <Input
                  placeholder={t("search")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? "pr-10" : "pl-10"} h-9`}
                />
              </div>
              <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto h-9 text-sm">
                    <Plus className="h-4 w-4 mr-1.5" />
                    {isRTL ? "إضافة" : "Add Salary"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{isRTL ? "إضافة سجل راتب" : "Add Salary Record"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>{t("staff")}</Label>
                      <Select value={newSalary.staff_id} onValueChange={(v) => setNewSalary({ ...newSalary, staff_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder={isRTL ? "اختر موظف" : "Select staff"} />
                        </SelectTrigger>
                        <SelectContent>
                          {staff.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.full_name} - {s.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t("basicSalary")}</Label>
                        <Input
                          type="number"
                          value={newSalary.basic_salary}
                          onChange={(e) => setNewSalary({ ...newSalary, basic_salary: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>{t("allowances")}</Label>
                        <Input
                          type="number"
                          value={newSalary.allowances}
                          onChange={(e) => setNewSalary({ ...newSalary, allowances: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{t("deductions")}</Label>
                        <Input
                          type="number"
                          value={newSalary.deductions}
                          onChange={(e) => setNewSalary({ ...newSalary, deductions: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>{isRTL ? "تاريخ السريان" : "Effective From"}</Label>
                        <Input
                          type="date"
                          value={newSalary.effective_from}
                          onChange={(e) => setNewSalary({ ...newSalary, effective_from: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{isRTL ? "ملاحظات" : "Notes"}</Label>
                      <Textarea
                        value={newSalary.notes}
                        onChange={(e) => setNewSalary({ ...newSalary, notes: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setSalaryDialogOpen(false)}>
                        {t("cancel")}
                      </Button>
                      <Button onClick={handleCreateSalary} disabled={createSalaryRecord.isPending}>
                        {t("save")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">{t("name")}</TableHead>
                      <TableHead className="hidden sm:table-cell text-xs sm:text-sm">{t("role")}</TableHead>
                      <TableHead className="hidden md:table-cell text-xs sm:text-sm">{t("basicSalary")}</TableHead>
                      <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t("allowances")}</TableHead>
                      <TableHead className="hidden lg:table-cell text-xs sm:text-sm">{t("deductions")}</TableHead>
                      <TableHead className="text-xs sm:text-sm">{t("netSalary")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingRecords ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-sm">
                          {t("loading")}
                        </TableCell>
                      </TableRow>
                    ) : filteredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-sm">
                          {t("noData")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <div className="min-w-0">
                              <span className="font-medium text-sm block truncate">{record.staff?.full_name}</span>
                              <Badge variant="outline" className="text-xs sm:hidden mt-1">{record.staff?.role}</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge variant="outline" className="text-xs">{record.staff?.role}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{formatCurrency(record.basic_salary)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-green-600 text-sm">
                            +{formatCurrency(record.allowances || 0)}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-red-600 text-sm">
                            -{formatCurrency(record.deductions || 0)}
                          </TableCell>
                          <TableCell className="font-bold text-sm">{formatCurrency(record.net_salary)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto h-9 text-sm">
                    <CreditCard className="h-4 w-4 mr-1.5" />
                    {isRTL ? "دفعة" : "Record Payment"}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{isRTL ? "تسجيل دفعة جديدة" : "Record New Payment"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>{t("staff")}</Label>
                      <Select
                        value={newPayment.staff_id}
                        onValueChange={(v) => {
                          const record = salaryRecords.find((r) => r.staff_id === v);
                          setNewPayment({
                            ...newPayment,
                            staff_id: v,
                            salary_record_id: record?.id || "",
                            amount: record?.net_salary || 0,
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={isRTL ? "اختر موظف" : "Select staff"} />
                        </SelectTrigger>
                        <SelectContent>
                          {salaryRecords.map((r) => (
                            <SelectItem key={r.staff_id} value={r.staff_id}>
                              {r.staff?.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>{isRTL ? "المبلغ" : "Amount"}</Label>
                        <Input
                          type="number"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>{t("paymentDate")}</Label>
                        <Input
                          type="date"
                          value={newPayment.payment_date}
                          onChange={(e) => setNewPayment({ ...newPayment, payment_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>{t("paymentMethod")}</Label>
                      <Select
                        value={newPayment.payment_method}
                        onValueChange={(v) => setNewPayment({ ...newPayment, payment_method: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">{t("bankTransfer")}</SelectItem>
                          <SelectItem value="cash">{t("cash")}</SelectItem>
                          <SelectItem value="cheque">{t("cheque")}</SelectItem>
                          <SelectItem value="mobile_payment">{t("mobilePayment")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{isRTL ? "رقم المرجع" : "Reference Number"}</Label>
                      <Input
                        value={newPayment.reference_number}
                        onChange={(e) => setNewPayment({ ...newPayment, reference_number: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                        {t("cancel")}
                      </Button>
                      <Button onClick={handleCreatePayment} disabled={createPayment.isPending}>
                        {t("save")}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">{t("name")}</TableHead>
                      <TableHead className="text-xs sm:text-sm">{isRTL ? "المبلغ" : "Amount"}</TableHead>
                      <TableHead className="hidden sm:table-cell text-xs sm:text-sm">{t("paymentDate")}</TableHead>
                      <TableHead className="hidden md:table-cell text-xs sm:text-sm">{t("paymentMethod")}</TableHead>
                      <TableHead className="text-xs sm:text-sm">{isRTL ? "الحالة" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingPayments ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-sm">
                          {t("loading")}
                        </TableCell>
                      </TableRow>
                    ) : payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-sm">
                          {t("noData")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            <div className="min-w-0">
                              <span className="font-medium text-sm block truncate">{payment.staff?.full_name}</span>
                              <span className="text-xs text-muted-foreground sm:hidden">
                                {format(new Date(payment.payment_date), "MMM d")}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold text-sm">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm">{format(new Date(payment.payment_date), "PPP")}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline" className="text-xs">
                              {payment.payment_method === "bank_transfer"
                                ? t("bankTransfer")
                                : payment.payment_method === "cash"
                                ? t("cash")
                                : payment.payment_method === "cheque"
                                ? t("cheque")
                                : t("mobilePayment")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "completed" ? "default" : "secondary"} className="text-xs">
                              {payment.status === "completed" ? (isRTL ? "✓" : "✓") : (isRTL ? "..." : "...")}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Salary;
