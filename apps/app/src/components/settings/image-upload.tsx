"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@pilot/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@pilot/ui/components/dialog";
import { uploadImage } from "@/actions/upload";
import { ImagePlus } from "lucide-react";
import {
  Cropper,
  CropperCropArea,
  CropperDescription,
  CropperImage,
} from "../image-crop";

interface ImageUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageUploaded: (imageUrl: string) => void;
}

const cropSize = 1024;

function cropImageToSquare(img: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  canvas.width = cropSize;
  canvas.height = cropSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const size = Math.min(img.naturalWidth, img.naturalHeight);
  const offsetX = (img.naturalWidth - size) / 2;
  const offsetY = (img.naturalHeight - size) / 2;

  ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, cropSize, cropSize);

  return canvas.toDataURL("image/jpeg", 1);
}

async function uploadProfileImageAction(
  imgElement: HTMLImageElement,
  setIsUploading: (v: boolean) => void,
  onImageUploaded: (url: string) => void,
  onClose: () => void
) {
  setIsUploading(true);
  try {
    const croppedImage = cropImageToSquare(imgElement);

    const base64Image = croppedImage.replace(
      /^data:image\/[a-z]+;base64,/,
      ""
    );

    const imageUrl = await uploadImage(base64Image, "pilot-settings/profile-pictures");

    toast.success("Profile picture updated");
    onImageUploaded(imageUrl);
    onClose();
  } catch (error) {
    console.error("Error uploading image:", error);
    toast.error("Couldn't upload your photo. Try again?");
  } finally {
    setIsUploading(false);
  }
}

export function ImageUploadDialog({
  isOpen,
  onClose,
  onImageUploaded,
}: ImageUploadDialogProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target?.result) {
        setImage(e.target.result as string);
      }
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (image && imageRef.current) {
      imageRef.current.src = image;
    }
  }, [image]);

  const handleSave = useCallback(async () => {
    if (!image || !imageRef.current) return;
    await uploadProfileImageAction(imageRef.current, setIsUploading, onImageUploaded, onClose);
  }, [image, onClose, onImageUploaded]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Your Profile Photo</DialogTitle>
          <DialogDescription>
            Pick a photo and crop it to look perfect
          </DialogDescription>
        </DialogHeader>

        {/* Hidden img used by cropImageToSquare — must stay in DOM for canvas drawing */}
        <img
          ref={imageRef}
          src={image || undefined}
          alt=""
          className="absolute size-0 overflow-hidden opacity-0 pointer-events-none"
          crossOrigin="anonymous"
        />

        {!image ? (
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/30 p-10 cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <ImagePlus className="size-6 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Click to select an image</p>
              <p className="text-xs text-muted-foreground">JPG, PNG or WebP</p>
            </div>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <Cropper className="h-96 w-full max-w-2xl" image={image}>
            <CropperDescription />
            <CropperImage />
            <CropperCropArea className="rounded-none border-2 border-white" />
          </Cropper>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          {image && (
            <Button
              variant="outline"
              onClick={() => setImage(null)}
              className="flex-1"
            >
              Change image
            </Button>
          )}
          {image && (
            <Button
              onClick={handleSave}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? "Uploading..." : "Save"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
