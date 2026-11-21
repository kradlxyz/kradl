"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { PROJECT_CATEGORIES, ProjectCategory } from "@kradl/shared";
import { useKradlAuth } from "./Providers";

export interface EditableProjectData {
  chainId: number;
  tokenAddress: string;
  name: string;
  symbol: string;
  tagline: string;
  description: string;
  category: string;
  logoUrl?: string | null;
  liveUrl?: string | null;
  githubUrl?: string | null;
  twitterUrl?: string | null;
  discordUrl?: string | null;
}

interface EditProjectModalProps {
  project: EditableProjectData;
  onClose: () => void;
  onSaved: () => void;
}

export function EditProjectModal({ project, onClose, onSaved }: EditProjectModalProps) {
  const { isAuthenticated, signIn } = useKradlAuth();

  const [tagline, setTagline] = useState(project.tagline || "");
  const [description, setDescription] = useState(project.description || "");
  const [category, setCategory] = useState<ProjectCategory>(
    (PROJECT_CATEGORIES.includes(project.category as ProjectCategory)
      ? project.category
      : "AI & Agents") as ProjectCategory
  );
  const [logoUrl, setLogoUrl] = useState(project.logoUrl || "");
  const [liveUrl, setLiveUrl] = useState(project.liveUrl || "");
  const [githubUrl, setGithubUrl] = useState(project.githubUrl || "");
  const [twitterUrl, setTwitterUrl] = useState(project.twitterUrl || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      if (!isAuthenticated) {
        const ok = await signIn();
        if (!ok) {
          setError("Please sign in with Ethereum to edit your project.");
          return;
        }
      }

      const res = await fetch("/api/projects/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chainId: project.chainId,
          tokenAddress: project.tokenAddress,
          name: project.name,
          symbol: project.symbol,
          tagline: tagline.trim(),
          description: description.trim(),
          category,
          logoUrl: logoUrl.trim(),
          liveUrl: liveUrl.trim(),
          githubUrl: githubUrl.trim(),
          twitterUrl: twitterUrl.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to update project metadata.");
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError("Network error while saving changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 overflow-y-auto"
    >
      <div className="w-full max-w-xl rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] p-6">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4 mb-5">
          <div>
            <h2 id="edit-project-title" className="font-display font-bold text-lg text-white">
              Edit {project.name} (${project.symbol})
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Update showcase links and details. On-chain name, ticker, and supply remain immutable.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-elevated)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
              One-Line Pitch *
            </label>
            <input
              required
              minLength={4}
              maxLength={160}
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] focus:border-[var(--border-strong)] text-sm text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-white outline-none"
              >
                {PROJECT_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-[#111114]">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Logo Image URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://kradl.xyz/icon.svg"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
              Full Description *
            </label>
            <textarea
              required
              minLength={10}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-white outline-none resize-y"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Live App URL
              </label>
              <input
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://kradl.xyz"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/kradlxyz/kradl"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
              X / Twitter URL
            </label>
            <input
              type="url"
              value={twitterUrl}
              onChange={(e) => setTwitterUrl(e.target.value)}
              placeholder="https://x.com/kradlxyz"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-sm text-white outline-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-primary)] text-[var(--accent-ink)] hover:bg-zinc-200 cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
