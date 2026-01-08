export type ArticleBlockType = "heading" | "paragraph" | "quote" | "image";

export type ArticleBlock = {
  id: string;
  type: ArticleBlockType;
  text?: string;
  url?: string;
  alt?: string;
  width?: number;
};

export type PostSummary = {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  tags: string[];
  publishedAt: Date;
};
