"use client";

import React, { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useKradlAuth } from "./Providers";

interface LogoUploadInputProps {
  value: string;
  onChange: (url: string) => void;
}

export function LogoUploadInput({ value, onChange }: LogoUploadInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated, signIn } = useKradlAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (file.size > 512 * 1024) {
      setUploadError("Max file size is 512 KB (PNG, JPG, or WebP).");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      if (!isAuthenticated) {
        const ok = await signIn();
        if (!ok) {
          setUploadError("Please sign in with your wallet to upload.");
          return;
        }
      }

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload/logo", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error || "Upload failed.");
        return;
      }
      if (json.url) {
        onChange(json.url);
      }
    } catch {
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://... or upload"
          className="flex-1 min-w-0 px-3.5 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-white outline-none"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          title="Upload PNG, JPG, or WebP (max 512 KB)"
          className="shrink-0 inline-flex items-center gap-1.5 h-[42px] px-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] hover:bg-white/10 text-xs font-mono text-white transition-colors cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {uploading ? "..." : "Upload"}
        </button>
      </div>
      {uploadError && <p className="text-[11px] font-mono text-rose-400">{uploadError}</p>}
    </div>
  );
}
