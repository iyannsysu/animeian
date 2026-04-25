"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

type Props = {
  title: string;
  text?: string;
  url?: string;
  className?: string;
};

export default function ShareButton({ title, text, url, className = "" }: Props) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const shareUrl =
      url ?? (typeof window !== "undefined" ? window.location.href : "");
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        /* user cancelled or unsupported */
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy link:", shareUrl);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-ink-900/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-ink-200 transition hover:border-indigo-400/50 hover:text-white ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-300" /> Tersalin
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5" /> Bagikan
        </>
      )}
    </button>
  );
}
