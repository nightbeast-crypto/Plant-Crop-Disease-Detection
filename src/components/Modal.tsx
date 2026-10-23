"use client";

"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "./FileUpload";
import { PlusIcon } from "lucide-react";
import { FileWithPreview } from "@/hooks/use-file-upload";

type ModalProps = {
  handleImg: (previewImg: FileWithPreview | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTrigger: boolean;
};

export function Modal({
  handleImg,
  open,
  onOpenChange,
  showTrigger,
}: ModalProps) {
  const [file, setFile] = useState<FileWithPreview | null>(null);

  const handleFileChange = (files: FileWithPreview[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    } else {
      setFile(null);
    }
  };

  const handleAnalyze = () => {
    if (file) {
      handleImg(file);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className="text-white bg-violet-600 hover:bg-violet-800">
            <PlusIcon size={20} className="mr-1" /> Scan Plant
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl rounded-lg dark:bg-card dark:border-border">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a photo of your plant to help us identify any diseases or
            pests.
          </DialogDescription>
        </DialogHeader>
        <FileUpload onFilesChange={handleFileChange} />
        <DialogFooter>
          <Button
            className="text-white bg-violet-600 hover:bg-violet-800"
            onClick={handleAnalyze}
            disabled={!file}
            type="submit"
          >
            Analyze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
