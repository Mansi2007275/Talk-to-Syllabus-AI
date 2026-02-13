"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { FileUploader } from "@/components/file-uploader";
import { Footer } from "@/components/footer";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export default function AdminPage() {
  const [courseName, setCourseName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file || !courseName.trim()) {
      setMessage("Please select a file and enter a course name.");
      setStatus("error");
      return;
    }

    setStatus("uploading");
    setMessage("Uploading PDF...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("course", courseName.trim());

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      if (data.status === "processing") {
        setStatus("processing");
        setMessage(
          "PDF uploaded! Processing embeddings... This may take a minute."
        );
        // Poll for completion
        pollStatus(data.documentId);
      } else {
        setStatus("success");
        setMessage(
          `Successfully processed! ${data.chunksCreated} chunks created.`
        );
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Something went wrong.");
    }
  };

  const pollStatus = async (documentId: string) => {
    // Simple poll - in production use websockets or server-sent events
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/upload/status?id=${documentId}`);
        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(interval);
          setStatus("success");
          setMessage(
            `Processing complete! ${data.chunksCreated || ""} chunks indexed.`
          );
        } else if (data.status === "error") {
          clearInterval(interval);
          setStatus("error");
          setMessage("Processing failed. Please try again.");
        }
      } catch {
        // continue polling
      }
      if (attempts > 60) {
        clearInterval(interval);
        setStatus("success");
        setMessage("Upload submitted. Processing may still be in progress.");
      }
    }, 3000);
  };

  const statusIcon = {
    idle: <Upload className="w-5 h-5" />,
    uploading: <Loader2 className="w-5 h-5 animate-spin" />,
    processing: <Loader2 className="w-5 h-5 animate-spin" />,
    success: <CheckCircle2 className="w-5 h-5 text-green-400" />,
    error: <AlertCircle className="w-5 h-5 text-red-400" />,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Admin - Upload Syllabus
        </h1>
        <p className="text-muted-foreground mb-8">
          Upload a syllabus PDF to make it available for student queries.
        </p>

        <div className="space-y-6">
          {/* Course Name */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Course Name
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Data Structures, Operating Systems"
              className="w-full px-4 py-3 rounded-lg bg-secondary border border-border
                         text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Syllabus PDF
            </label>
            <FileUploader onFileSelect={setFile} selectedFile={file} />
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={status === "uploading" || status === "processing"}
            className="w-full flex items-center justify-center gap-2 px-6 py-3
                       bg-primary text-primary-foreground rounded-lg font-medium
                       hover:bg-primary/90 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {statusIcon[status]}
            {status === "uploading"
              ? "Uploading..."
              : status === "processing"
                ? "Processing..."
                : "Upload & Process"}
          </button>

          {/* Status Message */}
          {message && (
            <div
              className={`p-4 rounded-lg border ${
                status === "success"
                  ? "bg-green-950/30 border-green-800 text-green-300"
                  : status === "error"
                    ? "bg-red-950/30 border-red-800 text-red-300"
                    : "bg-blue-950/30 border-blue-800 text-blue-300"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
