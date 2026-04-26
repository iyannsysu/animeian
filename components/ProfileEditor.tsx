"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Check,
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import { compressImageToDataUrl } from "@/lib/clientImage";

type Props = {
  initialName: string;
  initialImage: string | null;
  googleName: string;
  googleImage: string | null;
  hasNameOverride: boolean;
  hasImageOverride: boolean;
};

export default function ProfileEditor({
  initialName,
  initialImage,
  googleName,
  googleImage,
  hasNameOverride,
  hasImageOverride,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [image, setImage] = useState<string | null>(initialImage);
  const [imageDirty, setImageDirty] = useState(false);
  const [resetImage, setResetImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [imgBusy, setImgBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function flashOk(msg: string) {
    setOk(msg);
    setTimeout(() => setOk(null), 2200);
  }

  async function pickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgBusy(true);
    setErr(null);
    try {
      const data = await compressImageToDataUrl(file, {
        maxWidth: 360,
        maxHeight: 360,
        quality: 0.78,
        maxBytes: 200_000,
      });
      setImage(data);
      setImageDirty(true);
      setResetImage(false);
    } catch {
      setErr("Gagal memproses gambar.");
    } finally {
      setImgBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function doResetImage() {
    setImage(googleImage);
    setImageDirty(false);
    setResetImage(true);
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const trimmed = name.trim();
      const payload: Record<string, unknown> = {};
      if (trimmed && trimmed !== googleName) {
        payload.name = trimmed;
      } else if (trimmed === googleName && hasNameOverride) {
        payload.resetName = true;
      } else if (!trimmed && hasNameOverride) {
        payload.resetName = true;
      }
      if (resetImage && hasImageOverride) {
        payload.resetImage = true;
      } else if (imageDirty && image && image.startsWith("data:image/")) {
        payload.image = image;
      }
      if (!Object.keys(payload).length) {
        setErr("Tidak ada perubahan.");
        setSaving(false);
        return;
      }
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; reason?: string };
      if (!res.ok || !data.ok) {
        setErr(`Gagal: ${data.reason ?? res.status}`);
      } else {
        flashOk("Profil tersimpan.");
        setImageDirty(false);
        setResetImage(false);
        setOpen(false);
        router.refresh();
      }
    } catch {
      setErr("Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-ink-900/50 p-3">
        <div className="text-[12px] text-ink-300">
          <span className="font-semibold text-ink-100">Ubah profil — </span>
          ganti nama atau foto profil yang muncul di komentar &amp; leaderboard.
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-3 py-1.5 text-[12px] font-bold uppercase tracking-wide text-indigo-200 hover:border-indigo-400/70 hover:bg-indigo-500/25"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Profil
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={save}
      className="space-y-3 rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/10 via-fuchsia-500/5 to-ink-900/60 p-4"
    >
      <header className="flex items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-base font-bold tracking-tight">
          <Pencil className="h-4 w-4 text-indigo-300" /> Edit Profil
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink-700 bg-ink-950/60 text-ink-300 hover:bg-ink-900"
          aria-label="Tutup"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </header>

      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-full border-2 border-white/20 bg-ink-800 text-2xl font-black text-white">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="preview avatar"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{(name || "?").slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={imgBusy}
            className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg disabled:opacity-50"
            aria-label="Ganti foto"
          >
            {imgBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={pickImage}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-ink-400">
            Foto akan otomatis dikompres jadi 360×360 (≤200 KB).
          </p>
          {hasImageOverride || imageDirty ? (
            <button
              type="button"
              onClick={doResetImage}
              className="inline-flex items-center gap-1.5 self-start rounded-full border border-ink-700 bg-ink-950/60 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-300 hover:border-rose-400/40 hover:text-rose-200"
            >
              <RotateCcw className="h-3 w-3" /> Pakai foto Google
            </button>
          ) : null}
        </div>
      </div>

      <label className="block">
        <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
          Nama tampilan
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
          minLength={2}
          placeholder={googleName}
          className="mt-1 w-full rounded-xl border border-ink-800 bg-ink-950/60 px-3 py-2 text-sm text-ink-100 outline-none focus:border-indigo-400/70"
        />
        <span className="mt-1 block text-[11px] text-ink-500">
          {name.length}/40 · Kosongkan / pakai nama Google ({googleName}) untuk
          reset.
        </span>
      </label>

      {err ? <p className="text-[12px] text-rose-300">{err}</p> : null}
      {ok ? (
        <p className="inline-flex items-center gap-1 text-[12px] text-emerald-300">
          <Check className="h-3 w-3" /> {ok}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan
        </button>
      </div>
    </form>
  );
}
