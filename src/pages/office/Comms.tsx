// @ts-nocheck
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Send, Plus, Smartphone, RefreshCw, Mail } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { smsService } from "@/services/smsService";
import { formatUgandaDate } from "@/lib/ugandaTime";

const Comms = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sendViaSMS, setSendViaSMS] = useState(false);
  const [smsBalance, setSmsBalance] = useState<any>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["communications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communications")
        .select(`*, sender:profiles(full_name)`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const fetchBalance = async () => {
    try {
      const result = await smsService.getBalance();
      if (result.success) {
        setSmsBalance(result.data);
      }
    } catch {
      console.error("Failed to fetch SMS balance");
    }
  };

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "normal",
    target_roles: [] as string[],
  });

  const createMsg = useMutation({
    mutationFn: async (msg: any) => {
      // 1. Create communication record
      const { data: newComm, error: commError } = await supabase
        .from("communications")
        .insert({
          ...msg,
          sender_id: user?.id,
          sent_via: sendViaSMS ? ["in_app", "sms"] : ["in_app"]
        })
        .select()
        .single();

      if (commError) throw commError;

      // 2. If SMS requested, send via UGSMS
      if (sendViaSMS && msg.target_roles.length > 0) {
        try {
          // Fetch relevant phone numbers and names from profiles based on target_roles
          const { data: profiles } = await supabase
            .from("profiles")
            .select("phone, full_name")
            .in("role", msg.target_roles)
            .not("phone", "is", null);

          if (profiles && profiles.length > 0) {
            const hasPlaceholders = /\{name\}|\{school\}|\{date\}/i.test(msg.content);

            if (hasPlaceholders) {
              // Send individual messages for mail merge
              const messages = profiles.map(p => ({
                number: p.phone,
                message: msg.content
                  .replace(/\{name\}/gi, p.full_name || "Parent/Staff")
                  .replace(/\{school\}/gi, "Alheib PS")
                  .replace(/\{date\}/gi, formatUgandaDate(new Date()))
              }));
              
              const smsResult = await smsService.sendBulkSMS(messages);
              if (!smsResult.success) {
                toast({
                  title: "Warning",
                  description: "Broadcast logged, but SMS delivery failed: " + smsResult.message,
                  variant: "destructive"
                });
              } else {
                toast({
                  title: "SMS Sent",
                  description: `Broadcast sent to ${profiles.length} recipients via Personalized SMS.`
                });
              }
            } else {
              // Standard bulk send (comma separated numbers)
              const numbers = profiles.map(p => p.phone).join(",");
              const smsResult = await smsService.sendSMS(numbers, msg.content);
              
              if (!smsResult.success) {
                toast({
                  title: "Warning",
                  description: "Broadcast logged, but SMS delivery failed: " + smsResult.message,
                  variant: "destructive"
                });
              } else {
                toast({
                  title: "SMS Sent",
                  description: `Broadcast sent to ${profiles.length} recipients via SMS.`
                });
              }
            }
          }
        } catch (smsErr) {
          console.error("SMS Broadcast error:", smsErr);
        }
      }

      return newComm;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communications"] });
      toast({ title: "Sent", description: "Communication broadcasted successfully" });
      setIsDialogOpen(false);
      setFormData({ title: "", content: "", priority: "normal", target_roles: [] });
      setSendViaSMS(false);
    },
  });

  const handleRoleToggle = (role: string) => {
    setFormData(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role]
    }));
  };

  return (
    <DashboardLayout title="Communications" subtitle="Broadcast School-wide Announcements & Memos">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2 items-center">
            <Badge variant="outline" className="bg-primary/5">Active Broadcaster</Badge>
            <div className="flex items-center gap-2 border rounded-full px-3 py-1 bg-emerald-50 border-emerald-100">
              <Smartphone className="h-3 w-3 text-emerald-600" />
              <span className="text-[10px] font-medium text-emerald-700">
                {smsBalance ? `${smsBalance.balance} ${smsBalance.currency}` : "SMS Ready"}
              </span>
              <button onClick={fetchBalance} className="hover:rotate-180 transition-transform duration-500">
                <RefreshCw className="h-2.5 w-2.5 text-emerald-600" />
              </button>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Broadcast Message</DialogTitle>
                <DialogDescription>Draft a message to be sent to specific school roles</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Message Title</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData(p => ({...p, title: e.target.value}))}
                    placeholder="e.g. Mid-term Break Notice" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea 
                    rows={4}
                    value={formData.content} 
                    onChange={(e) => setFormData(p => ({...p, content: e.target.value}))}
                    placeholder="Detailed message content..." 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select onValueChange={(v) => setFormData(p => ({...p, priority: v}))}>
                      <SelectTrigger><SelectValue placeholder="Normal" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Target Groups</Label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['teacher', 'parent', 'staff'].map(role => (
                        <div key={role} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`role-${role}`} 
                            checked={formData.target_roles.includes(role)}
                            onCheckedChange={() => handleRoleToggle(role)}
                          />
                          <Label htmlFor={`role-${role}`} className="text-xs capitalize">{role}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 border p-3 rounded-lg bg-emerald-50/30 border-emerald-100">
                  <Checkbox 
                    id="send-sms" 
                    checked={sendViaSMS}
                    onCheckedChange={(checked) => setSendViaSMS(!!checked)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="send-sms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-emerald-600" />
                      Broadcast also via SMS (UGSMS)
                    </Label>
                    <p className="text-xs text-muted-foreground italic">
                      Standard SMS rates apply. Ensure target groups have valid Ugandan phone numbers.
                    </p>
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={() => createMsg.mutate(formData)} disabled={createMsg.isPending}>
                  <Send className="h-4 w-4" /> {createMsg.isPending ? "Broadcasting..." : "Broadcast Now"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Recent Announcements</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">Loading announcements...</div>
            ) : messages.length === 0 ? (
              <div className="py-20 text-center border-dashed rounded-lg space-y-2">
                <Mail className="h-10 w-10 mx-auto text-muted-foreground/30" />
                <p className="text-muted-foreground">No announcements logged yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead className="text-right">Channels</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((msg) => (
                    <TableRow key={msg.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {format(new Date(msg.created_at), "MMM d, h:mm a")}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{msg.title}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{msg.content}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {msg.target_roles?.map((r: string) => (
                            <Badge key={r} variant="secondary" className="text-[10px] py-0">{r}</Badge>
                          )) || <Badge variant="outline" className="text-[10px] py-0">All</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          msg.priority === 'urgent' ? 'destructive' : 
                          msg.priority === 'high' ? 'default' : 'outline'
                        } className="text-[10px]">
                          {msg.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{msg.sender?.full_name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Smartphone className={`h-3 w-3 ${msg.sent_via?.includes('sms') ? 'text-primary' : 'text-muted-foreground/30'}`} />
                          <Mail className={`h-3 w-3 ${msg.sent_via?.includes('email') ? 'text-primary' : 'text-muted-foreground/30'}`} />
                          <Bell className="h-3 w-3 text-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Comms;
