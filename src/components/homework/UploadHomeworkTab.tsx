
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, FileText, CheckCircle } from "lucide-react";

export const UploadHomeworkTab = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center p-12 text-center group hover:border-primary transition-all">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
          <Camera className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-xl mb-2 font-black">Scan Book Page</CardTitle>
        <CardDescription className="max-w-[250px] mb-6">
          Use your device camera to take a clear photo of the learner's exercise book.
        </CardDescription>
        <Button size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
          Open Camera
        </Button>
      </Card>

      <Card className="flex flex-col p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>Recent Uploads</CardTitle>
          <CardDescription>Verify your recent scans before final submission</CardDescription>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="flex items-center gap-4 p-3 rounded-lg border bg-card">
            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">IMG_20240504_1030.jpg</p>
              <p className="text-xs text-muted-foreground">Mathematics - Pg. 45</p>
            </div>
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          
          <div className="flex items-center gap-4 p-3 rounded-lg border bg-card opacity-50">
            <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
              <Upload className="h-6 w-6 text-muted-foreground animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Uploading...</p>
              <p className="text-xs text-muted-foreground">3.2 MB / 4.5 MB</p>
            </div>
          </div>
        </CardContent>
        <Button variant="outline" className="mt-auto w-full">View All Scans</Button>
      </Card>
    </div>
  );
};
