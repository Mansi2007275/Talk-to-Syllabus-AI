"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X } from "lucide-react";

interface FileUploaderProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export function FileUploader({ onFileSelect, selectedFile }: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  if (selectedFile) {
    return (
      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary border border-border">
        <div className="flex items-center gap-3">
          <File className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
        <button
          onClick={() => onFileSelect(null)}
          className="p-1.5 rounded-md hover:bg-background/50 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed
        cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-secondary/50"
        }`}
    >
      <input {...getInputProps()} />
      <Upload className="w-8 h-8 text-muted-foreground mb-3" />
      <p className="text-sm text-foreground font-medium">
        {isDragActive ? "Drop your PDF here" : "Drag & drop a PDF, or click to select"}
      </p>
      <p className="text-xs text-muted-foreground mt-1">Max file size: 10MB</p>
    </div>
  );
}
