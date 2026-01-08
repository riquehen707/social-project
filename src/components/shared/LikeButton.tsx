"use client";

import { HeartFilledIcon, HeartIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleLike } from "@/actions/thread";

type Props = {
  threadId: string;
  initialLiked?: boolean;
  initialCount?: number;
};

export default function LikeButton({
  threadId,
  initialLiked = false,
  initialCount = 0,
}: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      className={`action like ${liked ? "active" : ""}`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setLiked((prev) => !prev);
          setCount((prev) => prev + (liked ? -1 : 1));
          await toggleLike(threadId);
          router.refresh();
        })
      }
    >
      {liked ? <HeartFilledIcon /> : <HeartIcon />}
      {pending ? "..." : count}
    </button>
  );
}
