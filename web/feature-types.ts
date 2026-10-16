import type { ComponentType } from "react";

export type Comment = {
  id: number;
  authorId: string;
  author: string;
  body: string;
  editedAt?: number;
};

export type Post = {
  id: number;
  title: string;
  body: string;
  preview: string;
  author: string;
  comments: Comment[];
  saved?: boolean;
  score?: number;
};

export type Api = (path: string, options?: RequestInit) => Promise<any>;

export type FeatureContext = {
  api: Api;
  refresh: () => void;
  user: string;
  query?: string;
  setQuery?: (query: string) => void;
  post?: Post;
};

export type FeatureModule = {
  Toolbar?: ComponentType<FeatureContext>;
  PostAction?: ComponentType<FeatureContext>;
  PostBody?: ComponentType<FeatureContext>;
  CommentAction?: ComponentType<FeatureContext & { comment: Comment }>;
  EmptyState?: ComponentType<{ query: string }>;
  Pagination?: ComponentType<{
    posts: Post[];
    api: Api;
    query?: string;
    setQuery?: (query: string) => void;
  }>;
};
