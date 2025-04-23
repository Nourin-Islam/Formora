import React, { useState } from "react";
import { IKContext, IKUpload, IKImage } from "imagekitio-react";
import ImageKitAuthenticator from "@/lib/ImageKitAuthenticator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { useTranslation } from "react-i18next";
interface ImageUploadProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ imageUrl, setImageUrl }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const validateFileFunction = (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError(t("Only JPEG and PNG files are allowed."));
      return false;
    }

    if (file.size > 5_000_000) {
      setError(t("Image must be less than 5MB."));
      return false;
    }

    setError("");
    return true;
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFileFunction(file)) {
      setThumbnail(file);
    }
  };

  const onUploadProgress = (progress: ProgressEvent) => {
    const percentage = ((progress.loaded / progress.total) * 100).toFixed(0);
    setUploadProgress(parseInt(percentage));
  };

  const onUploadStart = () => {
    setIsUploading(true);
  };

  const onSuccess = (res: any) => {
    setImageUrl(res.filePath);
    setThumbnail(null);
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setThumbnail(null);
    setError("");
  };

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <Card className="relative p-0 w-full h-60 overflow-hidden aspect-video">
          <IKImage urlEndpoint="https://ik.imagekit.io/odinbook" path={imageUrl} alt="Uploaded" className="object-cover w-full h-full" />
          <Button variant="destructive" size="icon" className="absolute top-2 right-2 z-10 cursor-pointer" onClick={handleRemoveImage}>
            <X className="h-4 w-4" />
          </Button>
        </Card>
      ) : (
        <IKContext publicKey="public_D3R2YXCqESRUwCNMgLufGCsa8GY=" urlEndpoint="https://ik.imagekit.io/odinbook" authenticator={ImageKitAuthenticator}>
          <label className="cursor-pointer block">
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 w-full h-40 flex flex-col items-center justify-center hover:border-gray-400 transition-colors aspect-video">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">{isUploading ? t("Uploading...") : t("Click to upload an image")}</p>
              <p className="text-xs text-gray-400 mt-1">{t("JPEG or PNG (max. 5MB)")}</p>
            </div>

            <IKUpload id="imageInput" fileName="uploaded_image.png" onChange={handleThumbnailChange} onUploadStart={onUploadStart} onUploadProgress={onUploadProgress} validateFile={validateFileFunction} onSuccess={onSuccess} accept="image/jpeg,image/png" className="hidden" />
          </label>
        </IKContext>
      )}

      {isUploading && <Progress value={uploadProgress} className="h-3 bg-muted" />}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default ImageUpload;
