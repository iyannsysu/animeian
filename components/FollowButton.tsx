"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Loader2, UserCheck, UserPlus } from "lucide-react";

export default function FollowButton({
  targetId,
  initialFollowing,
  initialFollowers,
}: {
  targetId: string;
  initialFollowing: boolean;
  initialFollowers: number;
}) {
  const { status } = useSession();
  const [following, setFollowing] = useState(initialFollowing);
  const [count, setCount] = useState(initialFollowers);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (status !== "authenticated") {
      signIn("google");
      return;
    }
    setBusy(true);
    const optimistic = !following;
    setFollowing(optimistic);
    setCount((c) => Math.max(0, c + (optimistic ? 1 : -1)));
    try {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetId,
          action: optimistic ? "follow" : "unfollow",
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        following?: boolean;
        followers?: number;
      };
      if (data.ok) {
        setFollowing(!!data.following);
        setCount(data.followers ?? count);
      } else {
        // revert
        setFollowing(!optimistic);
        setCount((c) => Math.max(0, c + (optimistic ? -1 : 1)));
      }
    } catch {
      setFollowing(!optimistic);
      setCount((c) => Math.max(0, c + (optimistic ? -1 : 1)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-bold uppercase tracking-wide transition disabled:opacity-60 ${
        following
          ? "border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 hover:border-rose-400/40 hover:bg-rose-500/15 hover:text-rose-200"
          : "bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white shadow-[0_8px_24px_-8px_rgba(129,140,248,0.7)]"
      }`}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : following ? (
        <UserCheck className="h-3.5 w-3.5" />
      ) : (
        <UserPlus className="h-3.5 w-3.5" />
      )}
      {following ? "Mengikuti" : "Follow"}
      <span className="ml-1 inline-flex items-center rounded-full bg-black/30 px-1.5 py-0.5 text-[10px]">
        {count.toLocaleString("id-ID")}
      </span>
    </button>
  );
}
