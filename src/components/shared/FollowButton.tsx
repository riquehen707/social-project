"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleFollow } from "@/actions/thread";

type Props = {
  targetUserId: string;
  isFollowing?: boolean;
  compact?: boolean;
};

export default function FollowButton({
  targetUserId,
  isFollowing = false,
  compact = false,
}: Props) {
  const [status, setStatus] = useState(isFollowing);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const label = status ? "Seguindo" : "Seguir";

  return (
    <button
      className={`action ${status ? "" : "btn-primary"} ${
        compact ? "btn-ghost" : ""
      }`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setStatus((prev) => !prev);
          await toggleFollow(targetUserId);
          router.refresh();
        })
      }
    >
      {pending ? "..." : label}
    </button>
  );
}
