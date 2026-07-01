import { useState, useCallback, useEffect } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Crop, Loader2 } from "lucide-react";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

async function getCroppedBlob(
  imageUrl: string,
  pixelCrop: Area,
  outputSize = { width: 600, height: 200 }
): Promise<Blob> {
  const image = await createImage(imageUrl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize.width,
    outputSize.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/png",
      1
    );
  });
}

interface SignatureCropperProps {
  file: File;
  open: boolean;
  onClose: () => void;
  onCropped: (blob: Blob) => void;
}

const ASPECT = 3 / 1;

export const SignatureCropper = ({ file, open, onClose, onCropped }: SignatureCropperProps) => {
  const [imageUrl, setImageUrl] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open && file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open, file]);

  useEffect(() => {
    return () => { if (imageUrl) URL.revokeObjectURL(imageUrl); };
  }, [imageUrl]);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedBlob(imageUrl, croppedAreaPixels);
      onCropped(blob);
      onClose();
    } catch (e) {
      console.error("Crop failed", e);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Crop className="h-4 w-4 text-primary" />
            Crop Signature
          </DialogTitle>
          <DialogDescription className="text-xs">
            Adjust the crop area to fit your signature. A 3:1 widescreen aspect ratio is recommended for documents.
          </DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-64 rounded-lg overflow-hidden bg-black/10">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={ASPECT}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex items-center gap-3 px-1">
          <span className="text-xs text-muted-foreground shrink-0">Zoom</span>
          <Slider
            value={[zoom]}
            onValueChange={([v]) => setZoom(v)}
            min={1}
            max={3}
            step={0.1}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={processing}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleCrop} disabled={processing || !croppedAreaPixels}>
            {processing ? (
              <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Processing...</>
            ) : (
              <><Crop className="h-3 w-3 mr-1" /> Crop & Upload</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
