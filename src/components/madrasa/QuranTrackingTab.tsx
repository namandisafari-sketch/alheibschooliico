
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, BookOpen, Star } from "lucide-react";

export const QuranTrackingTab = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search learner..." 
            className="pl-10" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Record Progress
        </Button>
      </div>

      <Card className="border-none shadow-md bg-gradient-to-br from-card to-muted/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
            <BookOpen className="h-5 w-5" /> Hifdh & Quran Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner Name</TableHead>
                <TableHead>Current Surah</TableHead>
                <TableHead>Last Ayah</TableHead>
                <TableHead>Tajweed Score</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Last Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Umar Mukhtar</TableCell>
                <TableCell>Al-Baqarah</TableCell>
                <TableCell>145</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={`h-3 w-3 ${i <= 4 ? "fill-primary text-primary" : "text-muted"}`} />
                    ))}
                  </div>
                </TableCell>
                <TableCell><Badge variant="secondary">Memorization</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">Today, 08:30 AM</TableCell>
              </TableRow>
              {/* Add more mock data or real data from hook */}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
