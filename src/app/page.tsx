"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { ResultCard } from "@/components/ResultCard";
import { Navbar } from "@/components/Navbar";
import { FileWithPreview } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [img, setImg] = useState<FileWithPreview | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleImg = (previewImg: FileWithPreview | null) => {
    setImg(previewImg);
  };

  const handleNewUpload = () => {
    setImg(null);
  };

  const handleUploadOpenChange = (open: boolean) => {
    if (open) {
      handleNewUpload();
    }
    setIsUploadOpen(open);
  };

  return (
    <>
      <Navbar>
        <Modal
          handleImg={handleImg}
          open={isUploadOpen}
          onOpenChange={handleUploadOpenChange}
          showTrigger={Boolean(img)}
        />
      </Navbar>
      <main className="flex grow flex-col items-center justify-center p-4">
        {img ? (
          <ResultCard
            img={img.file as File}
            onScanAnother={() => handleUploadOpenChange(true)}
          />
        ) : (
          <div className="text-center">
            <h2 className="text-lg font-bold tracking-tight">
              Diagnose Your Plant
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              Upload a photo of your plant to help us identify any diseases or
              pests.
            </p>
            <div className="mt-6">
              <Button
                className="bg-violet-600 text-white hover:bg-violet-700"
                onClick={() => setIsUploadOpen(true)}
              >
                Scan Plant
              </Button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
