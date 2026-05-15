import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Phone, Check, X, LogOut } from 'lucide-react';
import { format } from 'date-fns';
import { useCheckOutVisitor } from '@/hooks/useVisitors';
import { toast } from '@/hooks/use-toast';

type ActiveVisit = {
  id: string;
  visitor_name: string;
  visitor_phone?: string;
  badge_number: string;
  purpose?: string;
  host_name?: string;
  check_in_at: string;
  status: string;
};

export const ActiveVisitCard = ({ visit }: { visit: ActiveVisit }) => {
  const checkOut = useCheckOutVisitor();
  const handleCheckOut = async () => {
    try {
      await checkOut.mutateAsync(visit as any);
      toast({ title: 'Visitor checked out' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="p-4 hover:shadow transition-shadow">
      <CardHeader className="flex flex-col space-y-1 p-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="capitalize text-xs">{visit.status}</Badge>
            <CardTitle className="text-sm font-medium">{visit.visitor_name}</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={handleCheckOut}>
            <LogOut className="h-4 w-4 mr-1" />Check Out
          </Button>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Badge: {visit.badge_number} • {visit.purpose || ''}
        </CardDescription>
        {visit.host_name && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <User className="h-3 w-3" />{visit.host_name}
          </div>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          Checked in {format(new Date(visit.check_in_at), 'dd MMM HH:mm')}
        </div>
      </CardHeader>
    </Card>
  );
};
