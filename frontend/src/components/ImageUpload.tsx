import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
// import Image from "next/image";
import axios from "axios";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPEG, PNG, GIF and WebP images are supported");
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post<{ url: string }>("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      onChange(response.data.url);
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onChange("");
  };

  return (
    <div className="space-y-2">
      {value ? (
        <Card className="relative overflow-hidden aspect-video">
          <img src={value} alt="Uploaded image" className="object-cover" />
          <Button variant="destructive" size="icon" className="absolute top-2 right-2" onClick={handleRemoveImage}>
            <X className="h-4 w-4" />
          </Button>
        </Card>
      ) : (
        <label className="cursor-pointer">
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center hover:border-gray-400 transition-colors">
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">{isUploading ? "Uploading..." : "Click to upload an image"}</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF or WebP (max. 5MB)</p>
          </div>
          <input type="file" className="hidden" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFileChange} disabled={isUploading} />
        </label>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
