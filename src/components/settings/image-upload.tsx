"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { uploadImage } from "@/actions/upload";
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

export function ImageUploadDialog({
  isOpen,
  onClose,
  onImageUploaded,
}: ImageUploadDialogProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const cropSize = 1024;

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

  const cropImageToSquare = (img: HTMLImageElement): string => {
    const canvas = document.createElement("canvas");
    canvas.width = cropSize;
    canvas.height = cropSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    const size = Math.min(img.width, img.height);
    const offsetX = (img.width - size) / 2;
    const offsetY = (img.height - size) / 2;

    ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, cropSize, cropSize);

    return canvas.toDataURL("image/jpeg", 1);
  };

  const handleSave = useCallback(async () => {
    if (!image || !imageRef.current) return;

    try {
      setIsUploading(true);
      const croppedImage = cropImageToSquare(imageRef.current);

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

        {image && (
          <picture>
            <img
              ref={imageRef}
              src={image}
              alt="Hidden"
              className="hidden"
              crossOrigin="anonymous"
              onLoad={() => console.log("Image loaded for cropping")}
            />
          </picture>
        )}

        {!image ? (
          <div className="flex items-center justify-center p-6">
            <div className="flex flex-col items-center gap-4">
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Select image
              </label>
              <p className="text-sm text-muted-foreground">
                Select an image to crop and use as your profile picture
              </p>
            </div>
          </div>
        ) : (
          <Cropper className="h-96 w-full max-w-2xl" image={image}>
            <CropperDescription />
            <CropperImage />
            <CropperCropArea className="rounded-none border-2 border-white" />
          </Cropper>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className={`w-full ${image ? "w-1/2" : "w-full"}`}
            >
              Cancel
            </Button>
            {image && (
              <Button
                variant="outline"
                onClick={() => setImage(null)}
                className="w-1/2"
              >
                Change image
              </Button>
            )}
          </div>

          {image && (
            <Button
              onClick={handleSave}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? "Uploading..." : "Save"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}