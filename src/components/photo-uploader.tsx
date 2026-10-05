"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "listing-photos";
const MAX_FILES = 12;
const MAX_SIZE_MB = 8;

export function PhotoUploader({ agentId, initial = [] }: { agentId: string; initial?: string[] }) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const supabase = createClient();
    const remaining = MAX_FILES - urls.length;
    const selected = Array.from(files).slice(0, remaining);
    if (!selected.length) {
      setError(`Maximum ${MAX_FILES} photos per listing.`);
      return;
    }

    setBusy(true);
    const added: string[] = [];
    for (const file of selected) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`${file.name} is larger than ${MAX_SIZE_MB} MB.`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${agentId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
      });
      if (uploadError) {
        setError(uploadError.message);
        continue;
      }
      added.push(supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    }
    setUrls((prev) => [...prev, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {urls.map((url) => (
        <input key={url} type="hidden" name="photo_urls" value={url} />
      ))}

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {urls.map((url) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            <Image src={url} alt="" fill sizes="160px" className="object-cover" />
            <button
              type="button"
              onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}
              className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {urls.length < MAX_FILES && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white text-xs text-slate-500 hover:border-teal-600 hover:text-teal-700">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            {busy ? "Uploading…" : "Add photos"}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={busy}
              onChange={(e) => onFiles(e.target.files)}
            />
          </label>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500">
        Up to {MAX_FILES} photos, {MAX_SIZE_MB} MB each. Avoid exterior shots that identify the building — the whole point is
        that the location stays private until a Deal Room is agreed.
      </p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
