"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type TextareaHTMLAttributes,
} from "react";

type Suggestion = { id: string; name: string; image: string | null };

type Props = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
> & {
  value: string;
  onChange: (v: string) => void;
  /** Dipanggil saat user pilih dari autocomplete (untuk simpan mapping name→id). */
  onMention?: (name: string, id: string) => void;
};

/**
 * Textarea yang mendeteksi token "@..." sedang diketik dan memunculkan
 * popover daftar user untuk autocomplete. Insert akan menjadi "@<name> ".
 */
export default function MentionTextarea({
  value,
  onChange,
  onMention,
  className,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [token, setToken] = useState<{
    start: number;
    end: number;
    query: string;
  } | null>(null);
  const debounceRef = useRef<number | null>(null);

  function detectToken() {
    const el = ref.current;
    if (!el) return null;
    const pos = el.selectionStart ?? value.length;
    // Ambil teks dari awal sampai caret, cari @ terakhir
    const slice = value.slice(0, pos);
    const at = slice.lastIndexOf("@");
    if (at < 0) return null;
    // Pastikan @ di awal atau setelah whitespace
    if (at > 0 && !/\s/.test(value[at - 1])) return null;
    const after = value.slice(at + 1, pos);
    if (/[\s\n]/.test(after)) return null; // sudah selesai (ada spasi setelah token)
    if (after.length > 30) return null;
    return { start: at, end: pos, query: after };
  }

  useEffect(() => {
    const t = detectToken();
    if (!t) {
      setOpen(false);
      setToken(null);
      return;
    }
    setToken(t);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (t.query.length < 1) {
      setItems([]);
      setOpen(false);
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/users/search?q=${encodeURIComponent(t.query)}`,
          { cache: "no-store" }
        );
        const d = (await r.json()) as { ok: boolean; items?: Suggestion[] };
        if (d.ok) {
          setItems(d.items ?? []);
          setActive(0);
          setOpen((d.items?.length ?? 0) > 0);
        }
      } catch {
        /* noop */
      }
    }, 180);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  function pick(it: Suggestion) {
    if (!token) return;
    const before = value.slice(0, token.start);
    const after = value.slice(token.end);
    const insert = `@${it.name}`;
    const next = `${before}${insert} ${after}`.replace(/  +/g, " ");
    onChange(next);
    onMention?.(it.name, it.id);
    setOpen(false);
    setToken(null);
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const caret = (before + insert + " ").length;
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  }

  function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
  }

  function handleKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + items.length) % items.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <textarea
        {...rest}
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKey}
        className={className}
      />
      {open && items.length > 0 ? (
        <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-ink-950/95 p-1 shadow-2xl backdrop-blur">
          {items.map((it, i) => (
            <li key={it.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(it);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-[13px] ${
                  i === active
                    ? "bg-indigo-500/20 text-white"
                    : "text-ink-200 hover:bg-white/5"
                }`}
              >
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-6 w-6 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-ink-800 text-[10px] font-bold">
                    {it.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span className="truncate font-semibold">{it.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
