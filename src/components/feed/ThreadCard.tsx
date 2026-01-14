import Image from "next/image";
import Link from "next/link";
import { relativeTime } from "@/lib/dates";
import { ThreadWithExtras } from "@/types/thread";
import FollowButton from "../shared/FollowButton";
import LikeButton from "../shared/LikeButton";
import ReplyButton from "./ReplyButton";

type Props = {
  thread: ThreadWithExtras;
  viewerId?: string;
  viewerUsername?: string | null;
  viewerImage?: string | null;
  showReplies?: boolean;
};

export default function ThreadCard({
  thread,
  viewerId,
  viewerUsername,
  viewerImage,
  showReplies = true,
}: Props) {
  const isOwner = thread.authorId === viewerId;

  return (
    <article className="thread-card">
      <div>
        <div className="avatar">
          <Image
            src={
              thread.author.image ||
              `https://avatar.vercel.sh/${thread.author.username}`
            }
            alt={`Avatar de ${thread.author.username}`}
            width={48}
            height={48}
          />
        </div>
      </div>
      <div>
        <div className="thread-head" style={{ gap: ".5rem" }}>
          <Link className="thread-name" href={`/profile/${thread.author.username}`}>
            {thread.author.name}
          </Link>
          <span className="thread-username">@{thread.author.username}</span>
          <Link className="thread-time" href={`/thread/${thread.id}`}>
            - {relativeTime(thread.createdAt)}
          </Link>
          {!isOwner && (
            <FollowButton
              targetUserId={thread.authorId}
              isFollowing={thread.isFollowed}
              compact
            />
          )}
        </div>

        {thread.parent && (
          <div className="chip" style={{ marginBottom: ".4rem" }}>
            Em resposta a @{thread.parent.author.username}
          </div>
        )}

        <div className="thread-body">{thread.text}</div>

        <div className="thread-actions">
          <LikeButton
            threadId={thread.id}
            initialLiked={thread.likedByMe}
            initialCount={thread._count.likes}
          />
          <ReplyButton
            threadId={thread.id}
            viewerImage={viewerImage}
            viewerUsername={viewerUsername}
            replyCount={thread._count.replies}
          />
        </div>

        {showReplies && thread.replies && thread.replies.length > 0 && (
          <div className="reply-stack">
            {thread.replies.map((reply) => (
              <div className="subthread" key={reply.id}>
                <div className="avatar" style={{ width: 40, height: 40 }}>
                  <Image
                    src={
                      reply.author.image ||
                      `https://avatar.vercel.sh/${reply.author.username}`
                    }
                    alt={`Avatar de ${reply.author.username}`}
                    width={40}
                    height={40}
                  />
                </div>
                <div>
                  <div className="thread-head" style={{ gap: ".45rem" }}>
                    <Link
                      className="thread-name"
                      href={`/profile/${reply.author.username}`}
                    >
                      {reply.author.name}
                    </Link>
                    <span className="thread-username">@{reply.author.username}</span>
                    <Link className="thread-time" href={`/thread/${reply.id}`}>
                      - {relativeTime(reply.createdAt)}
                    </Link>
                  </div>
                  <div className="thread-body">{reply.text}</div>
                  <div className="thread-actions">
                    <LikeButton
                      threadId={reply.id}
                      initialLiked={reply.likedByMe}
                      initialCount={reply._count.likes}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
