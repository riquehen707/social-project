import { Thread, User } from "@prisma/client";

export type ThreadWithExtras = Thread & {
  author: Pick<User, "id" | "name" | "username" | "image" | "bio">;
  likedByMe?: boolean;
  isFollowed?: boolean;
  parent?: {
    id: string;
    author: Pick<User, "id" | "name" | "username">;
  } | null;
  _count: {
    likes: number;
    replies: number;
  };
  replies?: ThreadWithExtras[];
};

export type ProfileUser = Pick<
  User,
  "id" | "name" | "username" | "bio" | "image" | "link" | "interests"
> & {
  followerCount: number;
  followingCount: number;
  isFollowedByMe?: boolean;
};
