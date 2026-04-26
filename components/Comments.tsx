"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import {
  CornerDownRight,
  Heart,
  ImageIcon,
  LogIn,
  Loader2,
  Pin,
  Reply,
  Send,
  Trash2,
  X as XIcon,
} from "lucide-react";
import type { Comment } from "@/app/api/comments/[series]/route";
import LevelBadge, {
  LevelName,
  AdminBadge,
  VerifiedBadge,
} from "@/components/LevelBadge";
import { compressImageToDataUrl } from "@/lib/clientImage";

type Props = { series: string };

export default function Comments({ series }: Props) {
  const { data: session, status } = useSession();
  const [items, setItems] = useState<Comment[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyValue, setReplyValue] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [zoomImg, setZoomImg] = useState<string | null>(null);

  const url = `/api/comments/${encodeURIComponent(series)}`;

  useEffect(() => {
    let cancel = false;
    setLoading(true);
    fetch(url, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { items?: Comment[]; isAdmin?: boolean }) => {
        if (cancel) return;
        setItems(d.items ?? []);
        setIsAdmin(!!d.isAdmin);
      })
      .catch(() => {})
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [url]);

  const userId = session?.user?.id ?? null;

  const { roots, repliesByParent } = useMemo(() => {
    const roots: Comment[] = [];
    const repliesByParent = new Map<string, Comment[]>();
    for (const c of items) {
      if (c.parentId) {
        const arr = repliesByParent.get(c.parentId) ?? [];
        arr.push(c);
        repliesByParent.set(c.parentId, arr);
      } else {
        roots.push(c);
      }
    }
    // urutkan: pinned dulu, lalu newest
    roots.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.createdAt - a.createdAt;
    });
    // reply: oldest first (chronological)
    repliesByParent.forEach((arr) => {
      arr.sort((a, b) => a.createdAt - b.createdAt);
    });
    return { roots, repliesByParent };
  }, [items]);

  async function send(
    text: string,
    parentId: string | null,
    img?: string | null
  ) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: text, parentId, imageData: img ?? undefined }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      comment?: Comment;
      reason?: string;
    };
    if (!res.ok || !data.ok) {
      throw new Error(data.reason ?? "send_failed");
    }
    return data.comment!;
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = value.trim();
    if (!text && !imageData) return;
    setSending(true);
    setError(null);
    try {
      const c = await send(text, null, imageData);
      setItems((prev) => [c, ...prev]);
      setValue("");
      setImageData(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "send_failed";
      setError(
        msg === "kv_unavailable"
          ? "Database komentar belum aktif."
          : msg === "unauthorized"
          ? "Silakan login dulu."
          : msg === "too_long"
          ? "Komentar terlalu panjang (maks 1000 karakter)."
          : msg === "invalid_image"
          ? "Gambar tidak valid atau terlalu besar."
          : "Gagal mengirim komentar."
      );
    } finally {
      setSending(false);
    }
  }

  async function submitReply(parentId: string) {
    const text = replyValue.trim();
    if (!text) return;
    setReplySending(true);
    try {
      const c = await send(text, parentId, null);
      setItems((prev) => [c, ...prev]);
      setReplyValue("");
      setReplyTo(null);
    } catch {
      /* noop */
    } finally {
      setReplySending(false);
    }
  }

  async function remove(id: string) {
    const ok = confirm("Hapus komentar ini?");
    if (!ok) return;
    const res = await fetch(`${url}?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      // hapus juga semua reply
      setItems((prev) => prev.filter((c) => c.id !== id && c.parentId !== id));
    }
  }

  async function toggleLike(id: string) {
    if (status !== "authenticated") {
      signIn("google");
      return;
    }
    // optimistic
    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              likedByMe: !c.likedByMe,
              likeCount: Math.max(0, (c.likeCount ?? 0) + (c.likedByMe ? -1 : 1)),
            }
          : c
      )
    );
    try {
      const res = await fetch(`${url}/like`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        liked?: boolean;
        count?: number;
      };
      if (data.ok) {
        setItems((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, likedByMe: !!data.liked, likeCount: data.count ?? 0 }
              : c
          )
        );
      }
    } catch {
      /* noop */
    }
  }

  async function pickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageBusy(true);
    setError(null);
    try {
      const data = await compressImageToDataUrl(file, {
        maxWidth: 720,
        maxHeight: 720,
        quality: 0.72,
        maxBytes: 240_000,
      });
      setImageData(data);
    } catch {
      setError("Gagal memproses gambar. Coba gambar lain.");
    } finally {
      setImageBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function togglePin(id: string) {
    const res = await fetch(`${url}/pin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = (await res.json()) as { ok: boolean; pinned?: boolean };
    if (data.ok) {
      setItems((prev) =>
        prev.map((c) => (c.id === id ? { ...c, pinned: !!data.pinned } : c))
      );
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight sm:text-xl">
            Komentar
          </h2>
          <p className="text-xs text-ink-400 sm:text-sm">
            {items.length} komentar
          </p>
        </div>
      </div>

      {status === "authenticated" ? (
        <form
          onSubmit={submit}
          className="rounded-2xl border border-white/10 bg-ink-900/60 p-3"
        >
          <div className="flex gap-2.5">
            <Avatar
              name={session?.user?.name}
              image={session?.user?.image ?? null}
            />
            <div className="flex-1">
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder={`Tulis komentar sebagai ${
                  session?.user?.name ?? "pengguna"
                }…`}
                className="w-full resize-none rounded-xl border border-ink-800 bg-ink-950/60 p-2.5 text-sm text-ink-100 outline-none focus:border-brand-500/70"
              />
              {imageData ? (
                <div className="mt-2 inline-block max-w-[220px]">
                  <div className="relative overflow-hidden rounded-xl border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageData}
                      alt="preview"
                      className="max-h-48 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageData(null)}
                      className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
                      aria-label="Hapus gambar"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : null}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={pickImage}
              />
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={imageBusy}
                    className="inline-flex items-center gap-1 rounded-full border border-ink-700 bg-ink-950/60 px-2.5 py-1 text-[11px] font-semibold text-ink-200 hover:border-indigo-400/60 hover:text-indigo-200 disabled:opacity-50"
                  >
                    {imageBusy ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ImageIcon className="h-3 w-3" />
                    )}
                    {imageData ? "Ganti gambar" : "Tambah gambar"}
                  </button>
                  <span className="text-[11px] text-ink-500">
                    {value.length}/1000
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={sending || (!value.trim() && !imageData)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  Kirim
                </button>
              </div>
              {error ? (
                <p className="mt-2 text-xs text-rose-400">{error}</p>
              ) : null}
            </div>
          </div>
        </form>
      ) : status === "loading" ? (
        <div className="skeleton h-24 rounded-2xl" />
      ) : (
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-ink-900/60 p-3">
          <p className="text-sm text-ink-300">
            Masuk untuk menulis komentar.
          </p>
          <button
            type="button"
            onClick={() => signIn("google")}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-950/60 px-3 py-1.5 text-sm text-ink-100 hover:border-brand-500/60"
          >
            <LogIn className="h-4 w-4" />
            Masuk
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          <div className="skeleton h-16 rounded-2xl" />
          <div className="skeleton h-16 rounded-2xl" />
        </div>
      ) : !roots.length ? (
        <div className="rounded-2xl border border-dashed border-ink-800 p-6 text-center text-sm text-ink-400">
          Belum ada komentar. Jadilah yang pertama menulis.
        </div>
      ) : (
        <ul className="space-y-2">
          {roots.map((c) => (
            <li
              key={c.id}
              className={`rounded-2xl border bg-ink-900/50 p-3 ${
                c.pinned
                  ? "border-amber-400/40 shadow-[0_8px_30px_-12px_rgba(251,191,36,0.45)]"
                  : "border-white/10"
              }`}
            >
              <CommentRow
                c={c}
                userId={userId}
                isAdmin={isAdmin}
                onLike={() => toggleLike(c.id)}
                onPin={() => togglePin(c.id)}
                onDelete={() => remove(c.id)}
                onReply={() => {
                  setReplyTo((cur) => (cur === c.id ? null : c.id));
                  setReplyValue("");
                }}
                onZoomImage={(src) => setZoomImg(src)}
              />
              {/* Reply form */}
              {replyTo === c.id && status === "authenticated" ? (
                <div className="mt-3 flex gap-2 pl-10">
                  <textarea
                    value={replyValue}
                    onChange={(e) => setReplyValue(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    placeholder={`Balas ${c.userName}…`}
                    className="w-full resize-none rounded-xl border border-ink-800 bg-ink-950/60 p-2 text-sm text-ink-100 outline-none focus:border-brand-500/70"
                  />
                  <button
                    type="button"
                    onClick={() => submitReply(c.id)}
                    disabled={replySending || !replyValue.trim()}
                    className="self-start inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-500 to-fuchsia-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <Send className="h-3 w-3" /> Kirim
                  </button>
                </div>
              ) : null}
              {/* Replies */}
              {(repliesByParent.get(c.id) ?? []).length > 0 ? (
                <ul className="mt-3 space-y-2 border-l border-white/10 pl-3 sm:pl-4">
                  {(repliesByParent.get(c.id) ?? []).map((rc) => (
                    <li
                      key={rc.id}
                      className="rounded-xl border border-white/5 bg-ink-950/40 p-2.5"
                    >
                      <div className="mb-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                        <CornerDownRight className="h-3 w-3" /> Balasan
                      </div>
                      <CommentRow
                        c={rc}
                        userId={userId}
                        isAdmin={isAdmin}
                        compact
                        onLike={() => toggleLike(rc.id)}
                        onDelete={() => remove(rc.id)}
                        onZoomImage={(src) => setZoomImg(src)}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {zoomImg ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setZoomImg(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoomImg}
            alt="lampiran komentar"
            className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setZoomImg(null)}
            className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
            aria-label="Tutup"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </section>
  );
}

function CommentRow({
  c,
  userId,
  isAdmin,
  compact,
  onLike,
  onPin,
  onDelete,
  onReply,
  onZoomImage,
}: {
  c: Comment;
  userId: string | null;
  isAdmin: boolean;
  compact?: boolean;
  onLike: () => void;
  onPin?: () => void;
  onDelete: () => void;
  onReply?: () => void;
  onZoomImage?: (src: string) => void;
}) {
  const canDelete = isAdmin || (userId && c.userId === userId);
  const isMine = !!userId && c.userId === userId;
  return (
    <div
      className={`relative flex items-start gap-2.5 overflow-hidden rounded-2xl ${
        isMine
          ? "border border-indigo-400/20 bg-ink-900/40 p-3"
          : ""
      }`}
    >
      {/* Latar belakang foto profile (hanya di komentar milik kita) */}
      {isMine && c.userImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={c.userImage}
            alt=""
            aria-hidden
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/65 to-ink-950/40"
          />
        </>
      ) : null}
      <Link href={`/u/${encodeURIComponent(c.userId)}`} className="relative shrink-0">
        <Avatar name={c.userName} image={c.userImage} />
      </Link>
      <div className="relative min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/u/${encodeURIComponent(c.userId)}`}
            className="inline-flex items-center gap-1 truncate text-[13px] font-semibold hover:underline"
          >
            <LevelName
              name={c.userName}
              level={c.userLevel ?? 1}
              isAdmin={!!c.isAuthorAdmin}
            />
            {c.isAuthorVerified ? <VerifiedBadge size="xs" /> : null}
          </Link>
          {c.isAuthorAdmin ? <AdminBadge size="xs" /> : null}
          <LevelBadge level={c.userLevel ?? 1} size="xs" />
          {c.pinned ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200">
              <Pin className="h-2.5 w-2.5" /> Disematkan
            </span>
          ) : null}
          <span className="text-[11px] text-ink-500">
            {timeAgo(c.createdAt)}
          </span>
        </div>
        {c.body ? (
          <p
            className={`mt-1 whitespace-pre-wrap break-words text-ink-200 ${
              compact ? "text-[13px]" : "text-sm"
            }`}
          >
            {c.body}
          </p>
        ) : null}
        {c.imageData ? (
          <button
            type="button"
            onClick={() => onZoomImage?.(c.imageData!)}
            className="mt-2 block overflow-hidden rounded-xl border border-white/10 transition hover:border-indigo-400/50"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.imageData}
              alt="lampiran komentar"
              loading="lazy"
              className={`block ${
                compact ? "max-h-44" : "max-h-64"
              } w-auto max-w-full object-contain`}
            />
          </button>
        ) : null}
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-400">
          <button
            type="button"
            onClick={onLike}
            className={`inline-flex items-center gap-1 transition hover:text-rose-300 ${
              c.likedByMe ? "text-rose-300" : ""
            }`}
            aria-label="Suka"
          >
            <Heart
              className={`h-3.5 w-3.5 ${c.likedByMe ? "fill-rose-400" : ""}`}
            />
            <span className="tabular-nums">{c.likeCount ?? 0}</span>
          </button>
          {onReply ? (
            <button
              type="button"
              onClick={onReply}
              className="inline-flex items-center gap-1 hover:text-indigo-300"
            >
              <Reply className="h-3.5 w-3.5" /> Balas
            </button>
          ) : null}
          {isAdmin && onPin ? (
            <button
              type="button"
              onClick={onPin}
              className={`inline-flex items-center gap-1 hover:text-amber-300 ${
                c.pinned ? "text-amber-300" : ""
              }`}
            >
              <Pin className="h-3.5 w-3.5" />
              {c.pinned ? "Lepas pin" : "Sematkan"}
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="ml-auto inline-flex items-center gap-1 hover:text-rose-300"
              aria-label="Hapus"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isAdmin && c.userId !== userId ? "Hapus (admin)" : "Hapus"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Avatar({
  name,
  image,
}: {
  name?: string | null;
  image?: string | null;
}) {
  const initial = (name ?? "?").slice(0, 1).toUpperCase();
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-ink-800 text-sm font-semibold text-ink-200">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name ?? "user"}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}d`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}j`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}h`;
  return new Date(ts).toLocaleDateString("id-ID");
}
